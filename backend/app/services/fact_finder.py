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
        # Take the combined text from up to first 5 chunks (or 6000 chars) for party & key facts
        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)}]:\n{c.get('text_content', '')}"
            for c in chunks[:8]
        ])

        prompt = (
            "You are an expert Legal Fact-Finder Agent for the Indian judicial system (Supreme Court / High Courts).\n"
            "Carefully analyze the case text below. Identify all legal parties, their roles, and extract key factual statements.\n"
            "Categorize each fact into: background, procedural, substantive, disputed, or contradiction.\n\n"
            f"{combined_text[:7000]}"
        )

        structured_llm = llm.with_structured_output(LLMFactExtractionResult)
        result: LLMFactExtractionResult = structured_llm.invoke(prompt)

        parties_list: List[CaseParty] = [
            CaseParty(name=p.name, role=p.role, counsel=p.counsel)
            for p in result.parties
        ]

        if not parties_list:
            parties_list = [
                CaseParty(name="Petitioner / State", role="Petitioner"),
                CaseParty(name="Respondent Counsel", role="Respondent")
            ]

        # Map LLM facts back to nearest chunk provenance
        facts: List[FactItem] = []
        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        for item in result.facts:
            # Match to specific chunk if possible
            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                if any(word in c.get("text_content", "") for word in item.description.split()[:4]):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            fact_item = FactItem(
                fact_id=f"fact_{uuid.uuid4().hex[:8]}",
                category=item.category,
                description=item.description,
                date_context=item.date_context,
                parties_involved=item.parties_involved,
                document_id=matched_doc,
                page_number=matched_page,
                text_span=item.description[:200],
                confidence=item.confidence
            )
            facts.append(fact_item)

        return facts, parties_list

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

            # Categorize paragraphs into structured facts
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            for line in lines:
                if len(line) < 20:
                    continue

                category = FactFinderAgent._categorize_fact(line)
                
                # Check for parties involved in this line
                parties_in_line = [p for p in parties_dict if p.lower() in line.lower()]

                fact_item = FactItem(
                    fact_id=f"fact_{uuid.uuid4().hex[:8]}",
                    category=category,
                    description=line,
                    date_context=FactFinderAgent._extract_date_snippet(line),
                    parties_involved=parties_in_line,
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=line[:200],
                    confidence=chunk.get("extraction_confidence", 0.95)
                )
                facts.append(fact_item)

        # Build CaseParty list
        parties_list: List[CaseParty] = [
            CaseParty(name=name, role=role) for name, role in parties_dict.items()
        ]

        if not parties_list:
            parties_list = [
                CaseParty(name="Petitioner / State", role="Petitioner"),
                CaseParty(name="Respondent Counsel", role="Respondent")
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
