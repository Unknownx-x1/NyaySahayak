"""
Document Upload and Page-Aware Text Retrieval APIs for NyaySahayak.

Phase 1 Multilingual & OCR API updates.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
import uuid
from app.db.database import get_db
from app.db.models import Document, DocumentChunk, Case, User
from app.services.parser import PagePreservingParser

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = os.path.abspath("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentChunkResponse(BaseModel):
    id: str
    page_number: int
    chunk_index: int
    text_content: str
    language: str
    script_type: str = "latin_english"
    ocr_applied: bool = False
    extraction_confidence: float
    provenance: Optional[Dict[str, Any]] = None

class DocumentResponse(BaseModel):
    id: str
    case_id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    detected_languages: str
    created_at: str
    chunks: Optional[List[DocumentChunkResponse]] = None

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    case_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        # Auto-provision case workspace if missing for zero-friction uploads
        user = db.query(User).filter(User.id == "counsel_demo").first()
        if not user:
            user = User(id="counsel_demo", email="counsel@nyaysahayak.local", hashed_password="guest", full_name="Counsel")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        case = Case(
            id=case_id,
            user_id=user.id,
            title="State of Kerala v. Constitutional Amendments (Demo Workspace)",
            court_type="Supreme Court of India"
        )
        db.add(case)
        db.commit()
        db.refresh(case)

    doc_id = str(uuid.uuid4())
    case_upload_dir = os.path.join(UPLOAD_DIR, f"case_{case_id}")
    os.makedirs(case_upload_dir, exist_ok=True)

    saved_path = os.path.join(case_upload_dir, f"{doc_id}_{file.filename}")
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)
    file_ext = os.path.splitext(file.filename)[1].lower().replace(".", "")

    # Parse file preserving pages, provenance, OCR & multilingual script
    try:
        parsed = PagePreservingParser.parse_file(saved_path, doc_id)
    except Exception as e:
        os.remove(saved_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")

    any_ocr_applied = any(chunk.get("ocr_applied", False) for chunk in parsed.chunks)

    new_doc = Document(
        id=doc_id,
        case_id=case_id,
        filename=file.filename,
        file_path=saved_path,
        file_type=file_ext,
        file_size=file_size,
        page_count=parsed.page_count,
        ocr_applied=any_ocr_applied,
        detected_languages=",".join(parsed.detected_languages)
    )
    db.add(new_doc)
    db.commit()

    chunk_responses = []
    for chunk in parsed.chunks:
        new_chunk = DocumentChunk(
            document_id=doc_id,
            page_number=chunk["page_number"],
            chunk_index=chunk["chunk_index"],
            text_content=chunk["text_content"],
            language=chunk["language"],
            script_type=chunk.get("script_type", "latin_english"),
            ocr_applied=chunk.get("ocr_applied", False),
            extraction_confidence=chunk["extraction_confidence"],
            provenance_json=chunk["provenance"]
        )
        db.add(new_chunk)
        db.commit()
        db.refresh(new_chunk)

        chunk_responses.append(DocumentChunkResponse(
            id=new_chunk.id,
            page_number=new_chunk.page_number,
            chunk_index=new_chunk.chunk_index,
            text_content=new_chunk.text_content,
            language=new_chunk.language,
            script_type=new_chunk.script_type,
            ocr_applied=new_chunk.ocr_applied,
            extraction_confidence=new_chunk.extraction_confidence,
            provenance=new_chunk.provenance_json
        ))

    db.refresh(new_doc)
    return DocumentResponse(
        id=new_doc.id,
        case_id=new_doc.case_id,
        filename=new_doc.filename,
        file_type=new_doc.file_type,
        file_size=new_doc.file_size,
        page_count=new_doc.page_count,
        detected_languages=new_doc.detected_languages,
        created_at=new_doc.created_at.isoformat(),
        chunks=chunk_responses
    )

@router.get("/case/{case_id}", response_model=List[DocumentResponse])
def list_case_documents(case_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.case_id == case_id).all()
    return [
        DocumentResponse(
            id=d.id,
            case_id=d.case_id,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            page_count=d.page_count,
            detected_languages=d.detected_languages,
            created_at=d.created_at.isoformat()
        ) for d in docs
    ]

@router.get("/{doc_id}/pages", response_model=List[DocumentChunkResponse])
def get_document_pages(doc_id: str, db: Session = Depends(get_db)):
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.page_number, DocumentChunk.chunk_index).all()
    return [
        DocumentChunkResponse(
            id=c.id,
            page_number=c.page_number,
            chunk_index=c.chunk_index,
            text_content=c.text_content,
            language=c.language,
            script_type=c.script_type or "latin_english",
            ocr_applied=c.ocr_applied or False,
            extraction_confidence=c.extraction_confidence,
            provenance=c.provenance_json
        ) for c in chunks
    ]

@router.get("/{doc_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(doc_id: str, db: Session = Depends(get_db)):
    """Convenience alias for /api/documents/{doc_id}/pages."""
    return get_document_pages(doc_id=doc_id, db=db)

class RAGQueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    case_id: Optional[str] = None
    top_k: Optional[int] = 4

from app.services.rag_engine import LegalDocumentRAGEngine, RAGQueryResponse

@router.post("/rag/query", response_model=RAGQueryResponse)
def query_document_rag(payload: RAGQueryRequest, db: Session = Depends(get_db)):
    """
    RAG Query Endpoint: Retrieves relevant page spans and generates an answer
    using Groq LLM (or Gemini/OpenAI/heuristic fallback).
    """
    chunks = []
    filename = "Legal Filing"

    if payload.document_id:
        doc = db.query(Document).filter(Document.id == payload.document_id).first()
        if doc:
            filename = doc.filename
        db_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == payload.document_id).all()
        chunks = [
            {
                "document_id": c.document_id,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "text_content": c.text_content,
                "language": c.language,
                "script_type": c.script_type,
                "ocr_applied": c.ocr_applied,
                "provenance_json": c.provenance_json
            } for c in db_chunks
        ]
    elif payload.case_id:
        docs = db.query(Document).filter(Document.case_id == payload.case_id).all()
        doc_ids = [d.id for d in docs]
        if docs:
            filename = f"Case Filings ({len(docs)} files)"
        db_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(doc_ids)).all() if doc_ids else []
        chunks = [
            {
                "document_id": c.document_id,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "text_content": c.text_content,
                "language": c.language,
                "script_type": c.script_type,
                "ocr_applied": c.ocr_applied,
                "provenance_json": c.provenance_json
            } for c in db_chunks
        ]

    if not chunks:
        db_chunks = db.query(DocumentChunk).limit(30).all()
        chunks = [
            {
                "document_id": c.document_id,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "text_content": c.text_content,
                "language": c.language,
                "script_type": c.script_type,
                "ocr_applied": c.ocr_applied,
                "provenance_json": c.provenance_json
            } for c in db_chunks
        ]

    return LegalDocumentRAGEngine.query_document(
        query=payload.query,
        chunks=chunks,
        filename=filename,
        top_k=payload.top_k or 4
    )


