import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  Layers, 
  Sparkles, 
  Home, 
  Swords, 
  Database, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { CaseUpload } from './components/CaseUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { CitationBadge } from './components/CitationBadge';
import { CorpusWhitelistView } from './components/CorpusWhitelistView';
import { CaseGraphDashboard, CaseGraph } from './components/CaseGraphDashboard';
import { CourtroomSimulation } from './components/CourtroomSimulation';
import { LandingPage } from './components/landing/LandingPage';

interface CitationReport {
  citation_id: string;
  raw_citation: string;
  extracted_case_name?: string;
  extracted_court?: string;
  extracted_year?: number;
  extracted_statute?: string;
  extracted_section?: string;
  overall_status: 'VERIFIED' | 'PARTIAL' | 'CONTESTED' | 'UNVERIFIED' | 'NOT_FOUND';
  existence_check: { passed: boolean; details: string; evidence_snippet?: string };
  identity_check: { passed: boolean; details: string; evidence_snippet?: string };
  source_check: { passed: boolean; details: string; evidence_snippet?: string; source_type?: string };
  quotation_check: { passed: boolean; details: string; evidence_snippet?: string; match_type?: string };
  proposition_check: { passed: boolean; details: string; evidence_snippet?: string };
  trace_check: { passed: boolean; details: string; evidence_snippet?: string };
  source_type?: string;
  quotation_match_type?: string;
  user_document_trace?: {
    document_id?: string;
    page_number?: number;
    is_user_supplied: boolean;
    details?: string;
  } | null;
  authoritative_legal_trace?: {
    corpus_document_id?: string;
    case_title?: string;
    citation_string?: string;
    court?: string;
    paragraph_number?: number;
    page_number?: number;
    source_url?: string;
    checksum_sha256?: string;
    is_authoritative: boolean;
    details?: string;
  } | null;
}

export type TabMode = 'documents' | 'case_graph' | 'simulation' | 'verification' | 'corpus';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#workspace') {
      return 'workspace';
    }
    return 'landing';
  });
  const [activeCaseId, setActiveCaseId] = useState<string>('case_demo_001');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('documents');
  
  // Phase 2 Case Graph State
  const [caseGraph, setCaseGraph] = useState<CaseGraph | null>(null);
  const [compilingGraph, setCompilingGraph] = useState(false);

  // Verification Tester state
  const [testCitation, setTestCitation] = useState('Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225');
  const [testQuote, setTestQuote] = useState('Basic structure of the Constitution cannot be amended.');
  const [testSource, setTestSource] = useState('The basic structure of the Constitution of India cannot be altered or damaged by constitutional amendment.');
  const [verifying, setVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<CitationReport | null>(null);

  // Initialize Demo Case
  useEffect(() => {
    fetch(`/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'counsel_demo',
        title: 'State of Kerala v. Constitutional Amendments (Demo)',
        case_number: 'WP(C) 135/1973',
        court_type: 'Supreme Court of India',
        description: 'Constitutional validity demo workspace'
      })
    })
      .then(res => res.json())
      .then(data => setActiveCaseId(data.id))
      .catch(() => {});
  }, []);

  const handleUploadSuccess = (docData: any) => {
    setDocuments(prev => [docData, ...prev]);
    setSelectedDoc(docData);
    handleGenerateCaseGraph();
  };

  const handleGenerateCaseGraph = async () => {
    setCompilingGraph(true);
    try {
      const res = await fetch(`/api/case-graph/generate/${activeCaseId}`, { method: 'POST' });
      const data = await res.json();
      setCaseGraph(data);
    } catch (err) {
      console.error('Failed to generate Case Graph:', err);
    } finally {
      setCompilingGraph(false);
    }
  };

  const loadPreset = (type: 'A' | 'B' | 'C' | 'D') => {
    if (type === 'A') {
      setTestCitation('Sharma Infrastructure Ltd. v. Union of India, (2019) 12 SCC 847');
      setTestQuote('Public interest constitutes a complete exception to the audi alteram partem rule.');
      setTestSource('In situations of overriding public interest, audi alteram partem has no application whatsoever.');
    } else if (type === 'B') {
      setTestCitation('Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1');
      setTestQuote('High Courts are strictly barred under all circumstances from entertaining Article 226 petitions whenever statutory appeal lies.');
      setTestSource('The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature');
    } else if (type === 'C') {
      setTestCitation('Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1');
      setTestQuote('The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature');
      setTestSource('The power to issue prerogative writs under Article 226 of the Constitution is plenary in nature');
    } else if (type === 'D') {
      setTestCitation('Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225');
      setTestQuote('Basic structure of the Constitution cannot be amended.');
      setTestSource('The basic structure of the Constitution of India cannot be altered or damaged by constitutional amendment.');
    }
  };

  const handleRunVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: activeCaseId,
          citation_text: testCitation,
          proposition_claim: testQuote,
          quoted_text: testQuote,
          source_passage: testSource,
          document_id: selectedDoc?.id || 'doc_user_input',
          page_number: 14
        })
      });
      const data = await res.json();
      setVerificationReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#workspace') {
        setCurrentView('workspace');
      } else if (window.location.hash === '#landing' || !window.location.hash) {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToWorkspace = () => {
    setCurrentView('workspace');
    window.location.hash = '#workspace';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLanding = () => {
    setCurrentView('landing');
    window.location.hash = '#landing';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on landing page, display the full-featured LandingPage experience
  if (currentView === 'landing') {
    return <LandingPage onLaunchAppWorkspace={navigateToWorkspace} />;
  }

  return (
    <div className="app-container">
      {/* Top Header with Navigation Tabs */}
      <header className="header">
        <div 
          className="logo-group" 
          onClick={navigateToLanding}
          style={{ cursor: 'pointer' }}
          title="Back to Landing Page"
        >
          <div className="logo-badge">NYAY</div>
          <div>
            <div className="logo-title">NyaySahayak</div>
            <div className="subtitle">Verified Multi-Agent Legal Intelligence</div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="nav-tabs-bar" aria-label="Main Navigation">
          <button 
            className={`nav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={15} />
            <span>Documents & Ingestion</span>
            {documents.length > 0 && <span className="nav-tab-badge">{documents.length}</span>}
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'case_graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('case_graph')}
          >
            <Layers size={15} />
            <span>Case Graph</span>
            {caseGraph?.facts && <span className="nav-tab-badge">{caseGraph.facts.length} facts</span>}
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            <Swords size={15} />
            <span>Courtroom Arena</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <ShieldCheck size={15} />
            <span>Citation Lab</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'corpus' ? 'active' : ''}`}
            onClick={() => setActiveTab('corpus')}
          >
            <Database size={15} />
            <span>Legal Corpus</span>
          </button>
        </nav>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={handleGenerateCaseGraph}
            disabled={compilingGraph}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          >
            <Sparkles size={14} />
            <span>{compilingGraph ? 'Compiling Graph...' : 'Compile Graph'}</span>
          </button>

          <button
            onClick={navigateToLanding}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            title="Return to Landing Page"
          >
            <Home size={14} />
            <span>Landing Page</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">


        {/* View 1: Documents & Ingestion */}
        {activeTab === 'documents' && (
          <div className="layout-documents">
            {/* Left Column: Upload Card + Uploaded Files List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <CaseUpload caseId={activeCaseId} onUploadSuccess={handleUploadSuccess} />

              {/* Uploaded Documents Drawer */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} /> Uploaded Filings ({documents.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page-Preserved</span>
                </div>

                {documents.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                    No case documents uploaded yet. Upload a PDF, DOCX, or TXT above to begin extraction.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        onClick={() => setSelectedDoc(doc)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: selectedDoc?.id === doc.id ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                          border: selectedDoc?.id === doc.id ? '1px solid #ffffff' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {doc.filename}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {doc.page_count} page(s) • {doc.chunks?.length || 0} chunks • {doc.detected_languages?.toUpperCase()}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Full Document Viewer */}
            <div style={{ minHeight: '620px' }}>
              <DocumentViewer document={selectedDoc} />
            </div>
          </div>
        )}

        {/* View 2: Master Case Graph Dashboard */}
        {activeTab === 'case_graph' && (
          <div className="layout-full">
            <CaseGraphDashboard
              caseGraph={caseGraph}
              onGenerateGraph={handleGenerateCaseGraph}
              loading={compilingGraph}
              onUpdateCaseGraph={(updated) => setCaseGraph(updated)}
            />
          </div>
        )}

        {/* View 3: Courtroom Sparring Arena */}
        {activeTab === 'simulation' && (
          <div className="layout-full">
            <CourtroomSimulation caseId={activeCaseId} />
          </div>
        )}

        {/* View 4: Citation Verification Lab */}
        {activeTab === 'verification' && (
          <div className="layout-verification">
            {/* Left Column: Citation Input Form */}
            <div className="card">
              <h3 className="card-title">
                <ShieldCheck size={18} style={{ color: '#ffffff' }} /> 6-Check Citation Protocol Lab
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Verify legal propositions against the 6 strict integrity gates: <em>Existence, Identity, Source, Quotation, Proposition, Trace</em>.
              </p>

              {/* Quick Test Presets */}
              <div style={{ marginBottom: '1.1rem', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Preconfigured Integrity Test Scenarios:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => loadPreset('A')}
                    className="btn"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)' }}
                    title="Fabricated Citation: Sharma Infrastructure"
                  >
                    Test A (Fake Citation / Sharma Infra)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('B')}
                    className="btn"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fcd34d', background: 'rgba(245, 158, 11, 0.08)' }}
                    title="Real Citation + Contradictory Claim: Whirlpool"
                  >
                    Test B (Real Citation + Fake Claim)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('C')}
                    className="btn"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.08)' }}
                    title="Real Citation + Supported Claim: Whirlpool"
                  >
                    Test C (Whirlpool Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('D')}
                    className="btn"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-tertiary)' }}
                    title="Kesavananda Bharati (1973)"
                  >
                    Test D (Kesavananda Bharati)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Legal Citation
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={testCitation}
                    onChange={(e) => setTestCitation(e.target.value)}
                    placeholder="e.g. Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Quoted Proposition / Claim
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={testQuote}
                    onChange={(e) => setTestQuote(e.target.value)}
                    placeholder="e.g. Basic structure of the Constitution cannot be amended."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    User-Supplied Source Passage (Optional / Non-Authoritative)
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={testSource}
                    onChange={(e) => setTestSource(e.target.value)}
                    placeholder="User-provided excerpt from pleading or upload..."
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Note: User-supplied passages cannot establish authoritative source verification.
                  </span>
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleRunVerification} 
                  disabled={verifying}
                  style={{ marginTop: '0.3rem', width: '100%' }}
                >
                  <ShieldCheck size={16} />
                  <span>{verifying ? 'Verifying Across 6 Checks...' : 'Run 6-Check Verification Protocol'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Verification Result Report */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    Verification Audit Certificate
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Authoritative Indian Legal Corpus Grounding Protocol
                  </div>
                </div>
                {verificationReport && <CitationBadge status={verificationReport.overall_status} />}
              </div>

              {!verificationReport ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>No Verification Executed Yet</h4>
                  <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>
                    Configure the citation parameters on the left or select a preset to inspect the 6-gate audit trail.
                  </p>
                </div>
              ) : (
                <div className="verification-panel" style={{ marginTop: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Distinct Verification Tiers Bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.2rem' }}>Tiers:</span>
                    
                    {/* PARSED */}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: verificationReport.extracted_case_name ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: '1px solid var(--border-color)'
                    }}>
                      PARSED: {verificationReport.extracted_case_name ? 'VALID FORMAT' : 'UNPARSED'}
                    </span>

                    {/* USER-SUPPLIED */}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: verificationReport.user_document_trace ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      color: verificationReport.user_document_trace ? '#f59e0b' : 'var(--text-muted)',
                      border: verificationReport.user_document_trace ? '1px solid rgba(245, 158, 11, 0.3)' : '1px dashed var(--border-color)'
                    }}>
                      {verificationReport.user_document_trace ? 'USER-SUPPLIED INPUT' : 'NO USER ATTACHMENT'}
                    </span>

                    {/* CORPUS-MATCHED */}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: verificationReport.existence_check.passed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                      color: verificationReport.existence_check.passed ? 'var(--status-verified)' : '#f87171',
                      border: verificationReport.existence_check.passed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)'
                    }}>
                      {verificationReport.existence_check.passed ? 'CORPUS-MATCHED' : 'NO CORPUS MATCH'}
                    </span>

                    {/* AUTHORITATIVE */}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: verificationReport.authoritative_legal_trace ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                      color: verificationReport.authoritative_legal_trace ? '#60a5fa' : 'var(--text-muted)',
                      border: verificationReport.authoritative_legal_trace ? '1px solid rgba(59, 130, 246, 0.3)' : '1px dashed var(--border-color)'
                    }}>
                      {verificationReport.authoritative_legal_trace ? 'AUTHORITATIVE GROUNDING' : 'NOT AUTHORITATIVE'}
                    </span>

                    {/* VERIFIED */}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '4px',
                      backgroundColor: verificationReport.overall_status === 'VERIFIED' ? 'var(--status-verified)' : 'transparent',
                      color: verificationReport.overall_status === 'VERIFIED' ? '#000000' : 'var(--text-muted)',
                      border: verificationReport.overall_status === 'VERIFIED' ? 'none' : '1px solid var(--border-color)'
                    }}>
                      {verificationReport.overall_status === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  </div>

                  {/* 6 Verification Checks */}
                  <div className="check-item">
                    <div>
                      <div className="check-title">1. Existence Check</div>
                      <div className="check-details">{verificationReport.existence_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.existence_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.existence_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">2. Identity Check</div>
                      <div className="check-details">{verificationReport.identity_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.identity_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.identity_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        3. Source Check
                        {verificationReport.source_type && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                            [{verificationReport.source_type}]
                          </span>
                        )}
                      </div>
                      <div className="check-details">{verificationReport.source_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.source_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.source_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        4. Quotation Check
                        {verificationReport.quotation_match_type && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                            [{verificationReport.quotation_match_type}]
                          </span>
                        )}
                      </div>
                      <div className="check-details">{verificationReport.quotation_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.quotation_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.quotation_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">5. Proposition Check</div>
                      <div className="check-details">{verificationReport.proposition_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.proposition_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.proposition_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">6. Trace Check</div>
                      <div className="check-details">{verificationReport.trace_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.trace_check.passed ? 'var(--status-verified)' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.trace_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  {/* Separate Authoritative Legal Trace & User Document Trace Panes */}
                  {verificationReport.authoritative_legal_trace && (
                    <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--status-verified)', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Authoritative Legal Corpus Trace
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <div><strong>Document:</strong> {verificationReport.authoritative_legal_trace.corpus_document_id} ({verificationReport.authoritative_legal_trace.case_title})</div>
                        <div><strong>Location:</strong> Para {verificationReport.authoritative_legal_trace.paragraph_number}, Page {verificationReport.authoritative_legal_trace.page_number}</div>
                        {verificationReport.authoritative_legal_trace.checksum_sha256 && (
                          <div><strong>SHA-256:</strong> <code>{verificationReport.authoritative_legal_trace.checksum_sha256}</code></div>
                        )}
                        {verificationReport.authoritative_legal_trace.source_url && (
                          <div><strong>Official Source:</strong> <a href={verificationReport.authoritative_legal_trace.source_url} target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'underline' }}>{verificationReport.authoritative_legal_trace.source_url}</a></div>
                        )}
                      </div>
                    </div>
                  )}

                  {verificationReport.user_document_trace && !verificationReport.authoritative_legal_trace && (
                    <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                      <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.3rem' }}>
                        User Document Trace (Non-Authoritative)
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <div><strong>File ID:</strong> {verificationReport.user_document_trace.document_id || 'User Upload'} (Page {verificationReport.user_document_trace.page_number || 1})</div>
                        <div><strong>Audit Note:</strong> User-document trace only — authoritative trace unavailable in official Indian Legal Corpus.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* View 5: Legal Corpus Whitelist */}
        {activeTab === 'corpus' && (
          <div className="layout-full">
            <CorpusWhitelistView />
          </div>
        )}
      </main>
    </div>
  );
}
