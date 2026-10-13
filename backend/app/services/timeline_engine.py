"""
Dynamic Case Timeline Engine for NyaySahayak.

Responsible for:
1. Extracting chronological dates and associated legal events from case record.
2. Using LangChain structured LLM extraction when configured, with heuristic fallback.
3. Detecting exact, approximate, and conflicting dates.
4. Sorting timeline events chronologically down to year, month, and day.
5. Linking every timeline entry back to exact document page provenance.
"""

import re
import uuid
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.schemas.case_graph import TimelineEvent, FactItem
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.timeline_engine")

# LangChain / JSON Output Schemas
class LLMTimelineEvent(BaseModel):
    date_str: str = Field(description="Date string e.g., '24 April 1973', '10.08.2021', '14/05/2021', or '1973'")
    event_summary: str = Field(description="Clear summary of what happened on this date")
    is_approximate: bool = Field(default=False, description="True if estimated, e.g., 'circa', 'around'")
    is_conflicting: bool = Field(default=False, description="True if disputed across filings")
    conflict_notes: Optional[str] = Field(default=None, description="Notes on why the date is disputed")

class LLMTimelineExtractionResult(BaseModel):
    events: List[LLMTimelineEvent] = Field(default_factory=list, description="List of chronological legal events")

class TimelineEngine:
    """Engine for building page-linked chronological case timelines."""

    # Month name to numeric map for accurate sorting
    MONTH_MAP = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }

    DATE_PATTERNS = [
        # Full textual date: "10 August 2021", "10th August, 2021", "10-Aug-2021"
        r'\b\d{1,2}(?:st|nd|rd|th)?[\s.\u202f\u00a0-]+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.,\u202f\u00a0-]+(?:19|20)\d{2}\b',
        # Month day year: "August 10, 2021", "August 10th 2021"
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.\u202f\u00a0-]+\d{1,2}(?:st|nd|rd|th)?,?[\s.\u202f\u00a0-]+(?:19|20)\d{2}\b',
        # Numeric date: "10.08.2021", "10/08/2021", "10-08-2021", "18.11.2021", "15.09.2021"
        r'\b\d{1,2}[./-]\d{1,2}[./-](?:19|20)\d{2}\b',
        # Month and year: "August 2021", "April 1973"
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)[\s,\u202f\u00a0]+(?:19|20)\d{2}\b',
        # Standalone 4-digit year: "1973", "2021"
        r'\b(?:19|20)\d{2}\b'
    ]

    LEGAL_ACTION_VERBS = re.compile(
        r'\b(?:passed|filed|enacted|ordered|impugned|issued|entered|dated|cancelled|'
        r'notified|tender|challenged|held|dismissed|completed|commenced|inspected|'
        r'certified|milestone|allotted|terminated|demanded|submitted|hearing|notice|'
        r'representation|show-cause|decision|rejected|sanctioned|executed|breached|'
        r'adverse|awarded|scheduled|received|delivered|registered|performed|delayed)\b',
        re.IGNORECASE
    )

    @staticmethod
    def parse_sort_tuple(date_str: str) -> Tuple[int, int, int]:
        """Convert arbitrary date string into sortable (year, month, day) tuple."""
        clean = re.sub(r'[\u202f\u00a0]', ' ', date_str).strip()

        # 1. Numeric d.m.y or d/m/y or d-m-y
        m_num = re.search(r'\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b', clean)
        if m_num:
            d, m, y = int(m_num.group(1)), int(m_num.group(2)), int(m_num.group(3))
            if m > 12 and d <= 12:
                d, m = m, d
            return (y, m, d)

        # 2. Textual "10 August 2021"
        m_text = re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?[\s.-]+([A-Za-z]+)[\s.,]+(\d{4})\b', clean)
        if m_text:
            d = int(m_text.group(1))
            m_name = m_text.group(2).lower()[:3]
            m = TimelineEngine.MONTH_MAP.get(m_name, 1)
            y = int(m_text.group(3))
            return (y, m, d)

        # 3. Textual "August 10, 2021"
        m_text_rev = re.search(r'\b([A-Za-z]+)[\s.-]+(\d{1,2})(?:st|nd|rd|th)?[\s.,]+(\d{4})\b', clean)
        if m_text_rev:
            m_name = m_text_rev.group(1).lower()[:3]
            m = TimelineEngine.MONTH_MAP.get(m_name, 1)
            d = int(m_text_rev.group(2))
            y = int(m_text_rev.group(3))
            return (y, m, d)

        # 4. Month Year "August 2021"
        m_month_year = re.search(r'\b([A-Za-z]+)[\s.,]+(\d{4})\b', clean)
        if m_month_year:
            m_name = m_month_year.group(1).lower()[:3]
            if m_name in TimelineEngine.MONTH_MAP:
                return (int(m_month_year.group(2)), TimelineEngine.MONTH_MAP[m_name], 1)

        # 5. Year only "2021"
        y_match = re.search(r'\b(19\d{2}|20\d{2})\b', clean)
        if y_match:
            return (int(y_match.group(1)), 1, 1)

        return (9999, 12, 31)

    @staticmethod
    def build_timeline(chunks: List[Dict[str, Any]], facts: Optional[List[Any]] = None) -> List[TimelineEvent]:
        """
        Builds chronological timeline.
        Uses LangChain / Groq LLM extraction when configured, falling back to heuristics.
        Cross-synchronizes with any extracted facts that contain date contexts.
        """
        llm = get_configured_llm(temperature=0.1)
        events: List[TimelineEvent] = []

        if llm:
            try:
                events = TimelineEngine._llm_build_timeline(chunks, llm)
            except Exception as e:
                logger.warning(f"LLM timeline extraction failed, falling back to heuristic: {e}")
                events = []

        if not events:
            events = TimelineEngine._heuristic_build_timeline(chunks)

        # Cross-synchronize with facts that contain date_context
        if facts:
            events = TimelineEngine._merge_facts_into_timeline(events, facts, chunks)

        # Sort chronologically by exact date tuple (Year, Month, Day)
        events.sort(key=lambda e: TimelineEngine.parse_sort_tuple(e.date_str))
        return events

    @staticmethod
    def _llm_build_timeline(chunks: List[Dict[str, Any]], llm: Any) -> List[TimelineEvent]:
        # Collect candidate chunks containing dates or temporal legal terms across the ENTIRE filing
        temporal_chunks = []
        for c in chunks:
            txt = c.get("text_content", "")
            norm_txt = re.sub(r'[\u202f\u00a0]', ' ', txt)
            has_date = any(re.search(pat, norm_txt, re.IGNORECASE) for pat in TimelineEngine.DATE_PATTERNS)
            has_keyword = any(k in norm_txt.lower() for k in [
                "milestone", "hearing", "notice", "tender", "inspection", "dated", 
                "order", "completion", "delay", "termination", "affidavit", "adverse"
            ])
            if has_date or has_keyword:
                temporal_chunks.append(c)

        candidate_chunks = temporal_chunks if len(temporal_chunks) >= 2 else chunks

        combined_text = "\n\n".join([
            f"[Doc: {c.get('provenance', {}).get('document_id', 'doc')} | Page {c.get('page_number', 1)} | Chunk #{c.get('chunk_index', idx)}]:\n{c.get('text_content', '')}"
            for idx, c in enumerate(candidate_chunks[:30])
        ])

        prompt = (
            "You are an expert Legal Chronology & Timeline Analyst for Indian Court proceedings (Supreme Court / High Courts).\n"
            "Carefully analyze the case text below. Extract all chronological dates, procedural events, contractual milestones, inspection dates, hearing dates, impugned order dates, and petition filings.\n\n"
            "For each event:\n"
            "1. date_str: standard date exactly as referenced or normalized (e.g. '10 August 2021', '10.08.2021', '15.09.2021', '18.11.2021', '24 April 1973')\n"
            "2. event_summary: clear, precise factual summary of what occurred on that date\n"
            "3. is_approximate: boolean (true if date is estimated or circa)\n"
            "4. is_conflicting: boolean (true if parties dispute this date or its legal effect)\n"
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
            f"CASE TEXT:\n{combined_text[:9000]}"
        )

        raw_events: List[Dict[str, Any]] = []

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

        if not raw_events:
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
            for c in candidate_chunks:
                txt = c.get("text_content", "").lower()
                clean_date = date_str.lower().replace(".", " ").replace("/", " ")
                if date_str.lower() in txt or any(part in txt for part in clean_date.split() if len(part) > 2):
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

            # Normalize narrow non-breaking spaces
            norm_text = re.sub(r'[\u202f\u00a0]', ' ', text)

            # Split into individual sentences and lines
            lines_and_sentences = re.split(r'(?<=[.!?])\s+|\n+', norm_text)
            for sentence in lines_and_sentences:
                sentence = sentence.strip().replace("\n", " ")
                if len(sentence) < 20:
                    continue

                date_str, raw_date = TimelineEngine._find_first_date(sentence)
                if not date_str:
                    continue

                # Filter out pure boilerplate year matches if sentence has no legal action verb
                if re.match(r'^\d{4}$', date_str) and not TimelineEngine.LEGAL_ACTION_VERBS.search(sentence):
                    continue

                key = (date_str, sentence[:45].lower())
                if key in seen_dates:
                    continue
                seen_dates.add(key)

                is_approx = any(w in sentence.lower() for w in ["approx", "around", "about", "circa", "on or about"])
                is_conflict = any(w in sentence.lower() for w in ["disputed", "conflict", "alleged date", "not admitted", "denies"])

                event = TimelineEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    date_str=date_str,
                    raw_date=raw_date,
                    event_summary=sentence[:250],
                    is_approximate=is_approx,
                    is_conflicting=is_conflict,
                    conflict_notes="Conflicting position asserted across filings" if is_conflict else None,
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=sentence[:200]
                )
                events.append(event)

        return events

    @staticmethod
    def _merge_facts_into_timeline(
        events: List[TimelineEvent], 
        facts: List[Any], 
        chunks: List[Dict[str, Any]]
    ) -> List[TimelineEvent]:
        """Integrate any extracted facts that have explicit date contexts."""
        existing_keys = {(e.date_str.lower(), e.event_summary[:40].lower()) for e in events}
        merged = list(events)

        for f in facts:
            date_ctx = getattr(f, "date_context", None)
            desc = getattr(f, "description", "")
            if not date_ctx or not desc:
                continue

            date_str, _ = TimelineEngine._find_first_date(date_ctx)
            if not date_str:
                date_str = date_ctx

            key = (date_str.lower(), desc[:40].lower())
            if key not in existing_keys:
                existing_keys.add(key)
                category = getattr(f, "category", "")
                is_conflicting = str(category).lower() in ["disputed", "contradiction"]
                doc_id = getattr(f, "document_id", "doc_unknown")
                page_num = getattr(f, "page_number", 1)

                merged.append(TimelineEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    date_str=date_str,
                    raw_date=date_ctx,
                    event_summary=desc[:250],
                    is_approximate=False,
                    is_conflicting=is_conflicting,
                    conflict_notes="Disputed fact in pleading" if is_conflicting else None,
                    document_id=doc_id,
                    page_number=page_num,
                    text_span=desc[:200]
                ))

        return merged

    @staticmethod
    def _find_first_date(text: str) -> Tuple[str, str]:
        norm = re.sub(r'[\u202f\u00a0]', ' ', text)
        for pattern in TimelineEngine.DATE_PATTERNS:
            match = re.search(pattern, norm, re.IGNORECASE)
            if match:
                found = match.group(0).strip()
                return found, found
        return "", ""
