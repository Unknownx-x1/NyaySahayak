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
  CheckCircle2
} from 'lucide-react';

export interface EvidenceItem {
  evidence_id: string;
  title: string;
  evidence_type: string;
  claim_supported: string;
  strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'MISSING' | string;
  notes?: string;
  admissibility_status?: string;
  vulnerability_note?: string;
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

  const getStrengthBadgeClass = (strength: string) => {
    switch (strength?.toUpperCase()) {
      case 'STRONG':
        return 'badge-VERIFIED';
      case 'WEAK':
      case 'MISSING':
        return 'badge-CONTESTED';
      default:
        return 'badge-PARTIAL';
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
              <strong style={{ color: '#ffffff' }}>What does the Evidence Map represent?</strong>
              <div style={{ marginTop: '0.2rem' }}>
                In Indian courtroom litigation, every factual averment must be substantiated by admissible documentary exhibits or affidavits under the 
                <strong> Indian Evidence Act, 1872 / Bharatiya Sakshya Adhiniyam, 2023</strong>.
                This view links each factual claim to specific case exhibits, evaluates legal admissibility strength, and pinpoints vulnerabilities that opposing counsel will attack in cross-examination.
                <span style={{ color: '#a5b4fc', marginLeft: '0.35rem' }}>Click any card below to inspect full evidence details in the Big Tab.</span>
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
            Audited against Indian Evidence Act standards & adversarial challenge thresholds
          </span>
        </div>
        <span className="provenance-tag">
          Click any card for Big Tab view
        </span>
      </div>

      {/* Grid of Small Evidence Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
        {evidenceMap.map((item) => {
          const isSelected = selectedEvidence?.evidence_id === item.evidence_id;

          return (
            <div 
              key={item.evidence_id} 
              onClick={() => setSelectedEvidence(item)}
              style={{ 
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)', 
                border: isSelected ? '1.5px solid #818cf8' : '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.88rem', 
                    fontWeight: 600, 
                    color: '#ffffff',
                    lineHeight: '1.3'
                  }}>
                    {item.title}
                  </span>
                  <span className={`badge ${getStrengthBadgeClass(item.strength)}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    {item.strength}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                  <span className="provenance-tag" style={{ textTransform: 'uppercase', fontSize: '0.68rem', backgroundColor: 'var(--bg-tertiary)' }}>
                    {item.evidence_type}
                  </span>
                  <span className="provenance-tag" style={{ fontSize: '0.68rem' }}>
                    Page {item.page_number}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: '1.45' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Claim: </strong>
                  {item.claim_supported.length > 110 ? `${item.claim_supported.slice(0, 110)}...` : item.claim_supported}
                </div>

                {item.vulnerability_note && (
                  <div style={{ 
                    fontSize: '0.73rem', 
                    color: '#fca5a5', 
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '4px',
                    padding: '0.35rem 0.5rem',
                    marginBottom: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Adversary Angle: {item.vulnerability_note}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ 
                fontSize: '0.72rem', 
                color: '#818cf8', 
                borderTop: '1px dashed var(--border-color)', 
                paddingTop: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <span>Doc: {item.document_id.slice(0, 8)}...</span>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Open Big Tab &rarr;
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
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
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
              maxWidth: '780px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="provenance-tag" style={{ textTransform: 'uppercase', backgroundColor: '#3730a3', color: '#c7d2fe' }}>
                    {selectedEvidence.evidence_type}
                  </span>
                  <span className={`badge ${getStrengthBadgeClass(selectedEvidence.strength)}`}>
                    {selectedEvidence.strength} EVIDENTIARY VALUE
                  </span>
                  <span className="provenance-tag">
                    Page {selectedEvidence.page_number}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {selectedEvidence.title}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Evidence ID: {selectedEvidence.evidence_id} • Source Document: {selectedEvidence.document_id}
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

            {/* Modal Body Sections */}

            {/* Section 1: Substantive Claim Supported */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Substantive Claim Proved for Court
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                {selectedEvidence.claim_supported}
              </p>
            </div>

            {/* Section 2: Admissibility Under Indian Evidence Act / BSA */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Scale size={16} style={{ color: '#818cf8' }} /> Admissibility Assessment (Indian Evidence Act / BSA)
              </h4>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {selectedEvidence.admissibility_status || (
                  selectedEvidence.strength === 'STRONG'
                    ? 'Admissible as Primary Public Record under Section 62 / 74 of the Indian Evidence Act (Bharatiya Sakshya Adhiniyam Section 57). Enjoys statutory presumption of genuineness.'
                    : 'Secondary Evidence under Section 65 of the Indian Evidence Act. Requires proof of execution or non-availability of original to be read into evidence.'
                )}
              </div>
              {selectedEvidence.notes && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                  Auditor Observations: {selectedEvidence.notes}
                </div>
              )}
            </div>

            {/* Section 3: Exact Provenance Excerpt from Filing */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.86rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} style={{ color: '#f59e0b' }} /> Direct Quoted Text Span in Case Paper
                </h4>
                <span className="provenance-tag">Verified on Page {selectedEvidence.page_number}</span>
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

            {/* Section 4: Adversarial Cross-Examination Angles */}
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.06)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem 1.25rem' 
            }}>
              <h4 style={{ fontSize: '0.86rem', color: '#f87171', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} /> Adversarial Cross-Examination Angles (What Opposing Counsel Will Attack)
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: '1.5', margin: 0 }}>
                {selectedEvidence.vulnerability_note || (
                  "Opposing counsel is likely to challenge the authenticity of this document by objecting to lack of certified translation, absence of proof of service, or contesting execution under Section 67."
                )}
              </p>
              <div style={{ 
                marginTop: '0.65rem', 
                paddingTop: '0.5rem', 
                borderTop: '1px dashed rgba(239, 68, 68, 0.2)', 
                fontSize: '0.78rem', 
                color: 'var(--text-secondary)' 
              }}>
                <strong style={{ color: '#ffffff' }}>Recommended Pre-Trial Safeguard: </strong> 
                Ensure certified true copies and sworn affidavits of custody are placed on record before final arguments.
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
