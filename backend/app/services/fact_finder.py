"""
Fact Finder Agent for NyaySahayak.

Responsible for:
1. Extracting structured facts from document chunks using LangChain structured LLM or heuristic fallback.
2. Identifying parties and their legal roles (Petitioner, Respondent, State, Counsel).
3. Flagging disputed facts and factual contradictions across filings.
4. Retaining page-level provenance coordinates for every fact.
"""

import re
import uuid
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import FactItem, FactCategory, CaseParty
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.fact_finder")

# LangChain Structured Output Schemas
class LLMFactItem(BaseModel):
    category: FactCategory = Field(description="Category of the fact: background, procedural, substantive, disputed, or contradiction")
    description: str = Field(description="Clear factual proposition extracted from the text")
    date_context: Optional[str] = Field(default=None, description="Date or timeframe context if mentioned")
    parties_involved: List[str] = Field(default_factory=list, description="Names of parties or entities mentioned in this fact")
    confidence: float = Field(default=0.95, description="Confidence score between 0.0 and 1.0")

class LLMPartyItem(BaseModel):
    name: str = Field(description="Name of the party or entity (e.g., Kesavananda Bharati, State of Kerala)")
    role: str = Field(description="Legal role e.g., Petitioner, Respondent, Intervener, State, Counsel")
    counsel: Optional[str] = Field(default=None, description="Name of arguing advocate or senior counsel if mentioned")

class LLMFactExtractionResult(BaseModel):
    parties: List[LLMPartyItem] = Field(default_factory=list, description="Parties identified in the filing")
    facts: List[LLMFactItem] = Field(default_factory=list, description="List of structured factual statements")

class FactFinderAgent:
    """Agent for extracting structured facts, parties, and contradictions from case records."""

    @staticmethod
    def extract_facts(chunks: List[Dict[str, Any]]) -> Tuple[List[FactItem], List[CaseParty]]:
        """
        Extracts facts and parties.
        Uses LangChain structured output when LLM is configured, falling back to heuristics.
        """
        llm = get_configured_llm()
        if llm:
            try:
                return FactFinderAgent._llm_extract_facts(chunks, llm)
            except Exception as e:
                logger.warning(f"LLM fact extraction failed, falling back to heuristic: {e}")

        return FactFinderAgent._heuristic_extract_facts(chunks)

    @staticmethod
    def _llm_extract_facts(chunks: List[Dict[str, Any]], llm: Any) -> Tuple[List[FactItem], List[CaseParty]]:
        # Take the combined text from up to first 8 chunks (or 7000 chars) for party & key facts
        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)}]:\n{c.get('text_content', '')}"
            for c in chunks[:8]
        ])

        prompt = (
            "You are an expert Legal Fact-Finder Agent for the Indian judicial system (Supreme Court of India / High Courts).\n"
            "Carefully analyze the case text below. Identify the genuine legal parties, their roles, and extract key factual statements.\n\n"
            "CRITICAL EXTRACTION GUIDELINES:\n"
            "1. DO NOT extract court name headers, docket numbers, cause titles ('IN THE SUPREME COURT OF INDIA', 'WRIT PETITION NO. ...', 'VERSUS', 'CIVIL ORIGINAL JURISDICTION'), advocate appearances, index tables, or filing stamps as facts.\n"
            "2. Extract only real, substantive legal facts: key factual events, actions taken by government or parties, violations alleged, procedural milestones (filing dates, impugned orders), and disputed claims.\n"
            "3. Categorize each into one of: 'substantive', 'procedural', 'disputed', 'contradiction', or 'background'.\n\n"
            "Return ONLY a valid JSON object in this exact schema with no markdown wrapping or preamble:\n"
            "{\n"
            '  "parties": [{"name": "...", "role": "...", "counsel": "..."}],\n'
            '  "facts": [{"category": "substantive", "description": "...", "date_context": "...", "parties_involved": ["..."], "confidence": 0.95}]\n'
            "}\n\n"
            f"CASE TEXT:\n{combined_text[:7000]}"
        )

        parties_list: List[CaseParty] = []
        raw_facts: List[Dict[str, Any]] = []

        # Attempt 1: Direct JSON completion (fastest & most reliable across Groq / Gemini / OpenAI)
        try:
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            clean = content.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            # Find JSON block if extra text exists
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                clean = match.group(0)
            data = json.loads(clean)
            for p in data.get("parties", []):
                if p.get("name"):
                    raw_role = str(p.get("role", "Party"))
                    if "petitioner" in raw_role.lower() or "appellant" in raw_role.lower():
                        norm_role = "Petitioner"
                    elif "respondent" in raw_role.lower() or "state" in raw_role.lower() or "defendant" in raw_role.lower():
                        norm_role = "Respondent"
                    else:
                        norm_role = raw_role
                    parties_list.append(CaseParty(name=p["name"], role=norm_role, counsel=p.get("counsel")))
            for f in data.get("facts", []):
                if f.get("description"):
                    raw_facts.append(f)
        except Exception as e:
            logger.warning(f"Direct JSON fact extraction failed, trying structured LLM: {e}")
            try:
                structured_llm = llm.with_structured_output(LLMFactExtractionResult)
                result: LLMFactExtractionResult = structured_llm.invoke(prompt)
                parties_list = [CaseParty(name=p.name, role=p.role, counsel=p.counsel) for p in result.parties]
                raw_facts = [f.model_dump() for f in result.facts]
            except Exception as e2:
                logger.warning(f"Structured LLM also failed: {e2}")
                return FactFinderAgent._heuristic_extract_facts(chunks)

        if not parties_list:
            parties_list = [
                CaseParty(name="Petitioner / Appellant", role="Petitioner"),
                CaseParty(name="Respondent / State", role="Respondent")
            ]

        # Map LLM facts back to nearest chunk provenance
        facts: List[FactItem] = []
        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        for item in raw_facts:
            desc = item.get("description", "").strip()
            if not desc or len(desc) < 20:
                continue

            # Skip any accidental boilerplate headers
            if FactFinderAgent._is_boilerplate_line(desc):
                continue

            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                words = desc.split()[:4]
                if words and any(word.lower() in c.get("text_content", "").lower() for word in words if len(word) > 3):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            cat_str = item.get("category", "substantive").lower()
            valid_cats = {c.value: c for c in FactCategory}
            category = valid_cats.get(cat_str, FactCategory.SUBSTANTIVE)

            fact_item = FactItem(
                fact_id=f"fact_{uuid.uuid4().hex[:8]}",
                category=category,
                description=desc,
                date_context=item.get("date_context"),
                parties_involved=item.get("parties_involved", []),
                document_id=matched_doc,
                page_number=matched_page,
                text_span=desc[:200],
                confidence=float(item.get("confidence", 0.95))
            )
            facts.append(fact_item)

        if not facts:
            return FactFinderAgent._heuristic_extract_facts(chunks)

        return facts, parties_list

    @staticmethod
    def _is_boilerplate_line(line: str) -> bool:
        """Identifies courtroom headers, cause titles, docket numbers, and metadata noise."""
        clean = line.strip().upper()
        if len(clean) < 25:
            return True

        boilerplate_keywords = [
            "IN THE SUPREME COURT OF INDIA",
            "IN THE HIGH COURT OF",
            "CIVIL ORIGINAL JURISDICTION",
            "CRIMINAL APPELLATE JURISDICTION",
            "WRIT PETITION (CIVIL)",
            "WRIT PETITION (CRL)",
            "SPECIAL LEAVE PETITION",
            "CIVIL APPEAL NO",
            "CRIMINAL APPEAL NO",
            "MEMORANDUM OF WRIT PETITION",
            "ADVOCATE ON RECORD",
            "ADVOCATE FOR THE PETITIONER",
            "ADVOCATE FOR THE RESPONDENT",
            "SYNOPSIS AND LIST OF DATES",
            "TABLE OF CONTENTS",
            "BEFORE THE HON'BLE",
            "IN THE MATTER OF:",
            "VERSUS",
            "PETITIONER(S)",
            "RESPONDENT(S)",
        ]
        for kw in boilerplate_keywords:
            if kw in clean and len(line) < 120:
                return True

        # Check if line looks like pure docket / header numbering
        if re.match(r'^\s*(?:NO\.|WP|SLP|CA|CRL\.A)\s*[\d\s/\(\)\.-]+$', clean):
            return True

        # Check if line is purely uppercase and has no lowercase letters (often document title banners)
        if clean == line.strip() and not re.search(r'[a-z]', line) and len(line) < 80:
            return True

        return False

    @staticmethod
    def _heuristic_extract_facts(chunks: List[Dict[str, Any]]) -> Tuple[List[FactItem], List[CaseParty]]:
        facts: List[FactItem] = []
        parties_dict: Dict[str, str] = {}  # name -> role

        for chunk in chunks:
            text = chunk.get("text_content", "").strip()
            if not text:
                continue

            doc_id = chunk.get("provenance", {}).get("document_id", "doc_unknown")
            page_num = chunk.get("page_number", 1)

            # Extract Parties (heuristics for legal title blocks)
            FactFinderAgent._extract_parties_from_text(text, parties_dict)

            # Split into paragraphs and meaningful sentences
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
            for para in paragraphs:
                # If paragraph is long, split by sentences
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sent in sentences:
                    sent = sent.strip().replace("\n", " ")
                    # Filter out short fragments, headers, or boilerplate
                    if len(sent) < 40 or FactFinderAgent._is_boilerplate_line(sent):
                        continue

                    # Must contain standard English/Hindi words and at least one verb-like structure
                    if not re.search(r'\b(?:is|was|were|are|filed|held|ordered|enacted|challenged|stated|dated|contended|claimed|deposed|submitted|observed|denies|disputes|asserts|asserted|pleaded|argued)\b', sent, re.IGNORECASE):
                        # If no obvious verb, skip unless it contains a statutory reference
                        if not re.search(r'\b(?:article|section|act|constitution|clause)\b', sent, re.IGNORECASE):
                            continue

                    category = FactFinderAgent._categorize_fact(sent)
                    parties_in_line = [p for p in parties_dict if p.lower() in sent.lower()]

                    fact_item = FactItem(
                        fact_id=f"fact_{uuid.uuid4().hex[:8]}",
                        category=category,
                        description=sent,
                        date_context=FactFinderAgent._extract_date_snippet(sent),
                        parties_involved=parties_in_line,
                        document_id=doc_id,
                        page_number=page_num,
                        text_span=sent[:200],
                        confidence=chunk.get("extraction_confidence", 0.92)
                    )
                    facts.append(fact_item)

        # Build CaseParty list
        parties_list: List[CaseParty] = [
            CaseParty(name=name, role=role) for name, role in parties_dict.items()
        ]

        if not parties_list:
            parties_list = [
                CaseParty(name="Petitioner / Appellant", role="Petitioner"),
                CaseParty(name="Respondent / State", role="Respondent")
            ]

        return facts, parties_list

    @staticmethod
    def _categorize_fact(text: str) -> FactCategory:
        lower = text.lower()
        if any(w in lower for w in ["contradict", "conflict", "denies", "dispute", "contrary"]):
            return FactCategory.CONTRADICTION
        elif any(w in lower for w in ["alleged", "claimed", "contends", "asserts"]):
            return FactCategory.DISPUTED
        elif any(w in lower for w in ["filed", "petition", "notice", "impugned order", "appeal", "writ"]):
            return FactCategory.PROCEDURAL
        elif any(w in lower for w in ["amendment", "article", "section", "act", "constitution", "held"]):
            return FactCategory.SUBSTANTIVE
        else:
            return FactCategory.BACKGROUND

    @staticmethod
    def _extract_parties_from_text(text: str, parties_dict: Dict[str, str]) -> None:
        """Extracts petitioner, respondent, or state names from title lines."""
        if " v. " in text or " vs. " in text or " VERSUS " in text:
            parts = re.split(r'\s+(?:v\.|vs\.|VERSUS)\s+', text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                petitioner = parts[0].strip().split("\n")[-1].replace("IN THE SUPREME COURT OF INDIA", "").strip()
                respondent = parts[1].strip().split("\n")[0].strip()
                if len(petitioner) < 60:
                    parties_dict[petitioner] = "Petitioner"
                if len(respondent) < 60:
                    parties_dict[respondent] = "Respondent"

    @staticmethod
    def _extract_date_snippet(text: str) -> Optional[str]:
        date_match = re.search(r'\b(?:\d{1,2}[-/\s])?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]?\d{2,4}\b|\b(19\d{2}|20\d{2})\b', text, re.IGNORECASE)
        return date_match.group(0) if date_match else None
