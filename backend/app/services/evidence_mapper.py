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
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import EvidenceItem, EvidenceType, EvidenceStrength, LegalIssue
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.evidence_mapper")

# LangChain Structured Output Schemas
class LLMEvidenceItem(BaseModel):
    title: str = Field(description="Title of exhibit or evidence item, e.g., 'Annexure P-1: Impugned Order'")
    evidence_type: EvidenceType = Field(description="documentary, affidavit, witness_statement, statutory_act, or exhibit")
    claim_supported: str = Field(description="The factual claim or assertion supported by this evidence")
    strength: EvidenceStrength = Field(description="STRONG, MODERATE, WEAK, or MISSING")
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
            "You are an expert Legal Evidence Auditor for Indian courtroom proceedings.\n"
            "Analyze the case text below. Identify all exhibits, annexures, affidavits, and statutory materials.\n"
            "Rate each piece of evidence as STRONG (official/certified/unanimous), MODERATE, WEAK (uncorroborated/oral), or MISSING.\n"
            "Extract the core questions of law / legal issues presented.\n\n"
            f"{combined_text[:7000]}"
        )

        structured_llm = llm.with_structured_output(LLMEvidenceExtractionResult)
        result: LLMEvidenceExtractionResult = structured_llm.invoke(prompt)

        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        evidence_list: List[EvidenceItem] = []
        for item in result.evidence_items:
            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                if any(w in c.get("text_content", "") for w in item.title.split()[:3]):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            ev = EvidenceItem(
                evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                title=item.title,
                evidence_type=item.evidence_type,
                claim_supported=item.claim_supported,
                strength=item.strength,
                notes=item.notes or "Extracted by Evidence Mapper Agent",
                document_id=matched_doc,
                page_number=matched_page,
                text_span=item.claim_supported[:200]
            )
            evidence_list.append(ev)

        issues_list: List[LegalIssue] = []
        for issue in result.legal_issues:
            iss = LegalIssue(
                issue_id=f"iss_{uuid.uuid4().hex[:8]}",
                title=issue.title,
                question_text=issue.question_text,
                relevant_fact_ids=[],
                relevant_evidence_ids=[e.evidence_id for e in evidence_list[:2]],
                governing_statutes=issue.governing_statutes
            )
            issues_list.append(iss)

        if not issues_list:
            issues_list.append(LegalIssue(
                issue_id="iss_core_01",
                title="Constitutional & Statutory Validity Issue",
                question_text="Whether the impugned legislative action violates constitutional provisions or basic structure principles?",
                governing_statutes=["Constitution of India"]
            ))

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
            if any(w in text.lower() for w in ["exhibit", "affidavit", "annexure", "witness", "gazette", "statute", "bare act"]):
                ev_type = EvidenceMapper._determine_evidence_type(text)
                strength = EvidenceMapper._determine_strength(text)

                item = EvidenceItem(
                    evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                    title=EvidenceMapper._extract_evidence_title(text),
                    evidence_type=ev_type,
                    claim_supported=text[:180],
                    strength=strength,
                    notes="Directly referenced in petition filing" if strength == EvidenceStrength.STRONG else "Requires corroborating documentation",
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=text[:200]
                )
                evidence_list.append(item)

            # Detect Legal Issues / Questions
            if any(w in text.lower() for w in ["question of law", "issue", "whether", "validity of", "ultra vires"]):
                issue = LegalIssue(
                    issue_id=f"iss_{uuid.uuid4().hex[:8]}",
                    title=text[:80].strip(),
                    question_text=text[:250].strip(),
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
