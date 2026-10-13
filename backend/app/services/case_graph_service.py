"""
Master Case Graph Service for NyaySahayak.

Assembles and manages versioned Case Graph structures by coordinating:
- FactFinderAgent
- TimelineEngine
- EvidenceMapper
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import Case, Document, DocumentChunk, CaseGraphRecord
from app.schemas.case_graph import CaseGraph
from app.services.fact_finder import FactFinderAgent
from app.services.timeline_engine import TimelineEngine
from app.services.evidence_mapper import EvidenceMapper

import logging
from app.core.llm_factory import get_configured_llm

logger = logging.getLogger("nyaysahayak.case_graph")

class CaseGraphService:
    """Service for compiling, versioning, and persisting master Case Graphs."""

    @staticmethod
    def _generate_comprehensive_summary(
        chunks: List[Dict[str, Any]], 
        case_title: str, 
        court_type: str, 
        parties: List[Any], 
        facts: List[Any], 
        legal_issues: List[Any]
    ) -> str:
        """
        Generates a comprehensive executive legal summary of the paper/filing.
        Uses Groq/Gemini/OpenAI LLM when configured, with structured heuristic fallback.
        """
        llm = get_configured_llm(temperature=0.1)
        parties_str = ", ".join([f"{p.name} ({p.role})" for p in parties]) if parties else "Parties from Filing"
        issues_str = "; ".join([iss.title for iss in legal_issues[:3]]) if legal_issues else "Constitutional & Statutory Validity"

        if llm and chunks:
            try:
                # Combine up to 10 chunks (~7,500 chars) from the beginning of the case filing
                combined_text = "\n\n".join([
                    f"[Page {c.get('page_number', 1)}]: {c.get('text_content', '')}"
                    for c in chunks[:10]
                ])

                prompt = (
                    "You are a distinguished Senior Advocate and Judicial Researcher at the Supreme Court of India / High Courts.\n"
                    "Analyze the uploaded court filing / legal paper below and compose a thorough, authoritative Executive Summary of the paper with proper explanations.\n\n"
                    f"CASE TITLE: {case_title}\n"
                    f"COURT / FORUM: {court_type}\n"
                    f"PARTIES INVOLVED: {parties_str}\n\n"
                    "Please structure the summary clearly into the following five structured sections using markdown headings and bullet points:\n"
                    "### 1. Nature of Filing & Case Overview\n"
                    "Explain what kind of legal paper this is (e.g. Writ Petition, Special Leave Petition, Criminal Appeal, Written Submissions, Affidavit), the principal parties, the forum/court, and the overarching controversy.\n\n"
                    "### 2. Impugned Order / State Action\n"
                    "Explain the specific trial court order, High Court decree, statutory enactment, executive notification, or police FIR that is being challenged or defended.\n\n"
                    "### 3. Key Grounds & Statutory Provisions\n"
                    "Detail the primary legal grounds, constitutional Articles (e.g. Art. 14, 19, 21, 26, 32, 226), and statutory provisions invoked.\n\n"
                    "### 4. Primary Questions for Adjudication\n"
                    "Explain the core questions of law or factual controversy that the Bench must resolve.\n\n"
                    "### 5. Relief & Prayer Sought\n"
                    "Summarize the specific prayers or remedies sought by the petitioner/appellant (e.g., writ of certiorari/mandamus, stay order, quashing of charges).\n\n"
                    f"FILING EXCERPTS:\n{combined_text[:7500]}\n\n"
                    "Return ONLY the markdown summary with professional legal explanations. Do not include meta-commentary."
                )

                response = llm.invoke(prompt)
                content = response.content if hasattr(response, "content") else str(response)
                summary_text = content.strip()
                if len(summary_text) > 100:
                    return summary_text
            except Exception as e:
                logger.warning(f"LLM summary generation failed: {e}, using heuristic summary")

        # Heuristic Comprehensive Legal Summary
        party_names = [p.name for p in parties] if parties else ["Petitioner", "Respondent"]
        top_facts = [f.description for f in facts[:4]] if facts else ["Pleadings and affidavits submitted before the Court."]
        facts_bullets = "\n".join([f"- {f}" for f in top_facts])

        issues_bullets = "\n".join([f"- {iss.title}: {iss.question_text}" for iss in legal_issues[:3]]) if legal_issues else "- Constitutional and statutory validity of impugned state action."

        return (
            f"### 1. Nature of Filing & Case Overview\n"
            f"This paper represents formal legal proceedings in **{case_title}**, instituted before the **{court_type}**. "
            f"The primary litigation is contested between {', '.join(party_names)}, addressing substantive questions of law and fundamental statutory rights.\n\n"
            f"### 2. Impugned Order / Controversy\n"
            f"The dispute arises out of regulatory, administrative, or statutory measures contested by the aggrieved parties. Key factual milestones recorded in the filing include:\n"
            f"{facts_bullets}\n\n"
            f"### 3. Key Grounds & Statutory Provisions\n"
            f"The filings rely on fundamental constitutional provisions, statutory codes, and established precedents governing jurisdictional competence, procedure, and substantial justice.\n\n"
            f"### 4. Primary Questions for Adjudication\n"
            f"The Court is called upon to determine:\n"
            f"{issues_bullets}\n\n"
            f"### 5. Evidentiary Basis & Relief Sought\n"
            f"The petitioner seeks appropriate judicial relief, directions, or writs to protect rights against the impugned action, supported by verified exhibits, annexures, and case timeline records."
        )

    @staticmethod
    def generate_case_graph(case_id: str, db: Session) -> CaseGraph:
        case = db.query(Case).filter(Case.id == case_id).first()
        case_title = case.title if case else "State of Kerala v. Constitutional Amendments (Demo Workspace)"
        court_type = case.court_type if case else "Supreme Court of India"

        # Query all document chunks for this case
        docs = db.query(Document).filter(Document.case_id == case_id).all()
        doc_ids = [d.id for d in docs]

        chunks_records = []
        if doc_ids:
            chunks_records = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(doc_ids)).order_by(DocumentChunk.page_number, DocumentChunk.chunk_index).all()

        chunks = [
            {
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "text_content": c.text_content,
                "language": c.language,
                "script_type": c.script_type,
                "extraction_confidence": c.extraction_confidence,
                "provenance": c.provenance_json or {"document_id": c.document_id, "page": c.page_number}
            } for c in chunks_records
        ]

        # 1. Fact Finder Agent
        facts, parties = FactFinderAgent.extract_facts(chunks)

        # 2. Timeline Engine (with fact cross-synchronization)
        timeline = TimelineEngine.build_timeline(chunks, facts=facts)

        # 3. Evidence Mapper
        evidence_map, legal_issues = EvidenceMapper.map_evidence(chunks)

        # 4. Generate Comprehensive Legal Summary of the paper
        summary = CaseGraphService._generate_comprehensive_summary(
            chunks=chunks,
            case_title=case_title,
            court_type=court_type,
            parties=parties,
            facts=facts,
            legal_issues=legal_issues
        )

        graph = CaseGraph(
            version="1.0",
            case_id=case_id,
            case_title=case_title,
            court_type=court_type,
            parties=parties,
            facts=facts,
            timeline=timeline,
            evidence_map=evidence_map,
            legal_issues=legal_issues,
            summary=summary,
            created_at=datetime.utcnow().isoformat()
        )

        # Save snapshot in DB
        record = CaseGraphRecord(
            case_id=case_id,
            version="1.0",
            graph_json=graph.model_dump()
        )
        db.add(record)
        db.commit()

        return graph

    @staticmethod
    def compile_timeline_only(case_id: str, db: Session) -> CaseGraph:
        """Extracts and compiles timeline using Groq/LLM and updates the case graph."""
        docs = db.query(Document).filter(Document.case_id == case_id).all()
        doc_ids = [d.id for d in docs]

        chunks_records = []
        if doc_ids:
            chunks_records = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(doc_ids)).order_by(DocumentChunk.page_number, DocumentChunk.chunk_index).all()

        chunks = [
            {
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "text_content": c.text_content,
                "language": c.language,
                "script_type": c.script_type,
                "extraction_confidence": c.extraction_confidence,
                "provenance": c.provenance_json or {"document_id": c.document_id, "page": c.page_number}
            } for c in chunks_records
        ]

        facts, _ = FactFinderAgent.extract_facts(chunks)
        timeline = TimelineEngine.build_timeline(chunks, facts=facts)

        rec = db.query(CaseGraphRecord).filter(CaseGraphRecord.case_id == case_id).order_by(CaseGraphRecord.created_at.desc()).first()
        if rec and rec.graph_json:
            graph_dict = dict(rec.graph_json)
            graph_dict["timeline"] = [t.model_dump() for t in timeline]
            rec.graph_json = graph_dict
            db.commit()
            return CaseGraph(**graph_dict)

        return CaseGraphService.generate_case_graph(case_id, db)

    @staticmethod
    def get_latest_case_graph(case_id: str, db: Session) -> Optional[CaseGraph]:
        rec = db.query(CaseGraphRecord).filter(CaseGraphRecord.case_id == case_id).order_by(CaseGraphRecord.created_at.desc()).first()
        if rec:
            return CaseGraph(**rec.graph_json)
        # If no snapshot in DB, generate one on-the-fly
        return CaseGraphService.generate_case_graph(case_id, db)
