"""
Bench Judge Agent (The Inquisitor) for Courtroom Preparation.

Role:
1. Interrogates counsel with targeted judicial questions.
2. Demands page provenance, ratio decidendi, and statutory references.
3. Weighs the petitioner's propositions against the respondent's objections.
"""

from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field

from app.agents.state import CourtroomState, CourtroomAgentMessage
from app.core.llm_factory import get_configured_llm

class BenchJudgeOutput(BaseModel):
    bench_questions: list[str] = Field(description="2 to 3 sharp judicial questions posed from the bench to counsel")
    bench_ruling_tendency: str = Field(description="Tentative judicial leaning or warning to counsel")

def bench_judge_node(state: CourtroomState) -> Dict[str, Any]:
    """LangGraph node representing the Judicial Bench."""
    user_arg = state.get("user_argument", "")
    opposing_arg = state.get("opposing_counter_argument", "")
    objections = state.get("procedural_objections", [])
    case_title = state.get("case_title", "Instant Matter")
    active_issue = state.get("active_issue", "Substantive Adjudication")

    llm = get_configured_llm()
    if llm:
        try:
            prompt = (
                "You are an Indian Appellate / High Court / Supreme Court Bench Judge presiding over a hearing.\n"
                f"Matter: {case_title}\n"
                f"Substantive Question: {active_issue}\n"
                f"Counsel's Proposition: {user_arg}\n"
                f"Opposing Counsel's Rebuttal: {opposing_arg}\n"
                f"Objections Raised: {objections}\n\n"
                "Formulate 2-3 probing bench questions asking counsel to point to exact statutory sections, "
                "page numbers of the record, or binding precedents. State the bench's current tentative impression."
            )
            structured_llm = llm.with_structured_output(BenchJudgeOutput)
            result: BenchJudgeOutput = structured_llm.invoke(prompt)

            queries = result.bench_questions
            tendency = result.bench_ruling_tendency
        except Exception:
            queries = _heuristic_queries(user_arg)
            tendency = _heuristic_tendency(objections)
    else:
        queries = _heuristic_queries(user_arg)
        tendency = _heuristic_tendency(objections)

    formatted_bench_speech = (
        "Counsel, the Bench has listened to your submission and the objections raised. "
        + " ".join([f"({i+1}) {q}" for i, q in enumerate(queries)])
        + f" [Court Observation: {tendency}]"
    )

    message: CourtroomAgentMessage = {
        "role": "bench_judge",
        "speaker_name": "The Hon'ble Bench",
        "message": formatted_bench_speech,
        "objections": None,
        "timestamp": datetime.utcnow().isoformat()
    }

    transcript = list(state.get("transcript", []))
    transcript.append(message)

    return {
        "bench_queries": queries,
        "bench_ruling_tendency": tendency,
        "transcript": transcript
    }

def _heuristic_queries(arg: str) -> list[str]:
    return [
        "Where is the foundational finding in the impugned order that warrants invocation of our supervisory jurisdiction under Article 226/227?",
        "How do you overcome the preliminary objection regarding the statutory appeal mechanism provided in the enactment?",
        "Please point the Bench to the specific page and paragraph in the paper book where this prejudice was explicitly pleaded."
    ]

def _heuristic_tendency(objections: list) -> str:
    return "The Bench is presently skeptical on maintainability unless counsel can show a manifest error of law apparent on the face of the record."
