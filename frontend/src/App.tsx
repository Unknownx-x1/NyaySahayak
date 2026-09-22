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
  CheckCircle2, 
  ChevronRight,
  BookOpen,
  Clock,
  Briefcase
} from 'lucide-react';
import { CaseUpload } from './components/CaseUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { CitationBadge } from './components/CitationBadge';
import { CorpusWhitelistView } from './components/CorpusWhitelistView';
import { CaseGraphDashboard, CaseGraph } from './components/CaseGraphDashboard';
import { CourtroomSimulation } from './components/CourtroomSimulation';

interface CitationReport {
  citation_id: string;
  raw_citation: string;
  overall_status: 'VERIFIED' | 'PARTIAL' | 'CONTESTED' | 'UNVERIFIED';
  existence_check: { passed: boolean; details: string };
  identity_check: { passed: boolean; details: string };
  source_check: { passed: boolean; details: string };
  quotation_check: { passed: boolean; details: string };
  proposition_check: { passed: boolean; details: string };
  trace_check: { passed: boolean; details: string };
}

export type TabMode = 'documents' | 'case_graph' | 'simulation' | 'verification' | 'corpus';

export default function App() {
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

  const handleRunVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: activeCaseId,
          citation_text: testCitation,
          quoted_text: testQuote,
          source_passage: testSource,
          document_id: selectedDoc?.id || 'doc_sc_1973',
          page_number: 45
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

  return (
    <div className="app-container">
      {/* Top Header with Navigation Tabs */}
      <header className="header">
        <div className="logo-group">
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

          <a
            href="http://127.0.0.1:8080"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <Home size={14} />
            <span>Landing</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Context Status Banner */}
        <div className="phase-banner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="phase-tag">Active Workspace</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Case #{activeCaseId.slice(0, 8)}</span>
            </div>
            <h2 style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              State of Kerala v. Constitutional Amendments
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Supreme Court of India • WP(C) 135/1973 • Single Versioned Legal Context Engine
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.35rem 0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem' 
            }}>
              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
              <span><strong>{documents.length}</strong> Document(s)</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.35rem 0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem' 
            }}>
              <Layers size={14} style={{ color: caseGraph ? 'var(--status-verified)' : 'var(--text-muted)' }} />
              <span><strong>{caseGraph?.facts.length || 0}</strong> Facts Mapped</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.35rem 0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem' 
            }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span><strong>{caseGraph?.timeline.length || 0}</strong> Timeline Events</span>
            </div>

            <span className="provenance-tag">
              <CheckCircle2 size={12} style={{ color: 'var(--status-verified)' }} />
              Gate G1 OCR Active
            </span>
          </div>
        </div>

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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                Verify legal propositions against the 6 strict integrity gates: <em>Existence, Identity, Source, Quotation, Proposition, Trace</em>.
              </p>

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
                    Retrieved Source Authority Passage
                  </label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    value={testSource}
                    onChange={(e) => setTestSource(e.target.value)}
                    placeholder="Exact excerpt retrieved from official authority..."
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleRunVerification} 
                  disabled={verifying}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  <ShieldCheck size={16} />
                  <span>{verifying ? 'Verifying Across 6 Checks...' : 'Run 6-Check Verification Protocol'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Verification Result Report */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  Verification Audit Certificate
                </h3>
                {verificationReport && <CitationBadge status={verificationReport.overall_status} />}
              </div>

              {!verificationReport ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>No Verification Executed Yet</h4>
                  <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>
                    Configure the citation parameters on the left and trigger the protocol to inspect the full 6-gate audit trail.
                  </p>
                </div>
              ) : (
                <div className="verification-panel" style={{ marginTop: 0 }}>
                  <div className="check-item">
                    <div>
                      <div className="check-title">1. Existence Check</div>
                      <div className="check-details">{verificationReport.existence_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.existence_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.existence_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">2. Identity Check</div>
                      <div className="check-details">{verificationReport.identity_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.identity_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.identity_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">3. Source Check</div>
                      <div className="check-details">{verificationReport.source_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.source_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.source_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">4. Quotation Check</div>
                      <div className="check-details">{verificationReport.quotation_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.quotation_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.quotation_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">5. Proposition Check</div>
                      <div className="check-details">{verificationReport.proposition_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.proposition_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.proposition_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="check-item">
                    <div>
                      <div className="check-title">6. Trace Check</div>
                      <div className="check-details">{verificationReport.trace_check.details}</div>
                    </div>
                    <span style={{ color: verificationReport.trace_check.passed ? 'var(--status-verified)' : 'var(--status-contested)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {verificationReport.trace_check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
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
