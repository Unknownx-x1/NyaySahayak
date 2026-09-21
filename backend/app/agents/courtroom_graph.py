"""
LangGraph Courtroom Simulation Workflow.

Coordinates the Multi-Agent interaction:
User Argument -> Opposing Counsel (Red Teamer) -> Bench Judge (The Inquisitor) -> Courtroom Coach (Strategist).
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from langgraph.graph import StateGraph, START, END

from app.agents.state import CourtroomState, CourtroomAgentMessage
from app.agents.opposing_counsel import opposing_counsel_node
from app.agents.bench_judge import bench_judge_node
from app.agents.coach_agent import coach_node

def build_courtroom_graph():
    """Compiles the LangGraph multi-agent courtroom simulation state graph."""
    graph_builder = StateGraph(CourtroomState)

    graph_builder.add_node("opposing_counsel", opposing_counsel_node)
    graph_builder.add_node("bench_judge", bench_judge_node)
    graph_builder.add_node("courtroom_coach", coach_node)

    # Sequential edge traversal for a courtroom sparring round
    graph_builder.add_edge(START, "opposing_counsel")
    graph_builder.add_edge("opposing_counsel", "bench_judge")
    graph_builder.add_edge("bench_judge", "courtroom_coach")
    graph_builder.add_edge("courtroom_coach", END)

    return graph_builder.compile()

# Global compiled graph instance
courtroom_graph = build_courtroom_graph()

def run_courtroom_sparring(
    case_id: str,
    case_title: str,
    case_graph_dict: Dict[str, Any],
    user_argument: str,
    active_issue: Optional[str] = None,
    existing_transcript: Optional[List[Dict[str, Any]]] = None
) -> CourtroomState:
    """
    Executes a round of courtroom sparring through the LangGraph multi-agent system.
    """
    initial_transcript: List[CourtroomAgentMessage] = list(existing_transcript or [])
    
    # Record user argument in transcript
    initial_transcript.append({
        "role": "advocate",
        "speaker_name": "Counsel for Petitioner (You)",
        "message": user_argument,
        "objections": None,
        "timestamp": datetime.utcnow().isoformat()
    })

    initial_state: CourtroomState = {
        "case_id": case_id,
        "case_title": case_title,
        "case_graph": case_graph_dict,
        "user_argument": user_argument,
        "active_issue": active_issue or "Constitutional Validity & Statutory Maintainability",
        "opposing_counter_argument": "",
        "procedural_objections": [],
        "bench_queries": [],
        "bench_ruling_tendency": "",
        "coach_rebuttal_notes": [],
        "coach_evidentiary_gaps": [],
        "transcript": initial_transcript,
        "turn_count": len([t for t in initial_transcript if t.get("role") == "advocate"])
    }

    final_state = courtroom_graph.invoke(initial_state)
    return final_state
