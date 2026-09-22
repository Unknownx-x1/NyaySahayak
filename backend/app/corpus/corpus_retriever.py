"""
Authoritative Indian Legal Corpus Retriever for NyaySahayak.

Queries the local SQLite FTS5 database to look up case citations, verify quotations,
and trace passages back to official Supreme Court & Statutory sources with SHA256 checksums.
"""

import os
import re
import sqlite3
import logging
from typing import Optional, Dict, Any, List

from app.corpus.corpus_schema import get_corpus_db_connection, get_corpus_db_path

logger = logging.getLogger(__name__)

LEGAL_STOPWORDS = {
    "case", "court", "without", "name", "citation", "order", "judgment",
    "matter", "appeal", "petition", "state", "union", "india", "versus",
    "vs", "the", "and", "for", "with", "this", "that", "from"
}

class LegalCorpusRetriever:
    """Retriever for querying the local Indian Legal Corpus."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or get_corpus_db_path()

    def _get_connection(self) -> sqlite3.Connection:
        return get_corpus_db_connection(self.db_path)

    def extract_search_terms(self, citation_text: str) -> List[str]:
        """Extract meaningful keywords and case titles from raw citation strings."""
        clean = re.sub(r'\(|\)|\[|\]|,|;|:', ' ', citation_text)
        
        # Check for 'v.' or 'vs.' pattern to isolate party names
        if " v. " in citation_text.lower() or " vs. " in citation_text.lower():
            parts = re.split(r'\s+v\.?\s+|\s+vs\.?\s+', citation_text, flags=re.IGNORECASE)
            if parts and len(parts) >= 1:
                petitioner = parts[0].strip()
                # Remove year or volume prefixes if present
                petitioner = re.sub(r'^(see|in|cf\.)\s+', '', petitioner, flags=re.IGNORECASE).strip()
                if len(petitioner) > 3 and petitioner.lower() not in LEGAL_STOPWORDS:
                    return [petitioner]

        # Check for Bare Act references (e.g. "Article 226", "Section 65B")
        art_match = re.search(r'Article\s+(\d+[A-Z]?)', citation_text, re.IGNORECASE)
        if art_match:
            return [f"Article {art_match.group(1)}"]

        sec_match = re.search(r'Section\s+(\d+[A-Z]?)', citation_text, re.IGNORECASE)
        if sec_match:
            return [f"Section {sec_match.group(1)}"]

        # Check for formal law reporter citations like "1998 8 SCC 1" or "ILDC 1951_30"
        reporter_match = re.search(r'\b(SCC|AIR|SCALE|SCR|ILDC)\b', citation_text, re.IGNORECASE)
        if reporter_match:
            return [citation_text.strip()]

        tokens = [
            t.strip() for t in clean.split() 
            if len(t.strip()) > 3 and not t.isdigit() and t.lower() not in LEGAL_STOPWORDS
        ]
        return tokens[:2] if len(tokens) >= 1 else []

    def lookup_citation(
        self,
        citation_text: str,
        quoted_text: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Lookup an authoritative judgment or statute in the corpus.
        Returns the matching record with provenance information, or None if not found.
        """
        if not os.path.exists(self.db_path):
            logger.warning("Corpus database does not exist at: %s", self.db_path)
            return None

        terms = self.extract_search_terms(citation_text)
        if not terms:
            return None

        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            # 1. Direct Case Title or Citation String exact/prefix match
            candidates = []

            for term in terms:
                # SQL LIKE search on case_title or citation_string
                cursor.execute("""
                    SELECT * FROM corpus_chunks 
                    WHERE case_title LIKE ? OR citation_string LIKE ?
                    LIMIT 10
                """, (f"%{term}%", f"%{term}%"))
                rows = cursor.fetchall()
                for r in rows:
                    candidates.append(dict(r))

            # 2. Try FTS5 Full-Text Search if no direct LIKE match
            if not candidates and terms:
                safe_term = re.sub(r'[^a-zA-Z0-9\s]', '', " ".join(terms)).strip()
                if safe_term:
                    try:
                        cursor.execute("""
                            SELECT c.* FROM corpus_fts f
                            JOIN corpus_chunks c ON f.chunk_id = c.chunk_id
                            WHERE corpus_fts MATCH ?
                            ORDER BY rank
                            LIMIT 5
                        """, (safe_term,))
                        rows = cursor.fetchall()
                        for r in rows:
                            candidates.append(dict(r))
                    except Exception as fts_err:
                        logger.debug("FTS5 query failed: %s", fts_err)

            if not candidates:
                return None

            # If quoted_text is provided, pick the candidate chunk with best text overlap
            if quoted_text and len(candidates) > 1:
                q_words = set(re.findall(r'\w+', quoted_text.lower()))
                best_match = candidates[0]
                best_overlap = 0

                for cand in candidates:
                    cand_words = set(re.findall(r'\w+', cand["text_span"].lower()))
                    overlap = len(q_words.intersection(cand_words))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_match = cand

                return best_match

            # Otherwise return the first/most authoritative candidate
            return candidates[0]

        finally:
            conn.close()

    def search_passages(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Perform ranked FTS5 search across all indexed legal passages."""
        if not os.path.exists(self.db_path):
            return []

        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            safe_query = re.sub(r'[^a-zA-Z0-9\s]', '', query).strip()
            if not safe_query:
                return []

            cursor.execute("""
                SELECT c.*, bm25(corpus_fts) as rank_score 
                FROM corpus_fts f
                JOIN corpus_chunks c ON f.chunk_id = c.chunk_id
                WHERE corpus_fts MATCH ?
                ORDER BY rank_score
                LIMIT ?
            """, (safe_query, limit))

            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.warning("Error running FTS5 search: %s", e)
            return []
        finally:
            conn.close()

    def execute_sql(self, sql_query: str, max_rows: int = 100) -> Dict[str, Any]:
        """
        Safely execute a read-only SQL SELECT query against the legal corpus database.
        Enforces read-only safety checks and returns timing, columns, and rows.
        """
        import time
        start_time = time.time()
        
        clean_sql = sql_query.strip().rstrip(";")
        
        # Security: Allow only SELECT or WITH (Common Table Expressions)
        normalized = re.sub(r'--.*?\n', '', clean_sql, flags=re.MULTILINE)
        normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL).strip()
        
        if not re.match(r'^(SELECT|WITH)\b', normalized, re.IGNORECASE):
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0.0,
                "query": sql_query,
                "error": "Only read-only SELECT queries are allowed on the legal corpus."
            }

        # Check for mutation / destructive keywords
        forbidden = re.findall(r'\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|REPLACE)\b', normalized, re.IGNORECASE)
        if forbidden:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0.0,
                "query": sql_query,
                "error": f"Mutation operation '{forbidden[0].upper()}' is forbidden. Queries must be read-only."
            }

        if not os.path.exists(self.db_path):
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0.0,
                "query": sql_query,
                "error": f"Corpus database does not exist at {self.db_path}"
            }

        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(clean_sql)
            columns = [col[0] for col in cursor.description] if cursor.description else []
            raw_rows = cursor.fetchmany(max_rows)
            rows = [dict(zip(columns, r)) for r in raw_rows]
            elapsed_ms = (time.time() - start_time) * 1000.0

            return {
                "success": True,
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "execution_time_ms": round(elapsed_ms, 2),
                "query": sql_query,
                "error": None
            }
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000.0
            logger.warning("SQL execution failed: %s", e)
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": round(elapsed_ms, 2),
                "query": sql_query,
                "error": str(e)
            }
        finally:
            conn.close()

# Singleton Instance
corpus_retriever = LegalCorpusRetriever()
