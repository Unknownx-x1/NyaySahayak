"""
Legal Corpus Configuration & Whitelist Specification for NyaySahayak.

Philosophy:
In Legal AI, LLMs cannot be trusted as primary sources of legal truth.
This module defines the strict legal information boundary:
1. Whitelisted legal candidate sources (Supreme Court, High Courts, Bare Acts, Gazette Notifications).
2. Jurisdiction, court coverage years, and update frequencies.
3. Whitelist validation rules ensuring non-whitelisted sources trigger UNVERIFIED status.
"""

from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, HttpUrl

class LegalAuthorityType(str, Enum):
    SUPREME_COURT = "supreme_court"
    HIGH_COURT = "high_court"
    BARE_ACT = "bare_act"
    GAZETTE_NOTIFICATION = "gazette_notification"
    TRIBUNAL = "tribunal"
    SUBORDINATE_COURT = "subordinate_court"

class CorpusSource(BaseModel):
    id: str
    name: str
    authority_type: LegalAuthorityType
    jurisdiction: str  # e.g., "India", "Delhi", "Maharashtra"
    court_name: Optional[str] = None
    start_year: int
    end_year: Optional[int] = None  # None indicates ongoing
    official_url: str
    update_cadence: str  # e.g., "Daily", "Weekly", "Static"
    is_whitelisted: bool = True
    storage_type: str = "corpus_and_live"  # options: corpus_only, live_source, corpus_and_live

# Official Whitelisted Sources for Indian Legal System
DEFAULT_WHITELIST_SOURCES: List[CorpusSource] = [
    CorpusSource(
        id="sc_judgments",
        name="Supreme Court of India Judgments",
        authority_type=LegalAuthorityType.SUPREME_COURT,
        jurisdiction="India",
        court_name="Supreme Court of India",
        start_year=1950,
        end_year=None,
        official_url="https://main.sci.gov.in",
        update_cadence="Daily",
        is_whitelisted=True
    ),
    CorpusSource(
        id="delhi_hc_judgments",
        name="Delhi High Court Judgments",
        authority_type=LegalAuthorityType.HIGH_COURT,
        jurisdiction="Delhi",
        court_name="High Court of Delhi",
        start_year=1966,
        end_year=None,
        official_url="https://delhihighcourt.nic.in",
        update_cadence="Daily",
        is_whitelisted=True
    ),
    CorpusSource(
        id="bombay_hc_judgments",
        name="Bombay High Court Judgments",
        authority_type=LegalAuthorityType.HIGH_COURT,
        jurisdiction="Maharashtra",
        court_name="High Court of Judicature at Bombay",
        start_year=1862,
        end_year=None,
        official_url="https://bombayhighcourt.nic.in",
        update_cadence="Daily",
        is_whitelisted=True
    ),
    CorpusSource(
        id="central_bare_acts",
        name="Central Bare Acts & Statutes (India Code)",
        authority_type=LegalAuthorityType.BARE_ACT,
        jurisdiction="India",
        court_name=None,
        start_year=1836,
        end_year=None,
        official_url="https://www.indiacode.nic.in",
        update_cadence="Weekly",
        is_whitelisted=True
    ),
    CorpusSource(
        id="egazette_notifications",
        name="Gazette of India Notifications",
        authority_type=LegalAuthorityType.GAZETTE_NOTIFICATION,
        jurisdiction="India",
        court_name=None,
        start_year=1950,
        end_year=None,
        official_url="https://egazette.gov.in",
        update_cadence="Daily",
        is_whitelisted=True
    ),
    CorpusSource(
        id="ildc_supreme_court",
        name="Indian Legal Documents Corpus (ILDC / Supreme Court of India)",
        authority_type=LegalAuthorityType.SUPREME_COURT,
        jurisdiction="India",
        court_name="Supreme Court of India",
        start_year=1950,
        end_year=2021,
        official_url="https://main.sci.gov.in",
        update_cadence="Static",
        is_whitelisted=True,
        storage_type="corpus_only"
    )
]

class LegalCorpusRegistry:
    """Registry for managing and validating legal authority sources."""
    
    def __init__(self, sources: Optional[List[CorpusSource]] = None):
        self._sources: Dict[str, CorpusSource] = {}
        for source in (sources or DEFAULT_WHITELIST_SOURCES):
            self.register_source(source)
            
    def register_source(self, source: CorpusSource) -> None:
        self._sources[source.id] = source

    def is_source_whitelisted(self, source_id: str) -> bool:
        source = self._sources.get(source_id)
        return source.is_whitelisted if source else False

    def list_whitelisted_sources(self) -> List[CorpusSource]:
        return [s for s in self._sources.values() if s.is_whitelisted]

    def get_source_by_court(self, court_name: str) -> Optional[CorpusSource]:
        for source in self._sources.values():
            if source.court_name and court_name.lower() in source.court_name.lower():
                return source
        return None

# Singleton Registry Instance
corpus_registry = LegalCorpusRegistry()
