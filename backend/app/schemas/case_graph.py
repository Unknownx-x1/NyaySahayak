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
from pydantic import BaseModel, Field, model_validator

class FactCategory(str, Enum):
    BACKGROUND = "background"
    PROCEDURAL = "procedural"
    SUBSTANTIVE = "substantive"
    DISPUTED = "disputed"
    CONTRADICTION = "contradiction"

class EvidenceType(str, Enum):
    CLAIM = "CLAIM"
    FACT = "FACT"
    EXHIBIT = "EXHIBIT"
    AFFIDAVIT = "AFFIDAVIT"
    JUDGMENT = "JUDGMENT"
    STATUTE = "STATUTE"
    PROCEDURAL_RECORD = "PROCEDURAL_RECORD"
    DOCUMENT_METADATA = "DOCUMENT_METADATA"
    
    # Backward compatibility aliases
    DOCUMENTARY = "documentary"
    WITNESS_STATEMENT = "witness_statement"
    STATUTORY_ACT = "statutory_act"

class ClaimedStrength(str, Enum):
    STRONG = "STRONG"
    MODERATE = "MODERATE"
    WEAK = "WEAK"
    MISSING = "MISSING"
    UNKNOWN = "UNKNOWN"

# Backward compatibility alias
EvidenceStrength = ClaimedStrength

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    CLAIMED = "CLAIMED"
    UNVERIFIED = "UNVERIFIED"
    CONTESTED = "CONTESTED"
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
    claimed_strength: ClaimedStrength = ClaimedStrength.MODERATE
    strength: str = "MODERATE"  # Backward compatibility
    verification_status: VerificationStatus = VerificationStatus.CLAIMED
    exhibit_id: Optional[str] = None
    claimed_by: Optional[str] = None
    basis: Optional[str] = None
    adversarial_challenge: Optional[str] = None
    vulnerability_note: Optional[str] = None  # Backward compatibility
    missing_evidence: bool = False
    conflict: bool = False
    conflict_type: Optional[str] = None
    conflict_positions: List[str] = Field(default_factory=list)
    related_evidence_ids: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    admissibility_status: Optional[str] = None
    document_id: str
    page_number: int
    text_span: str

    @model_validator(mode="before")
    @classmethod
    def _sync_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sync claimed_strength and strength
            if "claimed_strength" in data and "strength" not in data:
                val = data["claimed_strength"]
                data["strength"] = val.value if hasattr(val, "value") else str(val)
            elif "strength" in data and "claimed_strength" not in data:
                val = data["strength"]
                val_str = val.value if hasattr(val, "value") else str(val)
                try:
                    data["claimed_strength"] = ClaimedStrength(val_str.upper())
                except ValueError:
                    data["claimed_strength"] = ClaimedStrength.MODERATE
            elif "claimed_strength" in data and "strength" in data:
                # Keep them aligned
                val = data["claimed_strength"]
                data["strength"] = val.value if hasattr(val, "value") else str(val)

            # Sync adversarial_challenge and vulnerability_note
            if "adversarial_challenge" in data and "vulnerability_note" not in data:
                data["vulnerability_note"] = data["adversarial_challenge"]
            elif "vulnerability_note" in data and "adversarial_challenge" not in data:
                data["adversarial_challenge"] = data["vulnerability_note"]
        return data

    @classmethod
    def from_dict(cls, data: Any) -> "EvidenceItem":
        return cls(**data)

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
