"""
Unit tests and regression test suite for the 6-Check Citation Verification Engine.

Tests strict corpus-grounded verification, dependency gating, and rejection
of user-supplied data as authoritative legal evidence.
"""

import pytest
from app.services.verification_engine import CitationVerificationEngine
from app.schemas.verification import (
    VerificationStatus,
    SourceType,
    QuotationMatchStatus
)

def test_verify_valid_citation_kesavananda():
    """Real citation in corpus + supported proposition."""
    report = CitationVerificationEngine.verify_citation(
        citation_text="Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225",
        proposition_claim="Basic structure of the Constitution cannot be amended.",
        quoted_text="basic structure of the Constitution",
        source_passage="The basic structure of the Constitution of India cannot be altered or damaged by constitutional amendment.",
        document_id="user_doc_1973",
        page_number=45
    )

    assert report.overall_status == VerificationStatus.VERIFIED
    assert report.existence_check.passed is True
    assert report.identity_check.passed is True
    assert report.source_check.passed is True
    assert report.quotation_check.passed is True
    assert report.proposition_check.passed is True
    assert report.trace_check.passed is True
    assert report.authoritative_legal_trace is not None
    assert report.authoritative_legal_trace.is_authoritative is True
    assert report.user_document_trace is not None
    assert report.user_document_trace.document_id == "user_doc_1973"


# =========================================================================
# REGRESSION TEST CASES A, B, C, D, E (CRITICAL BUG FIX)
# =========================================================================

def test_case_a_fake_citation_fake_proposition_sharma_infrastructure():
    """
    Test Case A (Requirement 8):
    Deliberately fabricated test citation:
    Sharma Infrastructure Ltd. v. Union of India, (2019) 12 SCC 847
    Claim:
    Public interest constitutes a complete exception to the audi alteram partem rule.

    Expected:
    Existence = FAIL ('No authoritative corpus record found.')
    Identity = FAIL
    Source = FAIL ('User-supplied material available — not independently authoritative.')
    Quotation = FAIL
    Proposition = FAIL
    Authoritative Trace = FAIL ('User-document trace only — authoritative trace unavailable.')
    Overall = NOT_FOUND
    """
    report = CitationVerificationEngine.verify_citation(
        citation_text="Sharma Infrastructure Ltd. v. Union of India, (2019) 12 SCC 847",
        proposition_claim="Public interest constitutes a complete exception to the audi alteram partem rule.",
        quoted_text="Public interest constitutes a complete exception to audi alteram partem",
        source_passage="In situations of overriding public interest, audi alteram partem has no application whatsoever.",
        document_id="user_doc_sharma_uuid",
        page_number=14
    )

    assert report.overall_status == VerificationStatus.NOT_FOUND
    assert report.existence_check.passed is False
    assert report.existence_check.details == "No authoritative corpus record found."

    assert report.identity_check.passed is False
    assert "blocked" in report.identity_check.details.lower()

    assert report.source_check.passed is False
    assert report.source_check.details == "User-supplied material available — not independently authoritative."

    assert report.quotation_check.passed is False
    assert report.quotation_check.match_type == QuotationMatchStatus.NOT_VERIFIABLE

    assert report.proposition_check.passed is False

    assert report.trace_check.passed is False
    assert report.trace_check.details == "User-document trace only — authoritative trace unavailable."

    assert report.authoritative_legal_trace is None
    assert report.user_document_trace is not None
    assert report.user_document_trace.document_id == "user_doc_sharma_uuid"


def test_case_b_real_citation_fake_proposition():
    """
    Test Case B:
    Real citation in corpus + fake proposition asserting an invalid contradiction.

    Expected:
    Existence PASS
    Identity PASS
    Source PASS
    Proposition FAIL
    Overall CONTESTED
    """
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        proposition_claim="High Courts are strictly barred under all circumstances from entertaining Article 226 petitions whenever statutory appeal lies."
    )

    assert report.existence_check.passed is True
    assert report.identity_check.passed is True
    assert report.source_check.passed is True
    assert report.proposition_check.passed is False
    assert report.overall_status == VerificationStatus.CONTESTED


def test_case_c_real_citation_real_quotation_supported_proposition():
    """
    Test Case C:
    Real citation in corpus + real quotation + supported proposition.

    Expected:
    All 6 checks PASS
    Overall VERIFIED
    Authoritative trace with SHA256
    """
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        quoted_text="The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature",
        proposition_claim="Writ petition is maintainable despite alternative remedy when natural justice is violated."
    )

    assert report.existence_check.passed is True
    assert report.identity_check.passed is True
    assert report.source_check.passed is True
    assert report.quotation_check.passed is True
    assert report.quotation_match_type in [QuotationMatchStatus.EXACT_MATCH, QuotationMatchStatus.SUBSTANTIAL_MATCH]
    assert report.proposition_check.passed is True
    assert report.trace_check.passed is True
    assert report.authoritative_legal_trace is not None
    assert report.authoritative_legal_trace.checksum_sha256 is not None
    assert report.overall_status == VerificationStatus.VERIFIED


def test_case_d_real_citation_quotation_taken_out_of_context():
    """
    Test Case D:
    Real citation in corpus + quote exists in text, but asserted proposition is contradictory/unsupported.

    Expected:
    Existence PASS
    Identity PASS
    Source PASS
    Quotation PASS
    Proposition FAIL
    Overall CONTESTED
    """
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        quoted_text="The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature",
        proposition_claim="Trade mark registry decisions can never be questioned in any High Court."
    )

    assert report.existence_check.passed is True
    assert report.identity_check.passed is True
    assert report.source_check.passed is True
    assert report.quotation_check.passed is True
    assert report.proposition_check.passed is False
    assert report.overall_status == VerificationStatus.CONTESTED


def test_case_e_fabricated_pdf_cannot_pass_authoritative_source():
    """
    Test Case E:
    User-uploaded fabricated PDF with fabricated citation.
    Authoritative source must NOT pass solely from uploaded PDF.
    """
    report = CitationVerificationEngine.verify_citation(
        citation_text="Fabricated Engineering Ltd. v. State of Maharashtra, (2022) 5 SCC 999",
        document_id="user_uploaded_fabricated.pdf",
        page_number=3,
        source_passage="Arbitrary fabricated text inserted into user document."
    )

    assert report.source_check.passed is False
    assert report.source_check.source_type == SourceType.USER_SUPPLIED
    assert report.source_check.details == "User-supplied material available — not independently authoritative."
    assert report.trace_check.passed is False
    assert report.trace_check.details == "User-document trace only — authoritative trace unavailable."
    assert report.authoritative_legal_trace is None
    assert report.user_document_trace is not None
    assert report.user_document_trace.document_id == "user_uploaded_fabricated.pdf"
    assert report.overall_status == VerificationStatus.NOT_FOUND


def test_verify_unverified_missing_source():
    """Missing citation and unretrievable source."""
    report = CitationVerificationEngine.verify_citation(
        citation_text="Uncertain Case Name Without Citation",
        document_id=None,
        page_number=None
    )

    assert report.overall_status in [VerificationStatus.NOT_FOUND, VerificationStatus.UNVERIFIED]
    assert report.trace_check.passed is False
    assert report.existence_check.passed is False
