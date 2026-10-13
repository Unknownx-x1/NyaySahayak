"""
Citation Verification Specification Schema for NyayTarka (NyaySahayak).

Enforces the 6-Check Verification Protocol:
1. Existence Check (NOT_FOUND / UNVERIFIED if failed)
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
    UNVERIFIED = "UNVERIFIED"  # Source missing, unretrievable, or ungrounded
    NOT_FOUND = "NOT_FOUND"    # Record absent from authoritative legal corpus

class SourceType(str, Enum):
    USER_SUPPLIED = "USER_SUPPLIED"
    CORPUS = "CORPUS"
    OFFICIAL_COURT = "OFFICIAL_COURT"
    OFFICIAL_LEGISLATION = "OFFICIAL_LEGISLATION"

class QuotationMatchStatus(str, Enum):
    EXACT_MATCH = "EXACT_MATCH"
    SUBSTANTIAL_MATCH = "SUBSTANTIAL_MATCH"
    MISMATCH = "MISMATCH"
    NOT_VERIFIABLE = "NOT_VERIFIABLE"

class VerificationCheckResult(BaseModel):
    check_name: str  # "Existence", "Identity", "Source", "Quotation", "Proposition", "Trace"
    passed: bool
    status_if_failed: str
    details: str
    evidence_snippet: Optional[str] = None
    source_type: Optional[SourceType] = None
    match_type: Optional[QuotationMatchStatus] = None

class UserDocumentTrace(BaseModel):
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    is_user_supplied: bool = True
    details: Optional[str] = "User-supplied material — not independently authoritative."

class AuthoritativeLegalTrace(BaseModel):
    corpus_document_id: Optional[str] = None
    case_title: Optional[str] = None
    citation_string: Optional[str] = None
    court: Optional[str] = None
    paragraph_number: Optional[int] = None
    page_number: Optional[int] = None
    source_url: Optional[str] = None
    checksum_sha256: Optional[str] = None
    is_authoritative: bool = True
    details: Optional[str] = None

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
    
    # Explicit Source Classification & Quotation Status
    source_type: Optional[SourceType] = None
    quotation_match_type: Optional[QuotationMatchStatus] = None

    # Separate Authoritative Legal Trace and User Document Trace
    user_document_trace: Optional[UserDocumentTrace] = None
    authoritative_legal_trace: Optional[AuthoritativeLegalTrace] = None

    # Traceability
    provenance: Optional[ProvenanceSpan] = None
    lawyer_review_state: str = "UNREVIEWED"  # UNREVIEWED, LAWYER_REVIEW, ACCEPTED, DISPUTED, REJECTED
    lawyer_notes: Optional[str] = None
