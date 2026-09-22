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
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import TimelineEvent
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.timeline_engine")

# LangChain / JSON Output Schemas
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
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4}\b',
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b(?:19|20)\d{2}\b'
    ]

    @staticmethod
    def build_timeline(chunks: List[Dict[str, Any]]) -> List[TimelineEvent]:
        """
        Builds chronological timeline.
        Uses LangChain / Groq LLM extraction when configured, falling back to heuristics.
        """
        llm = get_configured_llm(temperature=0.1)
        if llm:
            try:
                events = TimelineEngine._llm_build_timeline(chunks, llm)
                if events:
                    return events
            except Exception as e:
                logger.warning(f"LLM timeline extraction failed, falling back to heuristic: {e}")

        return TimelineEngine._heuristic_build_timeline(chunks)

    @staticmethod
    def _llm_build_timeline(chunks: List[Dict[str, Any]], llm: Any) -> List[TimelineEvent]:
        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)}]:\n{c.get('text_content', '')}"
            for c in chunks[:12]
        ])

        prompt = (
            "You are an expert Legal Chronology & Timeline Analyst for Indian Court proceedings (Supreme Court / High Courts).\n"
            "Carefully analyze the case text below. Extract all chronological dates, procedural events, government notification dates, tender dates, impugned order dates, and petition milestones.\n\n"
            "For each event:\n"
            "1. date_str: standard date (e.g. '24 April 1973', '15 March 2021', 'October 2022', '2023')\n"
            "2. event_summary: clear, precise factual summary of what occurred on that date\n"
            "3. is_approximate: boolean (true if date is estimated or circa)\n"
            "4. is_conflicting: boolean (true if parties dispute this date)\n"
            "5. conflict_notes: notes on why it is disputed, or null\n\n"
            "Return ONLY a valid JSON object in this exact schema with no markdown wrapping or preamble:\n"
            "{\n"
            '  "events": [\n'
            '    {\n'
            '      "date_str": "...",\n'
            '      "event_summary": "...",\n'
            '      "is_approximate": false,\n'
            '      "is_conflicting": false,\n'
            '      "conflict_notes": null\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            f"CASE TEXT:\n{combined_text[:7500]}"
        )

        raw_events: List[Dict[str, Any]] = []

        # Try direct JSON parsing
        try:
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            clean = content.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                clean = match.group(0)
            data = json.loads(clean)
            raw_events = data.get("events", [])
        except Exception as e:
            logger.warning(f"Direct JSON timeline extraction failed, trying structured output: {e}")
            try:
                structured_llm = llm.with_structured_output(LLMTimelineExtractionResult)
                result: LLMTimelineExtractionResult = structured_llm.invoke(prompt)
                raw_events = [item.model_dump() for item in result.events]
            except Exception as e2:
                logger.warning(f"Structured LLM timeline extraction failed: {e2}")
                return TimelineEngine._heuristic_build_timeline(chunks)

        first_doc = chunks[0].get("provenance", {}).get("document_id", "doc_unknown") if chunks else "doc_unknown"
        first_page = chunks[0].get("page_number", 1) if chunks else 1

        events: List[TimelineEvent] = []
        for item in raw_events:
            date_str = item.get("date_str", "").strip()
            summary = item.get("event_summary", "").strip()
            if not date_str or not summary:
                continue

            matched_doc = first_doc
            matched_page = first_page
            for c in chunks:
                if date_str.lower() in c.get("text_content", "").lower() or any(w.lower() in c.get("text_content", "").lower() for w in summary.split()[:4] if len(w) > 3):
                    matched_doc = c.get("provenance", {}).get("document_id", first_doc)
                    matched_page = c.get("page_number", first_page)
                    break

            evt = TimelineEvent(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                date_str=date_str,
                raw_date=date_str,
                event_summary=summary,
                is_approximate=bool(item.get("is_approximate", False)),
                is_conflicting=bool(item.get("is_conflicting", False)),
                conflict_notes=item.get("conflict_notes"),
                document_id=matched_doc,
                page_number=matched_page,
                text_span=summary[:200]
            )
            events.append(evt)

        events.sort(key=lambda e: TimelineEngine._extract_sort_year(e.date_str))
        return events if events else TimelineEngine._heuristic_build_timeline(chunks)

    @staticmethod
    def _heuristic_build_timeline(chunks: List[Dict[str, Any]]) -> List[TimelineEvent]:
        events: List[TimelineEvent] = []
        seen_dates = set()

        for chunk in chunks:
            text = chunk.get("text_content", "").strip()
            if not text:
                continue

            doc_id = chunk.get("provenance", {}).get("document_id", "doc_unknown")
            page_num = chunk.get("page_number", 1)

            # Split into individual sentences and lines
            lines_and_sentences = re.split(r'(?<=[.!?])\s+|\n+', text)
            for sentence in lines_and_sentences:
                sentence = sentence.strip().replace("\n", " ")
                if len(sentence) < 30:
                    continue

                date_str, raw_date = TimelineEngine._find_first_date(sentence)
                if not date_str:
                    continue

                # Filter out pure boilerplate year matches if sentence has no legal action verb
                if re.match(r'^\d{4}$', date_str) and not re.search(r'\b(?:passed|filed|enacted|ordered|impugned|issued|entered|dated|cancelled|notified|tender|challenged|held|dismissed)\b', sentence, re.IGNORECASE):
                    continue

                key = (date_str, sentence[:40].lower())
                if key in seen_dates:
                    continue
                seen_dates.add(key)

                is_approx = any(w in sentence.lower() for w in ["approx", "around", "about", "circa", "on or about"])
                is_conflict = any(w in sentence.lower() for w in ["disputed date", "conflict", "alleged date", "whereas respondent states"])

                event = TimelineEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    date_str=date_str,
                    raw_date=raw_date,
                    event_summary=sentence[:250],
                    is_approximate=is_approx,
                    is_conflicting=is_conflict,
                    conflict_notes="Conflicting dates stated across filings" if is_conflict else None,
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=sentence[:200]
                )
                events.append(event)

        events.sort(key=lambda e: TimelineEngine._extract_sort_year(e.date_str))
        return events

    @staticmethod
    def _find_first_date(text: str) -> Tuple[str, str]:
        for pattern in TimelineEngine.DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                found = match.group(0).strip()
                return found, found
        return "", ""

    @staticmethod
    def _extract_sort_year(date_str: str) -> int:
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date_str)
        return int(year_match.group(1)) if year_match else 9999
