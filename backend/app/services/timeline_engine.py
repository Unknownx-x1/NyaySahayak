"""
Dynamic Case Timeline Engine for NyaySahayak.

Responsible for:
1. Extracting chronological dates and associated legal events from case record.
2. Using LangChain structured LLM extraction when configured, with heuristic fallback.
3. Detecting exact, approximate, and conflicting dates.
4. Sorting timeline events chronologically.
5. Linking every timeline entry back to exact document page provenance.
"""

import re
import uuid
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import TimelineEvent
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.timeline_engine")

# LangChain Structured Output Schemas
class LLMTimelineEvent(BaseModel):
    date_str: str = Field(description="Date string e.g., '24 April 1973', '14/05/2021', or '1973'")
    event_summary: str = Field(description="Clear summary of what happened on this date")
    is_approximate: bool = Field(default=False, description="True if estimated, e.g., 'circa', 'around'")
    is_conflicting: bool = Field(default=False, description="True if disputed across filings")
    conflict_notes: Optional[str] = Field(default=None, description="Notes on why the date is disputed")

class LLMTimelineExtractionResult(BaseModel):
    events: List[LLMTimelineEvent] = Field(default_factory=list, description="List of chronological legal events")

class TimelineEngine:
    """Engine for building page-linked chronological case timelines."""

    DATE_PATTERNS = [
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b',
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b(?:19|20)\d{2}\b'
    ]

    @staticmethod
    def build_timeline(chunks: List[Dict[str, Any]]) -> List[TimelineEvent]:
        """
        Builds chronological timeline.
        Uses LangChain structured output when LLM is configured, falling back to heuristics.
        """
        llm = get_configured_llm()
        if llm:
            try:
                return TimelineEngine._llm_build_timeline(chunks, llm)
            except Exception as e:
                logger.warning(f"LLM timeline extraction failed, falling back to heuristic: {e}")

        return TimelineEngine._heuristic_build_timeline(chunks)

    @staticmethod
    def _llm_build_timeline(chunks: List[Dict[str, Any]], llm: Any) -> List[TimelineEvent]:
        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)}]:\n{c.get('text_content', '')}"
            for c in chunks[:8]
        ])

        prompt = (
            "You are an expert Legal Chronology Agent for Indian Court records.\n"
            "Extract every chronological event, date of filing, impugned order date, agreement date, or incident.\n"
            "Identify if any date is approximate or disputed between parties.\n\n"
            f"{combined_text[:7000]}"
        )

        structured_llm = llm.with_structured_output(LLMTimelineExtractionResult)
        result: LLMTimelineExtractionResult = structured_llm.invoke(prompt)

        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        events: List[TimelineEvent] = []
        for item in result.events:
            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                if item.date_str in c.get("text_content", "") or any(w in c.get("text_content", "") for w in item.event_summary.split()[:4]):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            evt = TimelineEvent(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                date_str=item.date_str,
                raw_date=item.date_str,
                event_summary=item.event_summary,
                is_approximate=item.is_approximate,
                is_conflicting=item.is_conflicting,
                conflict_notes=item.conflict_notes,
                document_id=matched_doc,
                page_number=matched_page,
                text_span=item.event_summary[:200]
            )
            events.append(evt)

        events.sort(key=lambda e: TimelineEngine._extract_sort_year(e.date_str))
        return events

    @staticmethod
    def _heuristic_build_timeline(chunks: List[Dict[str, Any]]) -> List[TimelineEvent]:
        events: List[TimelineEvent] = []

        for chunk in chunks:
            text = chunk.get("text_content", "").strip()
            if not text:
                continue

            doc_id = chunk.get("provenance", {}).get("document_id", "doc_unknown")
            page_num = chunk.get("page_number", 1)

            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            for para in paragraphs:
                date_str, raw_date = TimelineEngine._find_first_date(para)
                if not date_str:
                    continue

                is_approx = any(w in para.lower() for w in ["approx", "around", "about", "circa", "on or about"])
                is_conflict = any(w in para.lower() for w in ["disputed date", "conflict", "alleged date", "whereas respondent states"])

                event = TimelineEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    date_str=date_str,
                    raw_date=raw_date,
                    event_summary=para[:250],
                    is_approximate=is_approx,
                    is_conflicting=is_conflict,
                    conflict_notes="Conflicting dates stated across filings" if is_conflict else None,
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=para[:200]
                )
                events.append(event)

        events.sort(key=lambda e: TimelineEngine._extract_sort_year(e.date_str))
        return events

    @staticmethod
    def _find_first_date(text: str) -> Tuple[str, str]:
        for pattern in TimelineEngine.DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                found = match.group(0)
                return found, found
        return "", ""

    @staticmethod
    def _extract_sort_year(date_str: str) -> int:
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date_str)
        return int(year_match.group(1)) if year_match else 9999
