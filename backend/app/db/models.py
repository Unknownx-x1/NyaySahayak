"""
SQLAlchemy Database Models for NyaySahayak.
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    firm_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="owner", cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    case_number = Column(String, nullable=True)
    court_type = Column(String, nullable=False, default="Supreme Court")
    description = Column(Text, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="cases")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    verifications = relationship("CitationVerification", back_populates="case", cascade="all, delete-orphan")
    case_graphs = relationship("CaseGraphRecord", back_populates="case", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, default=0)
    ocr_applied = Column(Boolean, default=False)
    detected_languages = Column(String, default="en")  # comma-separated e.g. "en,hi"
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)
    language = Column(String, default="en")
    script_type = Column(String, default="latin_english")
    ocr_applied = Column(Boolean, default=False)
    extraction_confidence = Column(Float, default=1.0)
    provenance_json = Column(JSON, nullable=True)  # Stores exact Provenance Object metadata

    document = relationship("Document", back_populates="chunks")

class CitationVerification(Base):
    __tablename__ = "citation_verifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    citation_text = Column(Text, nullable=False)
    overall_status = Column(String, nullable=False)  # VERIFIED, PARTIAL, CONTESTED, UNVERIFIED
    check_details_json = Column(JSON, nullable=False)  # Results of 6 verification checks
    lawyer_review_state = Column(String, default="UNREVIEWED")  # UNREVIEWED, LAWYER_REVIEW, ACCEPTED, DISPUTED, REJECTED
    lawyer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="verifications")

class CaseGraphRecord(Base):
    __tablename__ = "case_graph_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    version = Column(String, default="1.0")
    graph_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="case_graphs")
