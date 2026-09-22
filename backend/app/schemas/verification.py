"""
Citation Verification Specification Schema for NyayTarka (NyaySahayak).

Enforces the 6-Check Verification Protocol:
1. Existence Check (UNVERIFIED if failed)
2. Identity Check (CONTESTED if failed)
3. Source Check (UNVERIFIED if failed)
4. Quotation Check (CONTESTED if failed)
5. Proposition Check (UNVERIFIED/CONTESTED if failed)
6. Trace Check (UNVERIFIED if failed)
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"      # Source exists, quote matches, supports claim, traceable
    PARTIAL = "PARTIAL"        # Some support, but not full proposition
    CONTESTED = "CONTESTED"    # Metadata mismatch, quote mismatch, or conflicting authority
    UNVERIFIED = "UNVERIFIED"  # Source missing, unretrievable, or hallucinated

class VerificationCheckResult(BaseModel):
    check_name: str  # "Existence", "Identity", "Source", "Quotation", "Proposition", "Trace"
    passed: bool
    status_if_failed: str
    details: str
    evidence_snippet: Optional[str] = None

class ProvenanceSpan(BaseModel):
    source_type: str  # "case_document", "bare_act", "judgment"
    document_id: str
    document_title: str
    page_number: int
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    text_span: str
    language: str = "en"
    extraction_confidence: float = 1.0
    checksum_sha256: Optional[str] = None
    source_url: Optional[str] = None

class CitationVerificationReport(BaseModel):
    citation_id: str
    raw_citation: str
    extracted_case_name: Optional[str] = None
    extracted_court: Optional[str] = None
    extracted_year: Optional[int] = None
    extracted_statute: Optional[str] = None
    extracted_section: Optional[str] = None
    
    # Verification Status
    overall_status: VerificationStatus
    
    # Results of the 6 checks
    existence_check: VerificationCheckResult
    identity_check: VerificationCheckResult
    source_check: VerificationCheckResult
    quotation_check: VerificationCheckResult
    proposition_check: VerificationCheckResult
    trace_check: VerificationCheckResult
    
    # Traceability
    provenance: Optional[ProvenanceSpan] = None
    lawyer_review_state: str = "UNREVIEWED"  # UNREVIEWED, LAWYER_REVIEW, ACCEPTED, DISPUTED, REJECTED
    lawyer_notes: Optional[str] = None
