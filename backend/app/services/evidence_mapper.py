"""
Evidence Mapping Engine for NyaySahayak.

Responsible for:
1. Identifying documentary evidence, affidavits, witness statements, and statutory exhibits.
2. Linking evidence items to legal claims supported using LangChain structured LLM or heuristic fallback.
3. Rating evidence strength (STRONG, MODERATE, WEAK, MISSING).
4. Extracting grounded legal issues and evidentiary gap warnings.
"""

import re
import uuid
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import EvidenceItem, EvidenceType, EvidenceStrength, LegalIssue
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.evidence_mapper")

# LangChain / JSON Schemas
class LLMEvidenceItem(BaseModel):
    title: str = Field(description="Title of exhibit or evidence item, e.g., 'Annexure P-1: Impugned Order'")
    evidence_type: EvidenceType = Field(description="documentary, affidavit, witness_statement, statutory_act, or exhibit")
    claim_supported: str = Field(description="The factual claim or assertion supported by this evidence")
    strength: EvidenceStrength = Field(description="STRONG, MODERATE, WEAK, or MISSING")
    admissibility_status: Optional[str] = Field(default=None, description="Admissibility classification under Indian Evidence Act / BSA")
    vulnerability_note: Optional[str] = Field(default=None, description="How opposing counsel will challenge or scrutinize this evidence")
    notes: Optional[str] = Field(default=None, description="Evidentiary value or reason for rating")

class LLMLegalIssue(BaseModel):
    title: str = Field(description="Concise title of the legal issue")
    question_text: str = Field(description="Precise question of law or constitutional matter to be adjudicated")
    governing_statutes: List[str] = Field(default_factory=list, description="Relevant Acts, Sections, or Articles")

class LLMEvidenceExtractionResult(BaseModel):
    evidence_items: List[LLMEvidenceItem] = Field(default_factory=list, description="Identified documentary exhibits and affidavits")
    legal_issues: List[LLMLegalIssue] = Field(default_factory=list, description="Core legal and constitutional questions")

class EvidenceMapper:
    """Engine for mapping evidence items to legal claims and identifying legal issues."""

    @staticmethod
    def map_evidence(chunks: List[Dict[str, Any]]) -> Tuple[List[EvidenceItem], List[LegalIssue]]:
        """
        Maps evidence and extracts legal issues.
        Uses LangChain structured output when LLM is configured, falling back to heuristics.
        """
        llm = get_configured_llm()
        if llm:
            try:
                return EvidenceMapper._llm_map_evidence(chunks, llm)
            except Exception as e:
                logger.warning(f"LLM evidence mapping failed, falling back to heuristic: {e}")

        return EvidenceMapper._heuristic_map_evidence(chunks)

    @staticmethod
    def _llm_map_evidence(chunks: List[Dict[str, Any]], llm: Any) -> Tuple[List[EvidenceItem], List[LegalIssue]]:
        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)}]:\n{c.get('text_content', '')}"
            for c in chunks[:8]
        ])

        prompt = (
            "You are an expert Legal Evidence Auditor & Senior Advocate for Indian courtroom proceedings.\n"
            "Analyze the case text below. Identify all documentary exhibits, annexures (e.g. Annexure P-1, Exhibit A), affidavits, statutory provisions, and government gazettes mentioned.\n\n"
            "For each evidence item, determine:\n"
            "1. title: Exhibit/document title (e.g., 'Annexure P-1: Impugned Land Reforms Notification')\n"
            "2. evidence_type: 'documentary', 'affidavit', 'witness_statement', 'statutory_act', or 'exhibit'\n"
            "3. claim_supported: Substantive factual/legal assertion proved by this document\n"
            "4. strength: 'STRONG' (certified public document/gazette/uncontested), 'MODERATE' (private document/secondary copy), 'WEAK' (uncorroborated/oral), or 'MISSING'\n"
            "5. admissibility_status: Precise status under Indian Evidence Act / Bharatiya Sakshya Adhiniyam (e.g., 'Primary Evidence under Section 62', 'Secondary Evidence requiring Section 65 proof', 'Statutory presumption under Section 79')\n"
            "6. vulnerability_note: Specific adversarial attack angle / objection opposing counsel will raise in court\n"
            "7. notes: Strategic evidentiary commentary\n\n"
            "Also identify 2-4 core questions of law / legal issues presented.\n\n"
            "Return ONLY a valid JSON object in this exact schema with no markdown wrapping or preamble:\n"
            "{\n"
            '  "evidence_items": [\n'
            '    {\n'
            '      "title": "...",\n'
            '      "evidence_type": "documentary",\n'
            '      "claim_supported": "...",\n'
            '      "strength": "STRONG",\n'
            '      "admissibility_status": "...",\n'
            '      "vulnerability_note": "...",\n'
            '      "notes": "..."\n'
            '    }\n'
            '  ],\n'
            '  "legal_issues": [\n'
            '    {\n'
            '      "title": "...",\n'
            '      "question_text": "...",\n'
            '      "governing_statutes": ["..."]\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            f"CASE TEXT:\n{combined_text[:7000]}"
        )

        raw_evidence: List[Dict[str, Any]] = []
        raw_issues: List[Dict[str, Any]] = []

        try:
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            clean = content.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                clean = match.group(0)
            data = json.loads(clean)
            raw_evidence = data.get("evidence_items", [])
            raw_issues = data.get("legal_issues", [])
        except Exception as e:
            logger.warning(f"Direct JSON evidence mapping failed, trying structured LLM: {e}")
            try:
                structured_llm = llm.with_structured_output(LLMEvidenceExtractionResult)
                result: LLMEvidenceExtractionResult = structured_llm.invoke(prompt)
                raw_evidence = [item.model_dump() for item in result.evidence_items]
                raw_issues = [iss.model_dump() for iss in result.legal_issues]
            except Exception as e2:
                logger.warning(f"Structured LLM evidence mapping failed: {e2}")
                return EvidenceMapper._heuristic_map_evidence(chunks)

        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        evidence_list: List[EvidenceItem] = []
        for item in raw_evidence:
            title = item.get("title", "").strip()
            if not title:
                continue

            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                words = title.split()[:3]
                if words and any(w.lower() in c.get("text_content", "").lower() for w in words if len(w) > 3):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            ev_type_str = item.get("evidence_type", "documentary").lower()
            valid_types = {t.value: t for t in EvidenceType}
            ev_type = valid_types.get(ev_type_str, EvidenceType.DOCUMENTARY)

            strength_str = item.get("strength", "MODERATE").upper()
            valid_strengths = {s.value: s for s in EvidenceStrength}
            strength = valid_strengths.get(strength_str, EvidenceStrength.MODERATE)

            claim = item.get("claim_supported", title)
            admissibility = item.get("admissibility_status") or (
                "Admissible as Primary Evidence under Section 62" if strength == EvidenceStrength.STRONG
                else "Secondary Evidence subject to Section 65 condition"
            )
            vulnerability = item.get("vulnerability_note") or (
                "Opposing counsel may contest veracity without original certified copy or verification affidavit."
            )

            ev = EvidenceItem(
                evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                title=title,
                evidence_type=ev_type,
                claim_supported=claim,
                strength=strength,
                admissibility_status=admissibility,
                vulnerability_note=vulnerability,
                notes=item.get("notes") or "Audited by Evidence Mapper Agent",
                document_id=matched_doc,
                page_number=matched_page,
                text_span=claim[:200]
            )
            evidence_list.append(ev)

        issues_list: List[LegalIssue] = []
        for issue in raw_issues:
            iss_title = issue.get("title", "").strip()
            iss_q = issue.get("question_text", "").strip()
            if not iss_title and not iss_q:
                continue
            iss = LegalIssue(
                issue_id=f"iss_{uuid.uuid4().hex[:8]}",
                title=iss_title or "Key Question of Law",
                question_text=iss_q or iss_title,
                relevant_fact_ids=[],
                relevant_evidence_ids=[e.evidence_id for e in evidence_list[:2]],
                governing_statutes=issue.get("governing_statutes", ["Constitution of India"])
            )
            issues_list.append(iss)

        if not issues_list:
            issues_list.append(LegalIssue(
                issue_id="iss_core_01",
                title="Constitutional & Statutory Validity Issue",
                question_text="Whether the impugned legislative or executive action violates constitutional rights or statutory boundaries?",
                governing_statutes=["Constitution of India"]
            ))

        if not evidence_list:
            return EvidenceMapper._heuristic_map_evidence(chunks)

        return evidence_list, issues_list

    @staticmethod
    def _heuristic_map_evidence(chunks: List[Dict[str, Any]]) -> Tuple[List[EvidenceItem], List[LegalIssue]]:
        evidence_list: List[EvidenceItem] = []
        issues_list: List[LegalIssue] = []

        for chunk in chunks:
            text = chunk.get("text_content", "").strip()
            if not text:
                continue

            doc_id = chunk.get("provenance", {}).get("document_id", "doc_unknown")
            page_num = chunk.get("page_number", 1)

            # Detect Evidence items
            if any(w in text.lower() for w in ["exhibit", "affidavit", "annexure", "witness", "gazette", "statute", "bare act", "notification", "agreement", "record"]):
                ev_type = EvidenceMapper._determine_evidence_type(text)
                strength = EvidenceMapper._determine_strength(text)

                admissibility = (
                    "Admissible as Official Public Document under Section 74/79" if strength == EvidenceStrength.STRONG
                    else "Secondary Evidence; Requires proof of execution under Section 65"
                )
                vulnerability = (
                    "Opposing counsel may object if original certified copy or verification affidavit is omitted from court record."
                )

                title = EvidenceMapper._extract_evidence_title(text)
                if len(title) > 15:
                    item = EvidenceItem(
                        evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                        title=title,
                        evidence_type=ev_type,
                        claim_supported=text[:220].replace("\n", " "),
                        strength=strength,
                        admissibility_status=admissibility,
                        vulnerability_note=vulnerability,
                        notes="Directly referenced in case record" if strength == EvidenceStrength.STRONG else "Requires corroborating documentation",
                        document_id=doc_id,
                        page_number=page_num,
                        text_span=text[:200].replace("\n", " ")
                    )
                    evidence_list.append(item)

            # Detect Legal Issues / Questions
            if any(w in text.lower() for w in ["question of law", "issue", "whether", "validity of", "ultra vires"]):
                clean_line = text.split("\n")[0].strip()
                if len(clean_line) > 20:
                    issue = LegalIssue(
                        issue_id=f"iss_{uuid.uuid4().hex[:8]}",
                        title=clean_line[:80],
                        question_text=text[:250].strip().replace("\n", " "),
                        relevant_fact_ids=[],
                        relevant_evidence_ids=[e.evidence_id for e in evidence_list[:2]],
                        governing_statutes=EvidenceMapper._extract_statutes(text)
                    )
                    issues_list.append(issue)

        # Fallback Issue if none extracted
        if not issues_list:
            issues_list.append(LegalIssue(
                issue_id="iss_core_01",
                title="Constitutional & Statutory Validity Issue",
                question_text="Whether the impugned legislative action violates constitutional provisions or basic structure principles?",
                governing_statutes=["Constitution of India"]
            ))

        return evidence_list, issues_list

    @staticmethod
    def _determine_evidence_type(text: str) -> EvidenceType:
        lower = text.lower()
        if "affidavit" in lower:
            return EvidenceType.AFFIDAVIT
        elif "witness" in lower or "deposed" in lower:
            return EvidenceType.WITNESS_STATEMENT
        elif "act" in lower or "section" in lower or "article" in lower:
            return EvidenceType.STATUTORY_ACT
        elif "exhibit" in lower or "annexure" in lower:
            return EvidenceType.EXHIBIT
        else:
            return EvidenceType.DOCUMENTARY

    @staticmethod
    def _determine_strength(text: str) -> EvidenceStrength:
        lower = text.lower()
        if any(w in lower for w in ["certified copy", "official gazette", "unanimous", "undisputed"]):
            return EvidenceStrength.STRONG
        elif any(w in lower for w in ["oral", "uncorroborated", "unclear"]):
            return EvidenceStrength.WEAK
        else:
            return EvidenceStrength.MODERATE

    @staticmethod
    def _extract_evidence_title(text: str) -> str:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        return lines[0][:60] if lines else "Documentary Evidence Item"

    @staticmethod
    def _extract_statutes(text: str) -> List[str]:
        statutes = []
        if "constitution" in text.lower() or "article" in text.lower():
            statutes.append("Constitution of India")
        if "land reforms" in text.lower():
            statutes.append("Kerala Land Reforms Act, 1963")
        if "code of civil procedure" in text.lower() or "cpc" in text.lower():
            statutes.append("Code of Civil Procedure, 1908")
        return statutes or ["Indian Statutory Provisions"]
