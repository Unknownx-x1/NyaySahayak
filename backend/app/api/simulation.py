"""
Simulation API Router for NyaySahayak Multi-Agent Courtroom System.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.db.models import Case, CaseGraphRecord
from app.services.case_graph_service import CaseGraphService
from app.agents.courtroom_graph import run_courtroom_sparring

router = APIRouter(prefix="/api/simulation", tags=["Courtroom Multi-Agent Simulation"])

class SparringRequest(BaseModel):
    case_id: str
    user_argument: str
    active_issue: Optional[str] = None
    existing_transcript: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class SparringResponse(BaseModel):
    case_id: str
    case_title: str
    opposing_counter_argument: str
    procedural_objections: List[str]
    bench_queries: List[str]
    bench_ruling_tendency: str
    coach_rebuttal_notes: List[str]
    coach_evidentiary_gaps: List[str]
    transcript: List[Dict[str, Any]]
    turn_count: int

@router.post("/spar", response_model=SparringResponse)
def spar_with_agents(req: SparringRequest, db: Session = Depends(get_db)):
    """
    Runs a multi-agent courtroom sparring cycle through LangGraph.
    Passes user's argument through Opposing Counsel, Bench Judge, and Courtroom Coach.
    """
    case = db.query(Case).filter(Case.id == req.case_id).first()
    case_title = case.title if case else "State of Kerala v. Constitutional Amendments (Demo Matter)"

    # Retrieve or generate the Case Graph to ground the simulation
    record = db.query(CaseGraphRecord).filter(CaseGraphRecord.case_id == req.case_id).order_by(CaseGraphRecord.created_at.desc()).first()
    if record and record.graph_json:
        case_graph_dict = record.graph_json
    else:
        compiled_graph = CaseGraphService.generate_case_graph(req.case_id, db)
        case_graph_dict = compiled_graph.model_dump()

    final_state = run_courtroom_sparring(
        case_id=req.case_id,
        case_title=case_title,
        case_graph_dict=case_graph_dict,
        user_argument=req.user_argument,
        active_issue=req.active_issue,
        existing_transcript=req.existing_transcript
    )

    return SparringResponse(
        case_id=req.case_id,
        case_title=case_title,
        opposing_counter_argument=final_state["opposing_counter_argument"],
        procedural_objections=final_state["procedural_objections"],
        bench_queries=final_state["bench_queries"],
        bench_ruling_tendency=final_state["bench_ruling_tendency"],
        coach_rebuttal_notes=final_state["coach_rebuttal_notes"],
        coach_evidentiary_gaps=final_state["coach_evidentiary_gaps"],
        transcript=final_state["transcript"],
        turn_count=final_state["turn_count"]
    )

@router.get("/case/{case_id}/brief")
def get_courtroom_brief(case_id: str, db: Session = Depends(get_db)):
    """
    Generates a pre-hearing strategic battle brief based on the Case Graph.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    case_title = case.title if case else "Constitutional Validity Demo"
    
    compiled_graph = CaseGraphService.generate_case_graph(case_id, db)
    graph_dict = compiled_graph.model_dump()

    facts = graph_dict.get("facts", [])
    evidence = graph_dict.get("evidence_map", [])
    issues = graph_dict.get("legal_issues", [])

    weak_evidence = [e for e in evidence if e.get("strength") in ["WEAK", "MISSING"]]
    disputed_facts = [f for f in facts if f.get("category") in ["disputed", "contradiction"]]

    return {
        "case_id": case_id,
        "case_title": case_title,
        "active_legal_issues": [i.get("title") for i in issues],
        "vulnerability_audit": {
            "disputed_facts_count": len(disputed_facts),
            "weak_evidence_count": len(weak_evidence),
            "disputed_samples": [f.get("description") for f in disputed_facts[:3]],
            "weak_evidence_samples": [e.get("title") for e in weak_evidence[:3]]
        },
        "recommended_first_argument": f"May it please your Lordships, we appear on behalf of the petitioner in {case_title} to challenge the impugned order on the ground of statutory overreach and violation of fundamental procedural fairness."
    }
