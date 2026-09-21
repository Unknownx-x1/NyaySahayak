"""
LangGraph Multi-Agent State Definition for Courtroom Simulation.
"""

from typing import TypedDict, List, Dict, Any, Optional

class CourtroomAgentMessage(TypedDict):
    role: str  # "advocate" | "opposing_counsel" | "bench_judge" | "courtroom_coach"
    speaker_name: str
    message: str
    objections: Optional[List[str]]
    timestamp: str

class CourtroomState(TypedDict):
    case_id: str
    case_title: str
    case_graph: Dict[str, Any]
    user_argument: str
    active_issue: str
    opposing_counter_argument: str
    procedural_objections: List[str]
    bench_queries: List[str]
    bench_ruling_tendency: str
    coach_rebuttal_notes: List[str]
    coach_evidentiary_gaps: List[str]
    transcript: List[CourtroomAgentMessage]
    turn_count: int
