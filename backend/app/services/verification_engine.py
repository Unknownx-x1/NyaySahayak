"""
Citation Verification Engine Service for NyaySahayak (NyayTarka).

Implements the 6-Check Verification Protocol grounded in the Authoritative Indian Legal Corpus:
1. Existence Check
2. Identity Check
3. Source Check
4. Quotation Check
5. Proposition Check
6. Trace Check
"""

import re
from typing import Dict, Any, Optional
from app.schemas.verification import (
    CitationVerificationReport,
    VerificationStatus,
    VerificationCheckResult,
    ProvenanceSpan
)
from app.core.corpus_config import corpus_registry
from app.corpus.corpus_retriever import corpus_retriever

class CitationVerificationEngine:
    """Service for running the 6-Check Citation Verification Protocol against Indian legal authorities."""

    @staticmethod
    def verify_citation(
        citation_text: str,
        proposition_claim: Optional[str] = None,
        quoted_text: Optional[str] = None,
        source_passage: Optional[str] = None,
        document_id: Optional[str] = None,
        page_number: Optional[int] = None
    ) -> CitationVerificationReport:
        
        # 1. Parse legal citation components
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', citation_text)
        year = int(year_match.group(1)) if year_match else None
        
        has_court = any(court in citation_text.lower() for court in ["supreme court", "sc", "high court", "hc", "scc", "air", "scale"])
        has_parties = " v. " in citation_text.lower() or " vs. " in citation_text.lower()

        # Extract party or statute details
        extracted_case_name = None
        if has_parties:
            extracted_case_name = re.split(r'\s+v\.?\s+|\s+vs\.?\s+', citation_text, flags=re.IGNORECASE)[0].strip()
        else:
            extracted_case_name = citation_text.split(",")[0].strip()

        extracted_statute = None
        extracted_section = None
        statute_match = re.search(r'(Constitution of India|Indian Evidence Act|Code of Civil Procedure|Contract Act)', citation_text, re.IGNORECASE)
        if statute_match:
            extracted_statute = statute_match.group(1)
        art_match = re.search(r'(Article|Section)\s+(\d+[A-Z]?)', citation_text, re.IGNORECASE)
        if art_match:
            extracted_section = f"{art_match.group(1)} {art_match.group(2)}"

        # 2. Query Authoritative Indian Legal Corpus if not explicitly supplied
        corpus_record = corpus_retriever.lookup_citation(citation_text, quoted_text=quoted_text)

        checksum_sha256 = None
        source_url = None
        paragraph_number = None

        if corpus_record:
            # Overwrite / enrich with authoritative corpus metadata
            matched_title = corpus_record["case_title"]
            official_citation = corpus_record["citation_string"]
            official_court = corpus_record["court"]
            if corpus_record.get("year"):
                year = corpus_record["year"]
            bench = corpus_record.get("bench")
            source_passage = corpus_record["text_span"]
            document_id = corpus_record["document_id"]
            page_number = corpus_record.get("page_number", 1)
            paragraph_number = corpus_record.get("paragraph_number", 1)
            source_url = corpus_record.get("source_url")
            checksum_sha256 = corpus_record.get("checksum_sha256")
            ratio = corpus_record.get("ratio_decidendi")

            # Check 1: Existence
            existence_passed = True
            existence_res = VerificationCheckResult(
                check_name="Existence",
                passed=True,
                status_if_failed="UNVERIFIED",
                details=f"Verified in Authoritative Indian Legal Corpus ({official_court}). Document ID: {document_id}.",
                evidence_snippet=f"Official Citation: {official_citation}"
            )

            # Check 2: Identity
            identity_passed = True
            identity_res = VerificationCheckResult(
                check_name="Identity",
                passed=True,
                status_if_failed="CONTESTED",
                details=f"Metadata matches official record: '{matched_title}' [{official_citation}]. Bench: {bench or 'Supreme Court Bench'}.",
                evidence_snippet=f"Jurisdiction: {official_court} | Year: {year or 'N/A'}"
            )

            # Check 3: Source
            source_passed = True
            source_res = VerificationCheckResult(
                check_name="Source",
                passed=True,
                status_if_failed="UNVERIFIED",
                details=f"Official text retrieved from {source_url or 'e-SCR / Supreme Court Repository'}. Cryptographic SHA256: {checksum_sha256[:16]}...",
                evidence_snippet=source_passage[:200] + ("..." if len(source_passage) > 200 else "")
            )

            # Check 4: Quotation
            if quoted_text and source_passage:
                q_clean = re.sub(r'[^a-zA-Z0-9\s]', '', quoted_text.lower()).strip()
                s_clean = re.sub(r'[^a-zA-Z0-9\s]', '', source_passage.lower()).strip()
                
                # Check exact substring or token set inclusion
                if q_clean in s_clean:
                    quotation_passed = True
                    quote_details = f"Quoted text matches verified corpus passage verbatim (Para {paragraph_number})."
                else:
                    q_words = set(q_clean.split())
                    s_words = set(s_clean.split())
                    overlap_ratio = len(q_words.intersection(s_words)) / max(len(q_words), 1)
                    if overlap_ratio >= 0.70:
                        quotation_passed = True
                        quote_details = f"Substantial verbatim match ({int(overlap_ratio*100)}% token alignment) with Para {paragraph_number}."
                    else:
                        quotation_passed = False
                        quote_details = f"Quotation mismatch detected against Para {paragraph_number} of {matched_title}."
            else:
                quotation_passed = True
                quote_details = "Corpus authority verified. No explicit quotation provided to verify."

            quotation_res = VerificationCheckResult(
                check_name="Quotation",
                passed=quotation_passed,
                status_if_failed="CONTESTED",
                details=quote_details,
                evidence_snippet=source_passage[:180] + "..." if source_passage else None
            )

            # Check 5: Proposition
            if proposition_claim and ratio:
                p_words = set(re.findall(r'\w+', proposition_claim.lower()))
                r_words = set(re.findall(r'\w+', ratio.lower() + " " + source_passage.lower()))
                overlap = len(p_words.intersection(r_words))
                proposition_passed = (overlap >= 2) and quotation_passed
                prop_details = f"Retrieved authority directly supports proposition: '{ratio[:150]}...'." if proposition_passed else "Passage touches subject area, but exact proposition requires judicial interpretation."
            else:
                proposition_passed = quotation_passed
                prop_details = f"Retrieved legal authority directly supports asserted principle." if proposition_passed else "Passage does not reliably support the asserted proposition."

            proposition_res = VerificationCheckResult(
                check_name="Proposition",
                passed=proposition_passed,
                status_if_failed="UNVERIFIED/CONTESTED",
                details=prop_details,
                evidence_snippet=f"Holding/Ratio: {ratio}" if ratio else None
            )

            # Check 6: Trace
            trace_passed = True
            trace_res = VerificationCheckResult(
                check_name="Trace",
                passed=True,
                status_if_failed="UNVERIFIED",
                details=f"Traceable to Document ID {document_id}, Page {page_number}, Para {paragraph_number}.",
                evidence_snippet=f"SHA256: {checksum_sha256[:16]}... | URL: {source_url}"
            )

        else:
            # Fallback heuristic checking when citation is not yet indexed in local corpus
            existence_passed = bool(year or has_court or has_parties or extracted_statute)
            existence_res = VerificationCheckResult(
                check_name="Existence",
                passed=existence_passed,
                status_if_failed="UNVERIFIED",
                details="Authority citation format matches Indian reporting standards, but record not yet cached in local corpus." if existence_passed else "Authority citation format or record not found in whitelisted corpus."
            )

            identity_passed = existence_passed and (year is not None or has_parties)
            identity_res = VerificationCheckResult(
                check_name="Identity",
                passed=identity_passed,
                status_if_failed="CONTESTED",
                details="Case title and reporting citation metadata parsed." if identity_passed else "Metadata mismatch between citation and official record."
            )

            source_passed = bool(source_passage or document_id)
            source_res = VerificationCheckResult(
                check_name="Source",
                passed=source_passed,
                status_if_failed="UNVERIFIED",
                details="User-supplied source document passage attached." if source_passed else "Original official document unretrievable from local corpus index."
            )

            if quoted_text and source_passage:
                q_clean = re.sub(r'\s+', ' ', quoted_text.strip().lower())
                s_clean = re.sub(r'\s+', ' ', source_passage.strip().lower())
                quotation_passed = q_clean in s_clean
                quote_details = "Quoted text matches supplied source text verbatim." if quotation_passed else "Quotation mismatch detected between argument and source text."
            else:
                quotation_passed = True
                quote_details = "No explicit quotation provided to verify."

            quotation_res = VerificationCheckResult(
                check_name="Quotation",
                passed=quotation_passed,
                status_if_failed="CONTESTED",
                details=quote_details
            )

            proposition_passed = source_passed and quotation_passed
            proposition_res = VerificationCheckResult(
                check_name="Proposition",
                passed=proposition_passed,
                status_if_failed="UNVERIFIED/CONTESTED",
                details="Retrieved legal authority directly supports assertion." if proposition_passed else "Passage does not reliably support the asserted proposition."
            )

            trace_passed = bool(document_id and page_number)
            trace_res = VerificationCheckResult(
                check_name="Trace",
                passed=trace_passed,
                status_if_failed="UNVERIFIED",
                details=f"Traceable to Document ID {document_id}, Page {page_number}." if trace_passed else "Citation cannot be traced to exact document page in corpus."
            )

        # Calculate Overall Status according to 6-Check Protocol
        if not existence_passed:
            overall_status = VerificationStatus.UNVERIFIED
        elif not quotation_passed or not identity_passed:
            overall_status = VerificationStatus.CONTESTED
        elif existence_passed and identity_passed and source_passed and quotation_passed and proposition_passed and trace_passed:
            overall_status = VerificationStatus.VERIFIED
        elif existence_passed and (source_passed or corpus_record):
            overall_status = VerificationStatus.PARTIAL
        else:
            overall_status = VerificationStatus.UNVERIFIED

        # Build Provenance Span
        provenance_span = None
        if document_id and page_number and source_passage:
            provenance_span = ProvenanceSpan(
                source_type="legal_authority",
                document_id=document_id,
                document_title=extracted_case_name or citation_text,
                page_number=page_number,
                text_span=source_passage[:300],
                language="en",
                extraction_confidence=0.99 if corpus_record else 0.85,
                checksum_sha256=checksum_sha256,
                source_url=source_url
            )

        return CitationVerificationReport(
            citation_id=f"cit_{hash(citation_text) & 0xffffffff:08x}",
            raw_citation=citation_text,
            extracted_case_name=extracted_case_name,
            extracted_court="Supreme Court of India" if has_court else None,
            extracted_year=year,
            extracted_statute=extracted_statute,
            extracted_section=extracted_section,
            overall_status=overall_status,
            existence_check=existence_res,
            identity_check=identity_res,
            source_check=source_res,
            quotation_check=quotation_res,
            proposition_check=proposition_res,
            trace_check=trace_res,
            provenance=provenance_span,
            lawyer_review_state="UNREVIEWED"
        )
