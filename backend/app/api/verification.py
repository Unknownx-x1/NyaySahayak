"""
Citation Verification and Legal Corpus APIs for NyayTarka.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.db.models import CitationVerification
from app.schemas.verification import CitationVerificationReport
from app.services.verification_engine import CitationVerificationEngine
from app.core.corpus_config import corpus_registry, CorpusSource

router = APIRouter(prefix="/api/verification", tags=["verification"])

class VerifyRequest(BaseModel):
    case_id: str
    citation_text: str
    proposition_claim: Optional[str] = None
    quoted_text: Optional[str] = None
    source_passage: Optional[str] = None
    document_id: Optional[str] = None
    page_number: Optional[int] = None

@router.post("/verify", response_model=CitationVerificationReport)
def verify_citation_endpoint(req: VerifyRequest, db: Session = Depends(get_db)):
    report = CitationVerificationEngine.verify_citation(
        citation_text=req.citation_text,
        proposition_claim=req.proposition_claim,
        quoted_text=req.quoted_text,
        source_passage=req.source_passage,
        document_id=req.document_id,
        page_number=req.page_number
    )

    # Save verification record in database
    db_rec = CitationVerification(
        case_id=req.case_id,
        citation_text=req.citation_text,
        overall_status=report.overall_status.value,
        check_details_json=report.model_dump(),
        lawyer_review_state="UNREVIEWED"
    )
    db.add(db_rec)
    db.commit()

    return report

@router.get("/corpus/whitelist", response_model=List[CorpusSource])
def get_corpus_whitelist():
    return corpus_registry.list_whitelisted_sources()

class SqlQueryRequest(BaseModel):
    query: str
    max_rows: Optional[int] = 50

class SqlQueryResponse(BaseModel):
    success: bool
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float
    query: str
    error: Optional[str] = None

@router.post("/corpus/sql", response_model=SqlQueryResponse)
def execute_corpus_sql(req: SqlQueryRequest):
    """Execute a read-only SQL query against the SQLite corpus database."""
    from app.corpus.corpus_retriever import corpus_retriever
    res = corpus_retriever.execute_sql(req.query, max_rows=req.max_rows or 50)
    return SqlQueryResponse(**res)

@router.get("/corpus/stats")
def get_corpus_stats():
    """Retrieve statistical summary of the indexed Indian Legal Corpus."""
    from app.corpus.corpus_retriever import corpus_retriever
    res = corpus_retriever.execute_sql(
        "SELECT corpus_type, COUNT(*) as count FROM corpus_chunks GROUP BY corpus_type"
    )
    type_counts = {r["corpus_type"]: r["count"] for r in res.get("rows", [])}
    total = sum(type_counts.values())
    return {
        "total_records": total,
        "breakdown": type_counts,
        "fts_enabled": True,
        "db_location": "corpus_index/corpus_chunks.db"
    }

@router.get("/case/{case_id}", response_model=List[CitationVerificationReport])
def list_case_verifications(case_id: str, db: Session = Depends(get_db)):
    recs = db.query(CitationVerification).filter(CitationVerification.case_id == case_id).all()
    return [CitationVerificationReport(**r.check_details_json) for r in recs]
