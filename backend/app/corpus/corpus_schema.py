"""
SQLite FTS5 Corpus Database Schema and Connection Manager for NyaySahayak.

Stores authoritative Indian legal authorities (Supreme Court judgments from ILDC,
Central Bare Acts, Landmark Precedents) with cryptographic SHA256 checksums and
sub-millisecond FTS5 full-text search capability.
"""

import os
import sqlite3
import hashlib
from typing import Optional, Dict, Any, List

CORPUS_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(CORPUS_DIR, "corpus_index", "corpus_chunks.db")

def get_corpus_db_path() -> str:
    """Return the absolute path to the corpus database."""
    return os.environ.get("NYAY_CORPUS_DB_PATH", DEFAULT_DB_PATH)

def get_corpus_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Return an active connection to the SQLite corpus database with row factory."""
    path = db_path or get_corpus_db_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def compute_sha256(text: str) -> str:
    """Compute standard SHA-256 hash for provenance verification."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()

def init_corpus_db(db_path: Optional[str] = None) -> None:
    """Initialize the SQLite tables and FTS5 virtual tables."""
    conn = get_corpus_db_connection(db_path)
    cursor = conn.cursor()

    # 1. Main Structured Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS corpus_chunks (
            chunk_id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            corpus_type TEXT NOT NULL,
            case_title TEXT NOT NULL,
            citation_string TEXT NOT NULL,
            court TEXT NOT NULL,
            year INTEGER,
            bench TEXT,
            page_number INTEGER DEFAULT 1,
            paragraph_number INTEGER DEFAULT 1,
            text_span TEXT NOT NULL,
            ratio_decidendi TEXT,
            source_url TEXT,
            checksum_sha256 TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Indexes for fast exact lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_doc_id ON corpus_chunks(document_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_title ON corpus_chunks(case_title)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_year ON corpus_chunks(year)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_citation ON corpus_chunks(citation_string)")

    # 2. FTS5 Full-Text Search Virtual Table
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS corpus_fts USING fts5(
            chunk_id UNINDEXED,
            case_title,
            citation_string,
            court,
            text_span,
            ratio_decidendi,
            tokenize = 'porter unicode61'
        )
    """)

    conn.commit()
    conn.close()

def insert_chunk(
    chunk_id: str,
    document_id: str,
    corpus_type: str,
    case_title: str,
    citation_string: str,
    court: str,
    year: Optional[int],
    bench: Optional[str],
    page_number: int,
    paragraph_number: int,
    text_span: str,
    ratio_decidendi: Optional[str] = None,
    source_url: Optional[str] = None,
    db_path: Optional[str] = None
) -> None:
    """Insert or replace a legal passage chunk into both structured and FTS5 tables."""
    checksum = compute_sha256(text_span)
    conn = get_corpus_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO corpus_chunks (
            chunk_id, document_id, corpus_type, case_title, citation_string,
            court, year, bench, page_number, paragraph_number,
            text_span, ratio_decidendi, source_url, checksum_sha256
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        chunk_id, document_id, corpus_type, case_title, citation_string,
        court, year, bench, page_number, paragraph_number,
        text_span, ratio_decidendi, source_url, checksum
    ))

    # Sync into FTS5
    cursor.execute("DELETE FROM corpus_fts WHERE chunk_id = ?", (chunk_id,))
    cursor.execute("""
        INSERT INTO corpus_fts (
            chunk_id, case_title, citation_string, court, text_span, ratio_decidendi
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        chunk_id, case_title, citation_string, court, text_span, ratio_decidendi or ""
    ))

    conn.commit()
    conn.close()
