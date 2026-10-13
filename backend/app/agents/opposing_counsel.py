"""
Opposing Counsel Agent (Red Teamer) for Courtroom Preparation.

Role:
1. Actively challenges the advocate's legal proposition.
2. Identifies weak evidence and missing annexures in the Case Graph.
3. Raises procedural objections (Maintainability, Limitation, Locus Standi, Alternative Remedy).
"""

from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field

from app.agents.state import CourtroomState, CourtroomAgentMessage
from app.core.llm_factory import get_configured_llm

class OpposingCounselOutput(BaseModel):
    counter_argument: str = Field(description="Adversarial legal argument rebutting counsel's claim")
    procedural_objections: list[str] = Field(default_factory=list, description="List of preliminary objections e.g. Limitation, Maintainability, Lack of Proof")

def opposing_counsel_node(state: CourtroomState) -> Dict[str, Any]:
    """LangGraph node representing the Opposing Counsel."""
    user_arg = state.get("user_argument", "")
    case_title = state.get("case_title", "Instant Matter")
    active_issue = state.get("active_issue", "Substantive Rights & Maintainability")
    case_graph = state.get("case_graph", {})
    
    facts = case_graph.get("facts", [])
    evidence = case_graph.get("evidence_map", [])

    weak_evidence = [e.get("title") for e in evidence if e.get("strength") in ["WEAK", "MISSING"]]
    disputed_facts = [f.get("description") for f in facts if f.get("category") in ["disputed", "contradiction"]]

    llm = get_configured_llm()
    if llm:
        try:
            prompt = (
                "You are an experienced Indian Senior Advocate representing the Respondent / Opposing Party in the High Court / Supreme Court.\n"
                f"Case: {case_title}\n"
                f"Active Issue: {active_issue}\n"
                f"Petitioner's Argument: {user_arg}\n"
                f"Known Disputed Facts: {disputed_facts[:3]}\n"
                f"Weak/Missing Evidence: {weak_evidence[:3]}\n\n"
                "Formulate a sharp, adversarial counter-argument. Point out the lack of corroborating evidence, "
                "raise specific procedural objections (such as maintainability, delay/laches, or lack of statutory foundation), "
                "and demonstrate why the petitioner is not entitled to extraordinary writ or equitable relief."
            )
            structured_llm = llm.with_structured_output(OpposingCounselOutput)
            result: OpposingCounselOutput = structured_llm.invoke(prompt)

            counter_arg = result.counter_argument
            objections = result.procedural_objections
        except Exception:
            counter_arg = _heuristic_counter_argument(user_arg, weak_evidence)
            objections = _heuristic_objections(user_arg)
    else:
        counter_arg = _heuristic_counter_argument(user_arg, weak_evidence)
        objections = _heuristic_objections(user_arg)

    message: CourtroomAgentMessage = {
        "role": "opposing_counsel",
        "speaker_name": "Senior Counsel (Opposing)",
        "message": counter_arg,
        "objections": objections,
        "timestamp": datetime.utcnow().isoformat()
    }

    transcript = list(state.get("transcript", []))
    transcript.append(message)

    return {
        "opposing_counter_argument": counter_arg,
        "procedural_objections": objections,
        "transcript": transcript
    }

def _heuristic_counter_argument(arg: str, weak_evidence: list) -> str:
    ev_note = f" Furthermore, the claim lacks documentary foundation on record; {weak_evidence[0]} remains uncorroborated." if weak_evidence else ""
    return (
        f"May it please the Court, the argument advanced by the petitioner is entirely devoid of merit and legally untenable. "
        f"The petitioner is attempting to reopen settled factual findings without invoking the proper statutory hierarchy.{ev_note} "
        f"Unless the petitioner establishes an egregious violation of natural justice or fundamental rights, extraordinary judicial interference is unwarranted."
    )

def _heuristic_objections(arg: str) -> list[str]:
    return [
        "Objection to Maintainability: Alternate statutory efficacious remedy available.",
        "Objection on Laches: Unexplained delay and acquiescence in seeking equitable relief.",
        "Evidentiary Defect: Bare averments not substantiated by certified annexures."
    ]
