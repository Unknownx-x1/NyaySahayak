import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  Search, 
  Send, 
  ShieldCheck, 
  Layers, 
  Copy, 
  Check, 
  Filter, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap
} from 'lucide-react';

interface Chunk {
  id: string;
  page_number: number;
  chunk_index: number;
  text_content: string;
  language: string;
  script_type?: string;
  ocr_applied?: boolean;
  extraction_confidence: number;
  provenance?: {
    source_type: string;
    document_id: string;
    page: number;
    text_span: string;
    language: string;
    script_type?: string;
    ocr_applied?: boolean;
    extraction_confidence: number;
  };
}

interface RAGSource {
  document_id: string;
  filename: string;
  page_number: number;
  chunk_index: number;
  text_span: string;
  relevance_score: number;
  language: string;
  script_type?: string;
  ocr_applied?: boolean;
  provenance?: any;
}

interface RAGResult {
  query: string;
  answer: string;
  provider: string;
  model: string;
  sources: RAGSource[];
}

interface DocumentViewerProps {
  document: {
    id: string;
    filename: string;
    page_count: number;
    detected_languages: string;
    chunks?: Chunk[];
  } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rag' | 'raw_audit'>('rag');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSourceIdx, setExpandedSourceIdx] = useState<number | null>(null);

  // Raw chunks filter state (for audit mode)
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const sampleQuestions = [
    "Summarize the petitioner's core legal challenge and prayers.",
    "What specific statutory provisions, bare acts, or articles are cited?",
    "Extract all chronological dates, notices, and orders mentioned.",
    "Are there any disputed claims, evidentiary gaps, or contradictions?",
    "What are the opposing counsel's strongest rebuttal angles?",
  ];

  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[Page\s*\d+[^\]]*\]|\*Page\s*\d+[^\*]*\*)/gi);
    return parts.map((part, i) => {
      if (/^\[Page\s*\d+/i.test(part) || /^\*Page\s*\d+/i.test(part)) {
        const cleanLabel = part.replace(/[\*\[\]]/g, '').trim();
        return (
          <span 
            key={i} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              background: 'rgba(16, 185, 129, 0.2)', 
              color: '#34d399', 
              border: '1px solid rgba(16, 185, 129, 0.4)', 
              borderRadius: '4px', 
              padding: '0.05rem 0.4rem', 
              fontWeight: 600, 
              fontSize: '0.76rem', 
              margin: '0 0.2rem',
              cursor: 'pointer'
            }}
            title="Grounding Citation"
          >
            {cleanLabel}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!document) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.5, color: '#ffffff' }} />
        <h4 style={{ color: 'var(--text-secondary)' }}>No Case Document Selected</h4>
        <p style={{ fontSize: '0.85rem' }}>
          Upload or select a legal filing on the left to start asking grounded questions using the Groq-powered Legal RAG system.
        </p>
      </div>
    );
  }

  const chunks = document.chunks || [];

  const handleRunRAG = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    if (customQuery) {
      setQuery(customQuery);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/documents/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id,
          query: q,
          top_k: 4
        })
      });
      const data = await res.json();
      setRagResult(data);
      setExpandedSourceIdx(0); // auto-expand top source
    } catch (err) {
      console.error('Failed to run document RAG query:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!ragResult) return;
    navigator.clipboard.writeText(ragResult.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Raw chunks for secondary audit mode
  const filteredChunks = chunks.filter((c) => {
    if (selectedFilter === 'hi') return c.language === 'hi' || (c.script_type && c.script_type.includes('devanagari'));
    if (selectedFilter === 'ta') return c.language === 'ta' || (c.script_type && c.script_type.includes('tamil'));
    if (selectedFilter === 'ocr') return c.ocr_applied;
    return true;
  });

  return (
    <div className="card document-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with Document Metadata & View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: '#ffffff' }} />
            <h3 className="card-title" style={{ margin: 0 }}>
              {document.filename}
            </h3>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {document.page_count} Page(s) • Languages: {document.detected_languages?.toUpperCase()} • {chunks.length} Indexed Page Spans
          </div>
        </div>

        {/* View Mode Toggle: RAG System (Primary) vs Raw Chunks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${activeSubTab === 'rag' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSubTab('rag')}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', border: 'none' }}
          >
            <Zap size={13} style={{ color: activeSubTab === 'rag' ? '#000000' : '#ffffff' }} />
            <span>Document RAG (Groq AI)</span>
          </button>
          <button
            className={`btn ${activeSubTab === 'raw_audit' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSubTab('raw_audit')}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', border: 'none' }}
          >
            <Filter size={13} />
            <span>Raw Page Chunks</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Legal Document RAG System (Default & Primary) */}
      {activeSubTab === 'rag' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Query Input Section */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={15} style={{ color: '#ffffff' }} /> Ask Document Intelligence:
              </span>
              <span className="provenance-tag" style={{ fontSize: '0.72rem' }}>
                <Cpu size={12} /> Groq 120B AI Active
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunRAG()}
                placeholder="Ask any legal question regarding this filing (e.g. What are the constitutional grounds?)..."
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleRunRAG()}
                disabled={loading || !query.trim()}
                style={{ flexShrink: 0, padding: '0.6rem 1.25rem' }}
              >
                {loading ? (
                  <>
                    <Sparkles size={15} className="animate-spin" />
                    <span>Retrieving...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Ask RAG</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Quick Prompts:</span>
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleRunRAG(sq)}
                  disabled={loading}
                  style={{
                    fontSize: '0.74rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* RAG Results Display */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <Sparkles size={32} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Retrieving relevant page spans from {document.filename}...
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Executing Groq LLM inference with strict page citations
              </p>
            </div>
          )}

          {!loading && ragResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Answer Card */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={16} style={{ color: 'var(--status-verified)' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>RAG Legal Synthesis</span>
                    <span className="provenance-tag">{ragResult.provider} • {ragResult.model}</span>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    {copied ? <Check size={13} style={{ color: 'var(--status-verified)' }} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy Answer'}</span>
                  </button>
                </div>

                {/* Answer Content with Citation Badges */}
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {renderFormattedAnswer(ragResult.answer)}
                </div>
              </div>


              {/* Retrieved Sources Section */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--status-verified)' }} /> Retrieved Grounding Passages ({ragResult.sources.length} chunks used)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {ragResult.sources.map((src, idx) => {
                    const isExpanded = expandedSourceIdx === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          onClick={() => setExpandedSourceIdx(isExpanded ? null : idx)}
                          style={{
                            padding: '0.65rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(255,255,255,0.06)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ffffff' }}>
                              Page {src.page_number}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              (Chunk #{src.chunk_index + 1})
                            </span>
                            {src.ocr_applied && (
                              <span className="provenance-tag" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                                OCR Applied
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--status-verified)' }}>
                              Relevance: {(src.relevance_score * 100).toFixed(0)}%
                            </span>
                          </div>

                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '0.75rem 0.9rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                            "{src.text_span}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State / Prompting guide */}
          {!loading && !ragResult && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center' }}>
              <Sparkles size={32} style={{ color: '#ffffff', opacity: 0.5, marginBottom: '0.75rem' }} />
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Ready to Query {document.filename}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                Ask any legal question in the box above or select one of the quick prompts. 
                NyaySahayak will extract the exact page spans and generate a cited response via Groq.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Raw Page Chunks (Secondary Audit View) */}
      {activeSubTab === 'raw_audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Script & OCR Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={14} /> Filter Chunks:
            </span>
            <button
              className={`btn ${selectedFilter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedFilter('all')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            >
              All ({chunks.length})
            </button>
            <button
              className={`btn ${selectedFilter === 'hi' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedFilter('hi')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            >
              Hindi (हिन्दी)
            </button>
            <button
              className={`btn ${selectedFilter === 'ta' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedFilter('ta')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            >
              Tamil (தமிழ்)
            </button>
            <button
              className={`btn ${selectedFilter === 'ocr' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedFilter('ocr')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            >
              OCR Applied
            </button>
          </div>

          {/* Chunks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredChunks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No chunks found matching current filter criteria.
              </div>
            ) : (
              filteredChunks.map((chunk, idx) => (
                <div
                  key={chunk.id || idx}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Page {chunk.page_number}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        (Chunk #{chunk.chunk_index + 1})
                      </span>
                    </div>
                    <span className="provenance-tag">Confidence: {(chunk.extraction_confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {chunk.text_content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
