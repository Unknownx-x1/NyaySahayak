"""
Case Graph API endpoints for NyaySahayak.
Exposes REST routes for master Case Graph context, Timeline, and Evidence Map.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import get_db
from app.schemas.case_graph import CaseGraph, TimelineEvent, EvidenceItem
from app.services.case_graph_service import CaseGraphService

router = APIRouter(prefix="/api/case-graph", tags=["case-graph"])

@router.post("/generate/{case_id}", response_model=CaseGraph)
def generate_case_graph_endpoint(case_id: str, db: Session = Depends(get_db)):
    return CaseGraphService.generate_case_graph(case_id, db)

@router.get("/{case_id}", response_model=CaseGraph)
def get_case_graph_endpoint(case_id: str, db: Session = Depends(get_db)):
    graph = CaseGraphService.get_latest_case_graph(case_id, db)
    if not graph:
        raise HTTPException(status_code=404, detail="Case Graph not found for case.")
    return graph

@router.get("/{case_id}/timeline", response_model=List[TimelineEvent])
def get_timeline_endpoint(case_id: str, db: Session = Depends(get_db)):
    graph = CaseGraphService.get_latest_case_graph(case_id, db)
    return graph.timeline if graph else []

@router.post("/{case_id}/timeline/generate", response_model=CaseGraph)
def generate_timeline_endpoint(case_id: str, db: Session = Depends(get_db)):
    """Compiles or updates timeline specifically with Groq LLM."""
    return CaseGraphService.compile_timeline_only(case_id, db)

@router.get("/{case_id}/evidence", response_model=List[EvidenceItem])
def get_evidence_endpoint(case_id: str, db: Session = Depends(get_db)):
    graph = CaseGraphService.get_latest_case_graph(case_id, db)
    return graph.evidence_map if graph else []
