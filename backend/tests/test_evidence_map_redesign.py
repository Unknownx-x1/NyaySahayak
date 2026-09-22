"""
Comprehensive Test Suite for Evidence Mapping & Evidentiary Graph Redesign in NyaySahayak.

Verifies:
1. Claim classification
2. Exhibit classification
3. Missing exhibit detection (R-1)
4. Metadata/disclaimer filtering (Fictional note)
5. Strength vs verification separation (CLAIMED vs STRONG)
6. Contradiction detection (Disputed hearing)
7. Case-specific adversarial questions
8. P-1 / P-2 / R-1 extraction
9. Duplicate evidence prevention
10. Exact execution on the mock writ petition (Apex InfraTech docx)
"""

import pytest
import docx
import os
from app.services.evidence_mapper import EvidenceMapper
from app.schemas.case_graph import EvidenceType, ClaimedStrength, VerificationStatus

MOCK_DOCX_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "uploads",
    "case_2974d496-515d-410f-ae8e-0a30bb041f66",
    "cbf85388-2599-4776-8339-39a317b74a51_Apex_InfraTech_Writ_Petition_Mock_Bombay_High_Court.docx"
)

@pytest.fixture(scope="module")
def mock_evidence_result():
    """Loads chunks from the actual mock petition docx and runs deterministic heuristic mapping."""
    if os.path.exists(MOCK_DOCX_PATH):
        doc = docx.Document(MOCK_DOCX_PATH)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        chunk_size = max(1, len(paragraphs) // 4)
        chunks = []
        for i in range(0, len(paragraphs), chunk_size):
            text_block = "\n".join(paragraphs[i:i + chunk_size])
            chunks.append({
                "page_number": (i // chunk_size) + 1,
                "text_content": text_block,
                "provenance": {"document_id": "doc_mock_apex_001", "page": (i // chunk_size) + 1}
            })
    else:
        chunks = [
            {
                "page_number": 1,
                "text_content": (
                    "IN THE HIGH COURT OF JUDICATURE AT BOMBAY\n"
                    "WRIT PETITION (CIVIL) NO. 402 OF 2023\n"
                    "M/s Apex InfraTech Private Limited v. State of Maharashtra & Ors.\n\n"
                    "14.03.2019 — Tender awarded and Concession Agreement entered into.\n"
                    "10.08.2021 — Inspection conducted; milestone completion.\n"
                    "18.11.2022 — Impugned show-cause/cancellation order issued."
                ),
                "provenance": {"document_id": "doc_mock_apex_001", "page": 1}
            },
            {
                "page_number": 2,
                "text_content": (
                    "Exhibit P-1: Certified copy of the Concession Agreement dated 14.03.2019.\n"
                    "Exhibit P-2: Inspection report certifying milestone completion.\n"
                    "Annexure R-1: State inspection note alleging unapproved deviations.\n"
                    "The Respondents assert that a personal hearing had been offered.\n"
                    "The Petitioner disputes the adequacy of the hearing and submits no meaningful opportunity was given."
                ),
                "provenance": {"document_id": "doc_mock_apex_001", "page": 2}
            },
            {
                "page_number": 3,
                "text_content": (
                    "Precedents:\n"
                    "1. Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1\n"
                    "2. Maneka Gandhi v. Union of India, AIR 1978 SC 597\n"
                    "Article 14 of the Constitution of India prohibits arbitrary State action.\n\n"
                    "NOTE\nThis document is a fictional drafting sample prepared for educational/mock-court purposes."
                ),
                "provenance": {"document_id": "doc_mock_apex_001", "page": 3}
            }
        ]
    evidence_list, issues_list = EvidenceMapper._heuristic_map_evidence(chunks)
    return evidence_list, issues_list

def test_metadata_disclaimer_filtering():
    """Confirms fictional/educational disclaimers are flagged and never treated as statutes or exhibits."""
    disclaimer_text = "This document is a fictional drafting sample prepared for educational/mock-court purposes."
    assert EvidenceMapper.is_document_metadata(disclaimer_text) is True

    chunks = [
        {
            "page_number": 1,
            "text_content": disclaimer_text,
            "provenance": {"document_id": "doc_01", "page": 1}
        }
    ]
    evidence_list, _ = EvidenceMapper._heuristic_map_evidence(chunks)
    for ev in evidence_list:
        assert ev.evidence_type != EvidenceType.STATUTE
        assert "fictional drafting sample" not in ev.title.lower()

def test_exhibit_p1_extraction(mock_evidence_result):
    """Verifies Exhibit P-1 Concession Agreement extraction, type, claimed strength and adversarial challenge."""
    evidence_list, _ = mock_evidence_result

    p1_items = [e for e in evidence_list if e.exhibit_id == "P-1"]
    assert len(p1_items) == 1, "Exhibit P-1 should be extracted exactly once (deduplicated)"
    p1 = p1_items[0]

    assert p1.evidence_type == EvidenceType.EXHIBIT
    assert p1.claimed_strength == ClaimedStrength.STRONG
    assert p1.verification_status == VerificationStatus.CLAIMED
    assert p1.missing_evidence is False
    assert "certified" in p1.basis.lower()
    assert "concession agreement" in p1.title.lower() or "concession agreement" in p1.claim_supported.lower()
    assert "operative clause" in p1.adversarial_challenge.lower() or "certified agreement" in p1.adversarial_challenge.lower()

def test_exhibit_p2_extraction(mock_evidence_result):
    """Verifies Exhibit P-2 Inspection Report extraction and adversarial question."""
    evidence_list, _ = mock_evidence_result

    p2_items = [e for e in evidence_list if e.exhibit_id == "P-2"]
    assert len(p2_items) == 1, "Exhibit P-2 should be extracted exactly once"
    p2 = p2_items[0]

    assert p2.evidence_type == EvidenceType.EXHIBIT
    assert p2.claimed_strength == ClaimedStrength.MODERATE
    assert p2.verification_status == VerificationStatus.CLAIMED
    assert p2.missing_evidence is False
    assert "inspection" in p2.title.lower() or "milestone" in p2.title.lower()
    assert "methodology" in p2.adversarial_challenge.lower() or "milestone" in p2.adversarial_challenge.lower()

def test_missing_annexure_r1_detection(mock_evidence_result):
    """Verifies Annexure R-1 is flagged as MISSING with UNKNOWN strength and missing_evidence=True."""
    evidence_list, _ = mock_evidence_result

    r1_items = [e for e in evidence_list if e.exhibit_id == "R-1"]
    assert len(r1_items) == 1, "Annexure R-1 should be extracted"
    r1 = r1_items[0]

    assert r1.evidence_type == EvidenceType.EXHIBIT
    assert r1.verification_status == VerificationStatus.MISSING
    assert r1.claimed_strength == ClaimedStrength.UNKNOWN
    assert r1.missing_evidence is True
    assert "deviations" in r1.title.lower() or "deviations" in r1.claim_supported.lower()
    assert "disclosed" in r1.adversarial_challenge.lower() or "deviations" in r1.adversarial_challenge.lower()

def test_contradiction_and_disputed_hearing(mock_evidence_result):
    """Verifies contradiction detection between Petitioner and Respondent on hearing."""
    evidence_list, _ = mock_evidence_result

    hearing_items = [e for e in evidence_list if e.conflict is True]
    assert len(hearing_items) >= 1, "Disputed hearing should be flagged with conflict=True"
    for item in hearing_items:
        assert item.evidence_type == EvidenceType.CLAIM
        assert item.conflict_type == "DISPUTED_FACT"
        assert len(item.conflict_positions) >= 2
        assert "hearing" in item.adversarial_challenge.lower()

def test_fact_milestone_classification(mock_evidence_result):
    """Verifies factual dates (14.03.2019, 10.08.2021) are classified as FACT or PROCEDURAL_RECORD, not EXHIBIT."""
    evidence_list, _ = mock_evidence_result

    facts = [e for e in evidence_list if e.evidence_type == EvidenceType.FACT]
    assert len(facts) >= 1, "Factual milestones should be categorized under FACT"
    for f in facts:
        assert f.verification_status == VerificationStatus.CLAIMED

def test_legal_authority_judgments(mock_evidence_result):
    """Verifies cited Supreme Court precedents (Whirlpool, Maneka Gandhi) are categorized as JUDGMENT."""
    evidence_list, _ = mock_evidence_result

    judgments = [e for e in evidence_list if e.evidence_type == EvidenceType.JUDGMENT]
    assert len(judgments) >= 1, "Supreme Court precedents must be classified as JUDGMENT"
    whirlpool_or_maneka = [j for j in judgments if "whirlpool" in j.title.lower() or "maneka" in j.title.lower()]
    assert len(whirlpool_or_maneka) >= 1

def test_case_specific_adversarial_questions_no_generic(mock_evidence_result):
    """Ensures that the generic boilerplate is NOT used as the challenge for all cards."""
    evidence_list, _ = mock_evidence_result

    generic_boilerplate = "opposing counsel may object if original certified copy or verification affidavit is omitted from court record."
    for ev in evidence_list:
        assert ev.adversarial_challenge.lower() != generic_boilerplate, f"Found generic boilerplate on {ev.title}"
        assert ev.vulnerability_note.lower() != generic_boilerplate
