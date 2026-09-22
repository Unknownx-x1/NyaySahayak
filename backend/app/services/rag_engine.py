"""
Legal Document Retrieval-Augmented Generation (RAG) Engine for NyaySahayak.

Retrieves page-preserved document chunks using relevance scoring, formats provenance context,
and synthesizes grounded legal answers using Groq LLM (with fallback to Gemini, OpenAI, or
deterministic heuristic extraction).
"""

import os
import re
import math
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.rag_engine")

class RAGSourceItem(BaseModel):
    document_id: str
    filename: Optional[str] = "Document"
    page_number: int
    chunk_index: int
    text_span: str
    relevance_score: float
    language: str = "en"
    script_type: str = "latin_english"
    ocr_applied: bool = False
    provenance: Optional[Dict[str, Any]] = None

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    provider: str
    model: str
    sources: List[RAGSourceItem]

class LegalDocumentRAGEngine:
    """High-precision legal document retrieval and grounded question-answering engine."""

    STOPWORDS = {
        "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
        "by", "from", "is", "are", "was", "were", "be", "been", "that", "this",
        "it", "as", "what", "which", "who", "when", "where", "how", "why", "can",
        "does", "do", "did", "have", "has", "had"
    }

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9_\u0900-\u097F\u0B80-\u0BFF]{2,}\b', text.lower())
        return [w for w in words if w not in LegalDocumentRAGEngine.STOPWORDS]

    @staticmethod
    def _score_chunk(query_tokens: List[str], text: str) -> float:
        """Calculates keyword density, exact phrase matches, and statutory term boost."""
        if not text or not query_tokens:
            return 0.0

        lower_text = text.lower()
        chunk_tokens = LegalDocumentRAGEngine._tokenize(lower_text)
        if not chunk_tokens:
            return 0.0

        token_counts = {}
        for t in chunk_tokens:
            token_counts[t] = token_counts.get(t, 0) + 1

        score = 0.0
        # Term Frequency matching
        for q in query_tokens:
            if q in token_counts:
                # Sub-linear term frequency weight
                score += 1.0 + math.log(token_counts[q])

        # Exact query match boost
        joined_query = " ".join(query_tokens)
        if len(joined_query) > 6 and joined_query in lower_text:
            score += 4.0

        # Legal relevance boosts
        legal_terms = ["article", "section", "held", "ultra vires", "petition", "impugned", "exhibit", "affidavit", "order", "respondent", "appellant"]
        for term in legal_terms:
            if term in lower_text and term in query_tokens:
                score += 1.5

        # Normalize by chunk length
        norm_factor = math.sqrt(len(chunk_tokens)) if chunk_tokens else 1.0
        return round(score / norm_factor, 4)

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Ranks chunks by relevance to the query and returns top_k."""
        query_tokens = cls._tokenize(query)
        scored_chunks = []

        for chunk in chunks:
            text = chunk.get("text_content") or chunk.get("text_span") or ""
            score = cls._score_chunk(query_tokens, text)
            scored_chunks.append({
                "chunk": chunk,
                "score": score
            })

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)

        # If highest score is 0, return first top_k chunks as baseline context
        if scored_chunks and scored_chunks[0]["score"] == 0.0:
            return [
                {**item["chunk"], "relevance_score": 0.5}
                for item in scored_chunks[:top_k]
            ]

        results = []
        for item in scored_chunks[:top_k]:
            if item["score"] > 0:
                results.append({**item["chunk"], "relevance_score": item["score"]})

        # Fallback to top_k if too few scored positive
        if not results and scored_chunks:
            results = [
                {**item["chunk"], "relevance_score": 0.5}
                for item in scored_chunks[:top_k]
            ]

        return results

    @classmethod
    def query_document(
        cls,
        query: str,
        chunks: List[Dict[str, Any]],
        filename: str = "Document",
        top_k: int = 4
    ) -> RAGQueryResponse:
        """
        Executes end-to-end RAG:
        1. Retrieves top K page chunks with provenance.
        2. Prompts Groq LLM (or fallback) with strict legal citation instructions.
        3. Returns structured grounded answer with source citations.
        """
        top_chunks = cls.retrieve_relevant_chunks(query, chunks, top_k=top_k)

        source_items: List[RAGSourceItem] = []
        context_blocks: List[str] = []

        for c in top_chunks:
            page = c.get("page_number", 1)
            chunk_idx = c.get("chunk_index", 0)
            doc_id = c.get("document_id") or c.get("provenance", {}).get("document_id", "doc_unknown")
            text = c.get("text_content") or c.get("text_span") or ""
            lang = c.get("language", "en")
            script = c.get("script_type", "latin_english")
            ocr = c.get("ocr_applied", False)
            score = c.get("relevance_score", 0.85)

            source_items.append(RAGSourceItem(
                document_id=doc_id,
                filename=filename,
                page_number=page,
                chunk_index=chunk_idx,
                text_span=text[:350],
                relevance_score=score,
                language=lang,
                script_type=script,
                ocr_applied=ocr,
                provenance=c.get("provenance_json") or c.get("provenance")
            ))

            context_blocks.append(
                f"[Source: Page {page}, Chunk #{chunk_idx + 1} | Lang: {lang}]:\n\"{text.strip()}\""
            )

        context_str = "\n\n".join(context_blocks)

        # Detect active LLM
        groq_key = os.getenv("GROQ_API_KEY")
        model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile") if groq_key else (
            os.getenv("GEMINI_MODEL", "gemini-1.5-flash") if os.getenv("GEMINI_API_KEY") else "Heuristic Extractive"
        )
        provider_name = "Groq" if groq_key else (
            "Google Gemini" if os.getenv("GEMINI_API_KEY") else "Heuristic Legal Engine"
        )

        llm = get_configured_llm(temperature=0.1)

        if llm:
            try:
                system_prompt = (
                    "You are NyaySahayak's expert Legal Document Intelligence Agent. "
                    "Your responsibility is to provide precise, highly authoritative, and factual answers "
                    "strictly based on the retrieved case document excerpts provided below.\n\n"
                    "RULES:\n"
                    "1. Always ground your assertions in the provided excerpts.\n"
                    "2. Explicitly cite the page and chunk provenance whenever referencing a fact, claim, or statutory provision (e.g., '[Page 1]', '[Page 2, Chunk #1]').\n"
                    "3. If the excerpts do not contain enough information to answer definitively, state what is present and what is missing.\n"
                    "4. Structure your response clearly using bullet points and professional legal language suited for an Indian High Court or Supreme Court advocate."
                )

                user_prompt = (
                    f"LEGAL DOCUMENT CONTEXT ({filename}):\n"
                    f"----------------------------------------\n"
                    f"{context_str}\n"
                    f"----------------------------------------\n\n"
                    f"COUNSEL'S QUERY:\n{query}\n\n"
                    f"Please provide a grounded legal analysis citing the exact page sources above:"
                )

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]

                response = llm.invoke(messages)
                answer_text = response.content if hasattr(response, "content") else str(response)

                return RAGQueryResponse(
                    query=query,
                    answer=answer_text,
                    provider=provider_name,
                    model=model_name,
                    sources=source_items
                )
            except Exception as e:
                logger.error(f"Error invoking LLM in RAG engine: {e}")
                # Fallback to heuristic answer if LLM call fails

        # Heuristic Grounded Synthesizer
        answer_text = cls._synthesize_heuristic_answer(query, top_chunks, filename)
        return RAGQueryResponse(
            query=query,
            answer=answer_text,
            provider="Heuristic Grounded Synthesizer (Offline Safe)",
            model="Rule-Based Extractive Matcher",
            sources=source_items
        )

    @staticmethod
    def _synthesize_heuristic_answer(
        query: str,
        top_chunks: List[Dict[str, Any]],
        filename: str
    ) -> str:
        """Deterministic extractive synthesis when no API key is available."""
        if not top_chunks:
            return f"No relevant passages were found in '{filename}' matching the query '{query}'."

        lines = [
            f"### Document Analysis: {filename}",
            f"**Query**: {query}",
            "",
            "Based on the retrieved page spans from the filing, the following key provisions and facts were extracted:",
            ""
        ]

        for idx, chunk in enumerate(top_chunks):
            page = chunk.get("page_number", 1)
            text = (chunk.get("text_content") or chunk.get("text_span") or "").strip()
            first_sent = text.split(". ")[0].strip()
            if not first_sent.endswith("."):
                first_sent += "."

            lines.append(f"- **Page {page}**: {first_sent} [Page {page}, Chunk #{chunk.get('chunk_index', 0) + 1}]")

        lines.extend([
            "",
            "> **Note**: Live AI generation requires a `GROQ_API_KEY` configured in the backend environment. "
            "Grounded extraction above reflects exact page-preserved chunk text from the filing."
        ])

        return "\n".join(lines)
