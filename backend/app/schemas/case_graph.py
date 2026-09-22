"""
Master Case Graph Schema Definition for NyaySahayak.

Architectural Rule:
The Case Graph is the single structured legal context consumed by all downstream AI agents
(Opposing Counsel, Bench Judge, Ethics Checker, Coach).

Unified Schema:
CASE -> Metadata -> Parties/Entities -> Facts -> Timeline -> Evidence -> Legal Issues -> Provenance
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class FactCategory(str, Enum):
    BACKGROUND = "background"
    PROCEDURAL = "procedural"
    SUBSTANTIVE = "substantive"
    DISPUTED = "disputed"
    CONTRADICTION = "contradiction"

class EvidenceType(str, Enum):
    DOCUMENTARY = "documentary"
    AFFIDAVIT = "affidavit"
    WITNESS_STATEMENT = "witness_statement"
    STATUTORY_ACT = "statutory_act"
    EXHIBIT = "exhibit"

class EvidenceStrength(str, Enum):
    STRONG = "STRONG"
    MODERATE = "MODERATE"
    WEAK = "WEAK"
    MISSING = "MISSING"

class FactItem(BaseModel):
    fact_id: str
    category: FactCategory
    description: str
    date_context: Optional[str] = None
    parties_involved: List[str] = Field(default_factory=list)
    document_id: str
    page_number: int
    text_span: str
    confidence: float = 1.0

class TimelineEvent(BaseModel):
    event_id: str
    date_str: str
    raw_date: Optional[str] = None
    event_summary: str
    is_approximate: bool = False
    is_conflicting: bool = False
    conflict_notes: Optional[str] = None
    document_id: str
    page_number: int
    text_span: str

class EvidenceItem(BaseModel):
    evidence_id: str
    title: str
    evidence_type: EvidenceType
    claim_supported: str
    strength: EvidenceStrength
    notes: Optional[str] = None
    admissibility_status: Optional[str] = None
    vulnerability_note: Optional[str] = None
    document_id: str
    page_number: int
    text_span: str

class LegalIssue(BaseModel):
    issue_id: str
    title: str
    question_text: str
    relevant_fact_ids: List[str] = Field(default_factory=list)
    relevant_evidence_ids: List[str] = Field(default_factory=list)
    governing_statutes: List[str] = Field(default_factory=list)

class CaseParty(BaseModel):
    name: str
    role: str  # e.g., "Petitioner", "Respondent", "Intervener", "Witness"
    counsel: Optional[str] = None

class CaseGraph(BaseModel):
    version: str = "1.0"
    case_id: str
    case_title: str
    court_type: str
    parties: List[CaseParty] = Field(default_factory=list)
    facts: List[FactItem] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    evidence_map: List[EvidenceItem] = Field(default_factory=list)
    legal_issues: List[LegalIssue] = Field(default_factory=list)
    summary: Optional[str] = None
    created_at: Optional[str] = None
