"""
Page-Preserving Document Parsing & Provenance Extraction Engine for NyaySahayak.

Phase 1 Multilingual & OCR Enhancements:
- Integrates OCRProcessor for scanned court filings.
- Integrates MultilingualLanguageEngine for Devanagari/Hindi normalization.
- Preserves page numbers and enriches Provenance Objects with script_type and ocr_applied metadata.
"""

import os
from typing import List, Dict, Any
import pymupdf as fitz  # PyMuPDF
import docx

from app.services.ocr_service import OCRProcessor
from app.services.language_service import MultilingualLanguageEngine

class DocumentParsingResult:
    def __init__(self, page_count: int, chunks: List[Dict[str, Any]], detected_languages: List[str]):
        self.page_count = page_count
        self.chunks = chunks  # List of chunk dicts with page_number, text, provenance
        self.detected_languages = detected_languages

class PagePreservingParser:
    """Parser for legal documents preserving exact page numbers and provenance."""

    @staticmethod
    def parse_file(file_path: str, document_id: str) -> DocumentParsingResult:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return PagePreservingParser._parse_pdf(file_path, document_id)
        elif ext in [".docx", ".doc"]:
            return PagePreservingParser._parse_docx(file_path, document_id)
        elif ext == ".txt":
            return PagePreservingParser._parse_txt(file_path, document_id)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _parse_pdf(file_path: str, document_id: str) -> DocumentParsingResult:
        doc = fitz.open(file_path)
        page_count = len(doc)
        chunks: List[Dict[str, Any]] = []
        detected_languages = set()

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_number = page_idx + 1

            # Phase 1: Process Page via OCR Engine
            ocr_res = OCRProcessor.process_page(page, page_number)
            raw_text = ocr_res.text

            # Phase 1: Multilingual Script Analysis & Devanagari Normalization
            script_info = MultilingualLanguageEngine.identify_script(raw_text)
            lang_code = script_info["language_code"]
            script_type = script_info["script_type"]
            detected_languages.add(lang_code)

            if "hi" in lang_code or "devanagari" in script_type:
                normalized_text = MultilingualLanguageEngine.normalize_devanagari_text(raw_text)
            elif "ta" in lang_code or "tamil" in script_type:
                normalized_text = MultilingualLanguageEngine.normalize_tamil_text(raw_text)
            else:
                normalized_text = raw_text.strip()

            # Split page text into clean structural paragraphs while keeping page reference
            paragraphs = [p.strip() for p in normalized_text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [normalized_text]

            for chunk_idx, paragraph in enumerate(paragraphs):
                provenance = {
                    "source_type": "case_document",
                    "document_id": document_id,
                    "page": page_number,
                    "chunk_index": chunk_idx,
                    "text_span": paragraph[:200],  # Prefix snippet for quick verification
                    "language": lang_code,
                    "script_type": script_type,
                    "ocr_applied": ocr_res.ocr_applied,
                    "is_scanned": ocr_res.is_scanned,
                    "extraction_confidence": ocr_res.confidence
                }

                chunks.append({
                    "page_number": page_number,
                    "chunk_index": chunk_idx,
                    "text_content": paragraph,
                    "language": lang_code,
                    "script_type": script_type,
                    "ocr_applied": ocr_res.ocr_applied,
                    "extraction_confidence": ocr_res.confidence,
                    "provenance": provenance
                })

        doc.close()
        return DocumentParsingResult(
            page_count=page_count,
            chunks=chunks,
            detected_languages=list(detected_languages)
        )

    @staticmethod
    def _parse_docx(file_path: str, document_id: str) -> DocumentParsingResult:
        doc = docx.Document(file_path)
        chunks: List[Dict[str, Any]] = []
        current_page = 1
        chunk_idx = 0
        detected_languages = set()

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            script_info = MultilingualLanguageEngine.identify_script(text)
            lang_code = script_info["language_code"]
            script_type = script_info["script_type"]
            detected_languages.add(lang_code)

            if "hi" in lang_code or "devanagari" in script_type:
                text = MultilingualLanguageEngine.normalize_devanagari_text(text)
            elif "ta" in lang_code or "tamil" in script_type:
                text = MultilingualLanguageEngine.normalize_tamil_text(text)

            provenance = {
                "source_type": "case_document",
                "document_id": document_id,
                "page": current_page,
                "chunk_index": chunk_idx,
                "text_span": text[:200],
                "language": lang_code,
                "script_type": script_type,
                "ocr_applied": False,
                "extraction_confidence": 0.99
            }

            chunks.append({
                "page_number": current_page,
                "chunk_index": chunk_idx,
                "text_content": text,
                "language": lang_code,
                "script_type": script_type,
                "ocr_applied": False,
                "extraction_confidence": 0.99,
                "provenance": provenance
            })
            chunk_idx += 1

        return DocumentParsingResult(
            page_count=current_page,
            chunks=chunks,
            detected_languages=list(detected_languages) or ["en"]
        )

    @staticmethod
    def _parse_txt(file_path: str, document_id: str) -> DocumentParsingResult:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        chunks: List[Dict[str, Any]] = []
        page_number = 1
        lines_per_page = 50
        detected_languages = set()

        for idx, line in enumerate(lines):
            text = line.strip()
            if not text:
                continue

            page_number = (idx // lines_per_page) + 1
            script_info = MultilingualLanguageEngine.identify_script(text)
            lang_code = script_info["language_code"]
            script_type = script_info["script_type"]
            detected_languages.add(lang_code)

            if "hi" in lang_code or "devanagari" in script_type:
                text = MultilingualLanguageEngine.normalize_devanagari_text(text)
            elif "ta" in lang_code or "tamil" in script_type:
                text = MultilingualLanguageEngine.normalize_tamil_text(text)

            provenance = {
                "source_type": "case_document",
                "document_id": document_id,
                "page": page_number,
                "chunk_index": idx,
                "text_span": text[:200],
                "language": lang_code,
                "script_type": script_type,
                "ocr_applied": False,
                "extraction_confidence": 1.0
            }

            chunks.append({
                "page_number": page_number,
                "chunk_index": idx,
                "text_content": text,
                "language": lang_code,
                "script_type": script_type,
                "ocr_applied": False,
                "extraction_confidence": 1.0,
                "provenance": provenance
            })

        return DocumentParsingResult(
            page_count=page_number,
            chunks=chunks,
            detected_languages=list(detected_languages) or ["en"]
        )

    @staticmethod
    def _detect_language(text: str) -> str:
        return MultilingualLanguageEngine.identify_script(text)["language_code"]

