"""
Tests for Tier 1 Case Graph Extraction Agents (FactFinder, TimelineEngine, EvidenceMapper).
"""

import pytest
from app.services.fact_finder import FactFinderAgent
from app.services.timeline_engine import TimelineEngine
from app.services.evidence_mapper import EvidenceMapper
from app.schemas.case_graph import FactCategory, EvidenceStrength

def test_fact_finder_agent():
    chunks = [
        {
            "text_content": (
                "IN THE SUPREME COURT OF INDIA\n"
                "Kesavananda Bharati v. State of Kerala\n"
                "The petitioner asserts that fundamental rights are inviolable.\n"
                "The respondent denies this and disputes the claims."
            ),
            "page_number": 1,
            "provenance": {"document_id": "doc_test_01"}
        }
    ]

    facts, parties = FactFinderAgent.extract_facts(chunks)

    assert len(parties) >= 2
    party_names = [p.name for p in parties]
    assert any("Kesavananda" in name or "Petitioner" in name for name in party_names)

    assert len(facts) >= 2
    categories = [f.category for f in facts]
    assert FactCategory.DISPUTED in categories or FactCategory.CONTRADICTION in categories

def test_timeline_engine_agent():
    chunks = [
        {
            "text_content": (
                "On 24th April 1973, the 13-judge bench delivered the landmark ruling.\n"
                "Earlier in 1967, Golaknath was decided."
            ),
            "page_number": 1,
            "provenance": {"document_id": "doc_test_01"}
        }
    ]

    events = TimelineEngine.build_timeline(chunks)
    assert len(events) >= 1
    # Sorted chronologically (1967 before 1973)
    assert "1967" in events[0].date_str or "1973" in events[-1].date_str

def test_evidence_mapper_agent():
    chunks = [
        {
            "text_content": (
                "Exhibit P-1: Certified copy of the official gazette notification.\n"
                "Whether the amendment violates basic structure?"
            ),
            "page_number": 1,
            "provenance": {"document_id": "doc_test_01"}
        }
    ]

    evidence, issues = EvidenceMapper.map_evidence(chunks)
    assert len(evidence) >= 1
    assert evidence[0].strength == EvidenceStrength.STRONG
    assert len(issues) >= 1
