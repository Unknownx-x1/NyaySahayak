"""
Unit tests for Legal Document Retrieval-Augmented Generation (RAG) Engine.
"""

import pytest
from app.services.rag_engine import LegalDocumentRAGEngine

def test_rag_retrieval_and_scoring():
    chunks = [
        {
            "document_id": "doc_1",
            "page_number": 1,
            "chunk_index": 0,
            "text_content": "The petitioner filed writ petition challenging the 24th Constitutional Amendment under Article 14.",
            "language": "en",
            "extraction_confidence": 0.98
        },
        {
            "document_id": "doc_1",
            "page_number": 2,
            "chunk_index": 1,
            "text_content": "Exhibit P-1: Certified copy of the official land gazette notification issued on 15th March 1972.",
            "language": "en",
            "extraction_confidence": 0.95
        },
        {
            "document_id": "doc_1",
            "page_number": 3,
            "chunk_index": 2,
            "text_content": "The respondent contends that statutory remedies were not exhausted before approaching the High Court.",
            "language": "en",
            "extraction_confidence": 0.92
        }
    ]

    # Query targeting Article 14 on page 1
    top_chunks = LegalDocumentRAGEngine.retrieve_relevant_chunks("What constitutional article is challenged?", chunks, top_k=2)
    assert len(top_chunks) >= 1
    assert top_chunks[0]["page_number"] == 1
    assert "Article 14" in top_chunks[0]["text_content"]

    # Query targeting Exhibit gazette
    gazette_chunks = LegalDocumentRAGEngine.retrieve_relevant_chunks("Where is the official gazette exhibit?", chunks, top_k=1)
    assert len(gazette_chunks) == 1
    assert gazette_chunks[0]["page_number"] == 2

def test_rag_query_synthesis():
    chunks = [
        {
            "document_id": "doc_1",
            "page_number": 1,
            "chunk_index": 0,
            "text_content": "Petitioner challenges the impugned order violating the basic structure of the Constitution.",
            "language": "en",
            "extraction_confidence": 0.99
        }
    ]

    response = LegalDocumentRAGEngine.query_document(
        query="What is challenged by the petitioner?",
        chunks=chunks,
        filename="writ_petition.pdf",
        top_k=1
    )

    assert response.query == "What is challenged by the petitioner?"
    assert len(response.sources) == 1
    assert response.sources[0].page_number == 1
    assert response.sources[0].filename == "writ_petition.pdf"
    assert len(response.answer) > 20
