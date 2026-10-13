import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  HelpCircle,
  Scale,
  ShieldAlert,
  CheckCircle2,
  FileQuestion,
  Zap,
  Bookmark,
  BookOpen,
  Gavel
} from 'lucide-react';

export interface EvidenceItem {
  evidence_id: string;
  title: string;
  evidence_type: 'CLAIM' | 'FACT' | 'EXHIBIT' | 'AFFIDAVIT' | 'JUDGMENT' | 'STATUTE' | 'PROCEDURAL_RECORD' | 'DOCUMENT_METADATA' | string;
  claim_supported: string;
  claimed_strength?: 'STRONG' | 'MODERATE' | 'WEAK' | 'MISSING' | 'UNKNOWN' | string;
  strength?: string;
  verification_status?: 'VERIFIED' | 'CLAIMED' | 'UNVERIFIED' | 'CONTESTED' | 'MISSING' | string;
  exhibit_id?: string;
  claimed_by?: string;
  basis?: string;
  adversarial_challenge?: string;
  vulnerability_note?: string;
  missing_evidence?: boolean;
  conflict?: boolean;
  conflict_type?: string;
  conflict_positions?: string[];
  related_evidence_ids?: string[];
  notes?: string;
  admissibility_status?: string;
  document_id: string;
  page_number: number;
  text_span: string;
}

interface EvidenceMapViewProps {
  evidenceMap: EvidenceItem[];
}

export const EvidenceMapView: React.FC<EvidenceMapViewProps> = ({ evidenceMap }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [showExplainer, setShowExplainer] = useState<boolean>(true);

  if (!evidenceMap || evidenceMap.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <ShieldCheck size={44} style={{ marginBottom: '1rem', opacity: 0.5, color: '#ffffff' }} />
        <h4 style={{ color: 'var(--text-secondary)' }}>No Evidence Items Mapped</h4>
        <p style={{ fontSize: '0.85rem', maxWidth: '480px', margin: '0.5rem auto 0' }}>
          Upload case documents or re-compile the Master Case Graph to extract documentary exhibits, affidavits, and statutory citations.
        </p>
      </div>
    );
  }

  const selectedIndex = selectedEvidence 
    ? evidenceMap.findIndex(e => e.evidence_id === selectedEvidence.evidence_id) 
    : -1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex > 0) {
      setSelectedEvidence(evidenceMap[selectedIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex < evidenceMap.length - 1) {
      setSelectedEvidence(evidenceMap[selectedIndex + 1]);
    }
  };

  const getStrengthBadgeClass = (strength?: string) => {
    switch (strength?.toUpperCase()) {
      case 'STRONG':
        return 'badge-VERIFIED';
      case 'WEAK':
      case 'MISSING':
        return 'badge-CONTESTED';
      case 'UNKNOWN':
        return 'badge-PARTIAL';
      default:
        return 'badge-PARTIAL';
    }
  };

  const getVerificationBadge = (status?: string) => {
    const s = status?.toUpperCase() || 'CLAIMED';
    switch (s) {
      case 'VERIFIED':
        return { label: 'VERIFIED', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'CONTESTED':
        return { label: 'CONTESTED', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'MISSING':
        return { label: 'MISSING RECORD', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'UNVERIFIED':
        return { label: 'UNVERIFIED', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
      default:
        return { label: 'CLAIMED (Not Independently Verified)', bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' };
    }
  };

  const getTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    switch (t) {
      case 'EXHIBIT':
        return { bg: 'rgba(147, 51, 234, 0.18)', color: '#c084fc', border: '1px solid rgba(147, 51, 234, 0.35)', icon: <Bookmark size={12} /> };
      case 'FACT':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', icon: <FileText size={12} /> };
      case 'CLAIM':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', icon: <HelpCircle size={12} /> };
      case 'JUDGMENT':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', icon: <Gavel size={12} /> };
      case 'STATUTE':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', icon: <Scale size={12} /> };
      case 'PROCEDURAL_RECORD':
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)', icon: <BookOpen size={12} /> };
      case 'AFFIDAVIT':
        return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)', icon: <FileCheck size={12} /> };
      default:
        return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', icon: <FileText size={12} /> };
    }
  };

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Educational Explainer Banner */}
      {showExplainer && (
        <div style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <HelpCircle size={18} style={{ color: '#818cf8', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#ffffff' }}>What does the Evidentiary Graph represent?</strong>
              <div style={{ marginTop: '0.2rem' }}>
                Under the <strong>Indian Evidence Act / Bharatiya Sakshya Adhiniyam</strong>, court proceedings strictly distinguish between 
                <em> Pleading Claims</em>, <em>Factual Milestones</em>, and <em>Admissible Exhibits</em>.
                This engine separates <strong>Evidence Type</strong> from <strong>Claimed Strength</strong> and <strong>Verification Status</strong>.
                Missing documents and contested hearing claims are prominently flagged for cross-examination readiness.
                <span style={{ color: '#a5b4fc', marginLeft: '0.35rem' }}>Click any card to inspect full legal basis and cross-examination angles.</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowExplainer(false)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            title="Dismiss explanation"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={18} style={{ color: '#ffffff' }} /> Evidentiary Graph & Exhibits ({evidenceMap.length} Items)
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Categorized by Evidence Type • Evaluated for Claimed Strength • Audited for Missing Documents & Contradictions
          </span>
        </div>
        <span className="provenance-tag">
          Click any card for Big Tab view
        </span>
      </div>

      {/* Grid of Evidence Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
        {evidenceMap.map((item) => {
          const isSelected = selectedEvidence?.evidence_id === item.evidence_id;
          const strengthVal = item.claimed_strength || item.strength || 'MODERATE';
          const verBadge = getVerificationBadge(item.verification_status);
          const typeStyle = getTypeStyle(item.evidence_type);
          const challenge = item.adversarial_challenge || item.vulnerability_note;

          return (
            <div 
              key={item.evidence_id} 
              onClick={() => setSelectedEvidence(item)}
              style={{ 
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)', 
                border: isSelected ? '1.5px solid #818cf8' : item.missing_evidence ? '1px solid rgba(245, 158, 11, 0.4)' : item.conflict ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSelected ? '0 0 14px rgba(99, 102, 241, 0.25)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = item.missing_evidence ? 'rgba(245, 158, 11, 0.4)' : item.conflict ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <div>
                {/* Top Badges Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem', 
                      fontSize: '0.68rem', 
                      fontWeight: 600, 
                      padding: '0.2rem 0.45rem', 
                      borderRadius: '4px',
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.color,
                      border: typeStyle.border
                    }}>
                      {typeStyle.icon}
                      {item.evidence_type.toUpperCase()}
                    </span>
                    {item.exhibit_id && (
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.45rem', 
                        borderRadius: '4px',
                        backgroundColor: 'rgba(217, 70, 239, 0.15)',
                        color: '#f0abfc',
                        border: '1px solid rgba(217, 70, 239, 0.35)'
                      }}>
                        Exhibit {item.exhibit_id}
                      </span>
                    )}
                  </div>
                  <span className={`badge ${getStrengthBadgeClass(strengthVal)}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    Claimed Strength: {strengthVal}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{ 
                  fontSize: '0.92rem', 
                  fontWeight: 600, 
                  color: '#ffffff',
                  lineHeight: '1.35',
                  margin: '0 0 0.5rem 0'
                }}>
                  {item.title}
                </h4>

                {/* Missing / Conflict Banners if active */}
                {item.missing_evidence && (
                  <div style={{ 
                    fontSize: '0.72rem', 
                    color: '#fbbf24', 
                    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                    border: '1px solid rgba(245, 158, 11, 0.3)', 
                    borderRadius: '4px', 
                    padding: '0.3rem 0.5rem', 
                    marginBottom: '0.55rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <FileQuestion size={13} style={{ flexShrink: 0 }} />
                    <span><strong>Missing Document:</strong> Referenced in petition, but underlying record not produced</span>
                  </div>
                )}

                {item.conflict && (
                  <div style={{ 
                    fontSize: '0.72rem', 
                    color: '#f87171', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                    borderRadius: '4px', 
                    padding: '0.3rem 0.5rem', 
                    marginBottom: '0.55rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Zap size={13} style={{ flexShrink: 0 }} />
                    <span><strong>Contested Matter:</strong> Direct contradiction between Petitioner and Respondent averments</span>
                  </div>
                )}

                {/* Verification Status Pill */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    backgroundColor: verBadge.bg,
                    color: verBadge.color,
                    border: verBadge.border,
                    display: 'inline-block'
                  }}>
                    Verification: {verBadge.label}
                  </span>
                </div>

                {/* Substantive Claim */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: '1.45' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Claim: </strong>
                  {item.claim_supported.length > 130 ? `${item.claim_supported.slice(0, 130)}...` : item.claim_supported}
                </div>

                {/* Basis if available */}
                {item.basis && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontStyle: 'italic' }}>
                    <strong style={{ fontStyle: 'normal', color: 'var(--text-secondary)' }}>Basis: </strong>
                    {item.basis}
                  </div>
                )}

                {/* Targeted Adversarial Challenge */}
                {challenge && (
                  <div style={{ 
                    fontSize: '0.73rem', 
                    color: '#fca5a5', 
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    borderRadius: '4px',
                    padding: '0.45rem 0.55rem',
                    marginBottom: '0.65rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem'
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ lineHeight: '1.4' }}>
                      <strong style={{ color: '#f87171' }}>Targeted Challenge: </strong>
                      {challenge}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Info */}
              <div style={{ 
                fontSize: '0.72rem', 
                color: '#818cf8', 
                borderTop: '1px dashed var(--border-color)', 
                paddingTop: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <span>Page {item.page_number} • {item.claimed_by || 'Case Record'}</span>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Inspect in Big Tab &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BIG TAB MODAL / DETAILED EVIDENCE INSPECTOR */}
      {selectedEvidence && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} onClick={() => setSelectedEvidence(null)}>
          <div 
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg, 12px)',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
              padding: '1.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    padding: '0.25rem 0.55rem', 
                    borderRadius: '4px',
                    backgroundColor: getTypeStyle(selectedEvidence.evidence_type).bg,
                    color: getTypeStyle(selectedEvidence.evidence_type).color,
                    border: getTypeStyle(selectedEvidence.evidence_type).border
                  }}>
                    {selectedEvidence.evidence_type.toUpperCase()}
                  </span>
                  {selectedEvidence.exhibit_id && (
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '0.25rem 0.55rem', 
                      borderRadius: '4px',
                      backgroundColor: 'rgba(217, 70, 239, 0.2)',
                      color: '#f0abfc'
                    }}>
                      Exhibit {selectedEvidence.exhibit_id}
                    </span>
                  )}
                  <span className={`badge ${getStrengthBadgeClass(selectedEvidence.claimed_strength || selectedEvidence.strength)}`}>
                    Claimed Strength: {selectedEvidence.claimed_strength || selectedEvidence.strength || 'MODERATE'}
                  </span>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    padding: '0.25rem 0.55rem', 
                    borderRadius: '4px',
                    backgroundColor: getVerificationBadge(selectedEvidence.verification_status).bg,
                    color: getVerificationBadge(selectedEvidence.verification_status).color,
                    border: getVerificationBadge(selectedEvidence.verification_status).border
                  }}>
                    {getVerificationBadge(selectedEvidence.verification_status).label}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {selectedEvidence.title}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  ID: {selectedEvidence.evidence_id} • Page {selectedEvidence.page_number} • Claimed By: {selectedEvidence.claimed_by || 'Case Record'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={handlePrev}
                  disabled={selectedIndex <= 0}
                  className="btn"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', opacity: selectedIndex <= 0 ? 0.3 : 1 }}
                  title="Previous Evidence Item"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleNext}
                  disabled={selectedIndex >= evidenceMap.length - 1}
                  className="btn"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', opacity: selectedIndex >= evidenceMap.length - 1 ? 0.3 : 1 }}
                  title="Next Evidence Item"
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => setSelectedEvidence(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', marginLeft: '0.5rem' }}
                  title="Close Inspector"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contradiction Breakdown Banner if in conflict */}
            {selectedEvidence.conflict && selectedEvidence.conflict_positions && selectedEvidence.conflict_positions.length > 0 && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
                <h4 style={{ fontSize: '0.86rem', color: '#f87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={16} /> Disputed Evidentiary Positions (Factual Contradiction)
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {selectedEvidence.conflict_positions.map((pos, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{pos}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 1: Substantive Claim Supported */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Substantive Claim Asserted
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                {selectedEvidence.claim_supported}
              </p>
              {selectedEvidence.basis && (
                <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#ffffff' }}>System Classification Basis: </strong>
                  {selectedEvidence.basis}
                </div>
              )}
            </div>

            {/* Section 2: Case-Specific Adversarial Cross-Examination Angles */}
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.06)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.1rem 1.25rem' 
            }}>
              <h4 style={{ fontSize: '0.86rem', color: '#f87171', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} /> Targeted Adversarial Inquiries (Opposing Counsel & Bench Scrutiny)
              </h4>
              <p style={{ fontSize: '0.87rem', color: '#fca5a5', lineHeight: '1.5', margin: 0, fontWeight: 500 }}>
                "{selectedEvidence.adversarial_challenge || selectedEvidence.vulnerability_note}"
              </p>
              <div style={{ 
                marginTop: '0.65rem', 
                paddingTop: '0.5rem', 
                borderTop: '1px dashed rgba(239, 68, 68, 0.2)', 
                fontSize: '0.78rem', 
                color: 'var(--text-secondary)' 
              }}>
                <strong style={{ color: '#ffffff' }}>Litigation Readiness Tip: </strong> 
                Be prepared to produce contemporaneous certified transcripts or official records to satisfy judicial scrutiny.
              </div>
            </div>

            {/* Section 3: Admissibility Under Indian Evidence Act / BSA */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Scale size={16} style={{ color: '#818cf8' }} /> Admissibility Framework (Indian Evidence Act / BSA)
              </h4>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {selectedEvidence.admissibility_status || (
                  selectedEvidence.claimed_strength === 'STRONG'
                    ? 'Admissible subject to Section 62/65 of the Indian Evidence Act (Bharatiya Sakshya Adhiniyam Section 57).'
                    : 'Secondary Evidence; Requires proof of execution and availability under Section 65 condition.'
                )}
              </div>
            </div>

            {/* Section 4: Exact Provenance Excerpt */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.86rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} style={{ color: '#f59e0b' }} /> Exact Quoted Text Span in Pleading Record
                </h4>
                <span className="provenance-tag">Page {selectedEvidence.page_number}</span>
              </div>
              <div style={{ 
                fontSize: '0.84rem', 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-mono, monospace)', 
                backgroundColor: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '0.75rem',
                lineHeight: '1.5'
              }}>
                "{selectedEvidence.text_span || selectedEvidence.claim_supported}"
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Item {selectedIndex + 1} of {evidenceMap.length}
              </span>
              <button 
                className="btn btn-primary" 
                onClick={() => setSelectedEvidence(null)}
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.82rem' }}
              >
                Close Big Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
