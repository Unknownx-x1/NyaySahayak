"""
Tests for Multi-Agent Courtroom Simulation (LangGraph workflow).
"""

import pytest
from app.agents.courtroom_graph import run_courtroom_sparring
from app.agents.opposing_counsel import opposing_counsel_node
from app.agents.bench_judge import bench_judge_node
from app.agents.coach_agent import coach_node
from app.agents.state import CourtroomState

def test_courtroom_langgraph_workflow():
    """Verify that LangGraph executes all 3 agent nodes and builds the transcript."""
    sample_case_graph = {
        "case_id": "test_case_001",
        "case_title": "Kesavananda Bharati v. State of Kerala",
        "facts": [
            {
                "fact_id": "fact_01",
                "category": "disputed",
                "description": "Petitioner claims religious property rights are completely absolute under Article 26."
            }
        ],
        "evidence_map": [
            {
                "evidence_id": "ev_01",
                "title": "Property Title Deed",
                "strength": "WEAK"
            }
        ]
    }

    user_arg = "The state enactment violates the basic structure by confiscating mutt property without just compensation."

    result = run_courtroom_sparring(
        case_id="test_case_001",
        case_title="Kesavananda Bharati v. State of Kerala",
        case_graph_dict=sample_case_graph,
        user_argument=user_arg,
        active_issue="Basic Structure and Article 26"
    )

    # 1. Verify Opposing Counsel attacked
    assert result["opposing_counter_argument"] is not None
    assert len(result["opposing_counter_argument"]) > 20
    assert len(result["procedural_objections"]) >= 1

    # 2. Verify Bench Judge interrogated
    assert len(result["bench_queries"]) >= 1
    assert result["bench_ruling_tendency"] is not None

    # 3. Verify Coach synthesized rebuttals
    assert len(result["coach_rebuttal_notes"]) >= 1
    assert len(result["coach_evidentiary_gaps"]) >= 1

    # 4. Verify Transcript order (Advocate -> Opposing Counsel -> Bench Judge -> Coach)
    transcript = result["transcript"]
    roles = [m["role"] for m in transcript]
    assert roles == ["advocate", "opposing_counsel", "bench_judge", "courtroom_coach"]
