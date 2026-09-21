"""
Courtroom Coach Agent (The Strategist) for Courtroom Preparation.

Role:
1. Synthesizes opposing counsel's attacks and bench questions.
2. Formulates high-impact rebuttal arguments and courtroom strategy.
3. Highlights evidentiary holes that need urgent repair in the pleadings.
"""

from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field

from app.agents.state import CourtroomState, CourtroomAgentMessage
from app.core.llm_factory import get_configured_llm

class CoachOutput(BaseModel):
    rebuttal_notes: list[str] = Field(description="Direct, actionable talking points for counsel to reply to the bench and oppose counsel")
    evidentiary_gaps: list[str] = Field(description="Evidence vulnerabilities or missing records to shore up")

def coach_node(state: CourtroomState) -> Dict[str, Any]:
    """LangGraph node representing the Senior Courtroom Coach."""
    user_arg = state.get("user_argument", "")
    opposing_arg = state.get("opposing_counter_argument", "")
    bench_queries = state.get("bench_queries", [])
    objections = state.get("procedural_objections", [])
    case_graph = state.get("case_graph", {})

    evidence = case_graph.get("evidence_map", [])
    timeline = case_graph.get("timeline", [])

    llm = get_configured_llm()
    if llm:
        try:
            prompt = (
                "You are an elite Senior Advocate and Courtroom Strategist in India.\n"
                f"Your Junior Counsel argued: {user_arg}\n"
                f"Opposing Counsel Attacked with: {opposing_arg}\n"
                f"Procedural Objections: {objections}\n"
                f"Bench Questions: {bench_queries}\n\n"
                "Provide direct strategic coaching:\n"
                "1. Give 3 actionable rebuttal bullet points to neutralize opposing counsel's objections and satisfy the Bench.\n"
                "2. Point out evidentiary gaps in the case that counsel must immediately explain or bolster with affidavits."
            )
            structured_llm = llm.with_structured_output(CoachOutput)
            result: CoachOutput = structured_llm.invoke(prompt)

            rebuttals = result.rebuttal_notes
            gaps = result.evidentiary_gaps
        except Exception:
            rebuttals = _heuristic_rebuttals(objections, bench_queries)
            gaps = _heuristic_gaps(evidence)
    else:
        rebuttals = _heuristic_rebuttals(objections, bench_queries)
        gaps = _heuristic_gaps(evidence)

    coach_speech = (
        "Strategy Briefing for Counsel:\n"
        + "\n".join([f"• Rebuttal: {r}" for r in rebuttals])
        + "\nEvidentiary Precautions:\n"
        + "\n".join([f"⚠ Warning: {g}" for g in gaps])
    )

    message: CourtroomAgentMessage = {
        "role": "courtroom_coach",
        "speaker_name": "Senior Advocate Coach",
        "message": coach_speech,
        "objections": None,
        "timestamp": datetime.utcnow().isoformat()
    }

    transcript = list(state.get("transcript", []))
    transcript.append(message)

    return {
        "coach_rebuttal_notes": rebuttals,
        "coach_evidentiary_gaps": gaps,
        "transcript": transcript,
        "turn_count": state.get("turn_count", 0) + 1
    }

def _heuristic_rebuttals(objections: list, queries: list) -> list[str]:
    return [
        "Address Maintainability Immediately: Cite Whirlpool Corporation v. Registrar of Trade Marks ((1998) 8 SCC 1) — alternate remedy is not an absolute bar where fundamental rights or natural justice are violated.",
        "Ground Facts on the Record: Direct the Bench immediately to the impugned order's operating paragraph rather than abstract principles.",
        "Turn the Delay Objection: Emphasize that the cause of action is continuous and recurrent."
    ]

def _heuristic_gaps(evidence: list) -> list[str]:
    return [
        "Missing Certified Copy: Ensure a certified copy of the lower tribunal / authority order is on record.",
        "Affidavit Verification: Verify that the supporting affidavit is attested with explicit verification clause."
    ]
