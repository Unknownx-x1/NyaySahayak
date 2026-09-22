"""
Comprehensive Unit Tests for Authoritative Indian Legal Corpus & 6-Check Verification Engine.
"""

import pytest
from app.corpus.corpus_retriever import corpus_retriever
from app.corpus.corpus_schema import compute_sha256
from app.services.verification_engine import CitationVerificationEngine
from app.schemas.verification import VerificationStatus
from app.core.corpus_config import corpus_registry

def test_corpus_db_retrieval_whirlpool():
    """Verify Whirlpool landmark is retrieved with authoritative metadata."""
    res = corpus_retriever.lookup_citation("Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1")
    assert res is not None
    assert "Whirlpool Corporation" in res["case_title"]
    assert res["year"] == 1998
    assert res["court"] == "Supreme Court of India"
    assert "Article 226" in res["text_span"]
    assert len(res["checksum_sha256"]) == 64

def test_corpus_db_retrieval_bare_act_article_226():
    """Verify Article 226 of the Constitution of India is retrievable."""
    res = corpus_retriever.lookup_citation("Article 226, Constitution of India")
    assert res is not None
    assert "Article 226" in res["case_title"]
    assert "High Court" in res["text_span"]

def test_corpus_db_retrieval_bare_act_section_65b():
    """Verify Section 65B of the Indian Evidence Act is retrievable."""
    res = corpus_retriever.lookup_citation("Section 65B, Indian Evidence Act, 1872")
    assert res is not None
    assert "65B" in res["case_title"]
    assert "electronic record" in res["text_span"].lower()

def test_fts5_ranked_search():
    """Verify FTS5 ranked search retrieves relevant Indian case law."""
    hits = corpus_retriever.search_passages("natural justice alternative remedy", limit=5)
    assert len(hits) > 0
    assert any("Whirlpool" in h["case_title"] for h in hits)

def test_verification_engine_corpus_grounding_whirlpool():
    """Verify end-to-end 6-Check verification succeeds automatically from corpus."""
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        proposition_claim="Writ petition is maintainable despite alternative remedy when natural justice is violated."
    )
    assert report.overall_status == VerificationStatus.VERIFIED
    assert report.existence_check.passed is True
    assert report.identity_check.passed is True
    assert report.source_check.passed is True
    assert report.quotation_check.passed is True
    assert report.proposition_check.passed is True
    assert report.trace_check.passed is True
    assert report.provenance is not None
    assert report.provenance.checksum_sha256 is not None
    assert len(report.provenance.checksum_sha256) == 64

def test_verification_engine_detects_fabricated_quote():
    """Verify that a fabricated quotation triggers CONTESTED status."""
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        quoted_text="The High Court has no discretion whatsoever and must dismiss every writ petition where another forum exists."
    )
    assert report.overall_status == VerificationStatus.CONTESTED
    assert report.quotation_check.passed is False
    assert "mismatch" in report.quotation_check.details.lower()

def test_verification_engine_verifies_authentic_verbatim_quote():
    """Verify that an authentic verbatim quote passes quotation check."""
    report = CitationVerificationEngine.verify_citation(
        citation_text="Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1",
        quoted_text="The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature"
    )
    assert report.overall_status == VerificationStatus.VERIFIED
    assert report.quotation_check.passed is True
    assert "verbatim" in report.quotation_check.details.lower() or "Substantial" in report.quotation_check.details

def test_corpus_whitelist_includes_ildc():
    """Verify that the corpus whitelist registry includes the ILDC Supreme Court corpus."""
    sources = corpus_registry.list_whitelisted_sources()
    source_ids = [s.id for s in sources]
    assert "ildc_supreme_court" in source_ids
    assert "sc_judgments" in source_ids
    assert "central_bare_acts" in source_ids
