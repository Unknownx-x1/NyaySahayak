import React, { useState } from 'react';
import { 
  Layers, 
  FileText, 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Calendar, 
  Users,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { TimelineViewer, TimelineEvent } from './TimelineViewer';
import { EvidenceMapView, EvidenceItem } from './EvidenceMapView';

export interface FactItem {
  fact_id: string;
  category: string;
  description: string;
  date_context?: string;
  parties_involved: string[];
  document_id: string;
  page_number: number;
  text_span: string;
  confidence: number;
}

export interface LegalIssue {
  issue_id: string;
  title: string;
  question_text: string;
  governing_statutes: string[];
}

export interface CaseParty {
  name: string;
  role: string;
  counsel?: string;
}

export interface CaseGraph {
  version: string;
  case_id: string;
  case_title: string;
  court_type: string;
  parties: CaseParty[];
  facts: FactItem[];
  timeline: TimelineEvent[];
  evidence_map: EvidenceItem[];
  legal_issues: LegalIssue[];
  summary?: string;
  created_at?: string;
}

interface CaseGraphDashboardProps {
  caseGraph: CaseGraph | null;
  onGenerateGraph: () => void;
  loading: boolean;
  onUpdateCaseGraph?: (graph: CaseGraph) => void;
}

export const renderMarkdownInline = (text: string): React.ReactNode => {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} style={{ height: '0.35rem' }} />;
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+[\.\)]\s+/.test(trimmed);
    const cleanLine = isBullet ? trimmed.replace(/^[-*]\s+|\d+[\.\)]\s+/, '') : trimmed;

    // Split by **...**
    const parts = cleanLine.split(/(\*\*[^*]+?\*\*)/g);

    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={pIdx} style={{ color: '#ffffff', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem', paddingLeft: '0.4rem' }}>
          <span style={{ color: '#818cf8', fontSize: '1rem', lineHeight: '1.2' }}>•</span>
          <div style={{ flex: 1, color: 'var(--text-secondary)' }}>
            {renderedParts}
          </div>
        </div>
      );
    }

    return (
      <div key={lineIdx} style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
        {renderedParts}
      </div>
    );
  });
};

export const CaseGraphDashboard: React.FC<CaseGraphDashboardProps> = ({ caseGraph, onGenerateGraph, loading, onUpdateCaseGraph }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'facts' | 'timeline' | 'evidence' | 'issues'>('overview');
  const [factCategoryFilter, setFactCategoryFilter] = useState<string>('all');
  const [factSearchQuery, setFactSearchQuery] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [localTimeline, setLocalTimeline] = useState<TimelineEvent[]>(caseGraph?.timeline || []);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (caseGraph?.timeline) {
      setLocalTimeline(caseGraph.timeline);
    }
  }, [caseGraph?.timeline]);

  const handleGenerateTimeline = async () => {
    if (!caseGraph?.case_id) return;
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/case-graph/${caseGraph.case_id}/timeline/generate`, {
        method: 'POST'
      });
      if (res.ok) {
        const updatedGraph: CaseGraph = await res.json();
        setLocalTimeline(updatedGraph.timeline);
        if (onUpdateCaseGraph) {
          onUpdateCaseGraph(updatedGraph);
        }
      }
    } catch (err) {
      console.error('Failed to generate timeline with Groq:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleTabClick = (tab: 'overview' | 'facts' | 'timeline' | 'evidence' | 'issues') => {
    setActiveTab(tab);
    if (tab === 'timeline' && localTimeline.length === 0 && !timelineLoading) {
      handleGenerateTimeline();
    }
  };

  if (!caseGraph) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <Layers size={44} style={{ marginBottom: '1rem', opacity: 0.5, color: '#ffffff' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Master Case Graph Not Generated</h3>
        <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
          NyaySahayak extracts structured Facts, Chronological Timeline, Evidence Maps, and Grounded Legal Issues into an authoritative Case Graph context.
        </p>
        <button className="btn btn-primary" onClick={onGenerateGraph} disabled={loading}>
          <Sparkles size={16} /> {loading ? 'Compiling Master Case Graph...' : 'Generate Master Case Graph'}
        </button>
      </div>
    );
  }

  // Filter Facts
  const filteredFacts = caseGraph.facts.filter((fact) => {
    const matchesCategory = factCategoryFilter === 'all' || fact.category.toLowerCase() === factCategoryFilter.toLowerCase();
    const matchesSearch = !factSearchQuery || 
      fact.description.toLowerCase().includes(factSearchQuery.toLowerCase()) ||
      fact.parties_involved.some(p => p.toLowerCase().includes(factSearchQuery.toLowerCase())) ||
      (fact.date_context && fact.date_context.toLowerCase().includes(factSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = caseGraph.facts.reduce<Record<string, number>>((acc, f) => {
    const cat = f.category.toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const handleCopySummary = () => {
    if (caseGraph.summary) {
      navigator.clipboard.writeText(caseGraph.summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const renderFormattedSummary = (summaryText?: string) => {
    if (!summaryText) {
      return <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No summary compiled yet.</p>;
    }

    // Split into sections by markdown heading (### )
    const rawSections = summaryText.split(/(?=###\s+)/g);

    if (rawSections.length <= 1) {
      return (
        <div style={{ fontSize: '0.86rem', lineHeight: '1.6' }}>
          {renderMarkdownInline(summaryText)}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {rawSections.map((sec, idx) => {
          const trimmed = sec.trim();
          if (!trimmed) return null;
          const lines = trimmed.split('\n');
          const heading = lines[0].replace(/^###\s+/, '').trim();
          const body = lines.slice(1).join('\n').trim();

          return (
            <div 
              key={idx} 
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm, 6px)', 
                padding: '0.9rem 1.1rem' 
              }}
            >
              <h5 style={{ 
                color: '#ffffff', 
                fontSize: '0.88rem', 
                fontWeight: 600, 
                marginBottom: '0.45rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem' 
              }}>
                <Scale size={15} style={{ color: '#818cf8' }} /> {heading}
              </h5>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                {renderMarkdownInline(body)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getFactBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'disputed':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          icon: <AlertTriangle size={12} />
        };
      case 'contradiction':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
          icon: <ShieldAlert size={12} />
        };
      case 'substantive':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34d399',
          icon: <CheckCircle2 size={12} />
        };
      case 'procedural':
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#60a5fa',
          icon: <FileText size={12} />
        };
      default:
        return {
          bg: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          icon: <BookOpen size={12} />
        };
    }
  };

  return (
    <div className="card document-viewer">
      {/* Case Graph Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
            <Layers size={18} style={{ color: '#ffffff' }} /> {caseGraph.case_title}
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Forum: <strong>{caseGraph.court_type}</strong> • Master Graph Version {caseGraph.version} • Compiled: {caseGraph.created_at ? new Date(caseGraph.created_at).toLocaleTimeString() : 'Just now'}
          </span>
        </div>
        <button className="btn btn-primary" onClick={onGenerateGraph} disabled={loading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
          <Sparkles size={14} /> Re-Compile Graph
        </button>
      </div>

      {/* Case Graph Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => handleTabClick('overview')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          Overview
        </button>
        <button className={`btn ${activeTab === 'facts' ? 'btn-primary' : ''}`} onClick={() => handleTabClick('facts')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          Facts ({caseGraph.facts.length})
        </button>
        <button className={`btn ${activeTab === 'timeline' ? 'btn-primary' : ''}`} onClick={() => handleTabClick('timeline')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          Timeline ({localTimeline.length}) {timelineLoading && '⚡'}
        </button>
        <button className={`btn ${activeTab === 'evidence' ? 'btn-primary' : ''}`} onClick={() => handleTabClick('evidence')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          Evidence & Exhibits ({caseGraph.evidence_map.length})
        </button>
        <button className={`btn ${activeTab === 'issues' ? 'btn-primary' : ''}`} onClick={() => handleTabClick('issues')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          Legal Issues ({caseGraph.legal_issues.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '0.75rem', maxHeight: '580px', overflowY: 'auto' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Top KPI Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{caseGraph.facts.length}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Verified Facts</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>{localTimeline.length}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Timeline Milestones</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>{caseGraph.evidence_map.length}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Exhibits Mapped</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{caseGraph.legal_issues.length}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Adjudication Issues</div>
              </div>
            </div>

            {/* Executive Legal Summary of the Filing */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: '#818cf8' }} /> Executive Legal Summary of Court Paper
                </h4>
                <button 
                  onClick={handleCopySummary}
                  className="btn" 
                  style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedSummary ? <Check size={13} style={{ color: '#34d399' }} /> : <Copy size={13} />}
                  {copiedSummary ? 'Copied' : 'Copy Summary'}
                </button>
              </div>

              {renderFormattedSummary(caseGraph.summary)}
            </div>

            {/* Identified Parties */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Users size={16} style={{ color: '#818cf8' }} /> Litigants & Legal Representation
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {caseGraph.parties.map((p, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: '#ffffff' }}>{p.name}</strong>
                      <span className="provenance-tag" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {p.role}
                      </span>
                    </div>
                    {p.counsel && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Counsel: {p.counsel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACTS TAB */}
        {activeTab === 'facts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filter and Search Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Filter size={13} /> Filter:
                </span>
                {['all', 'substantive', 'procedural', 'disputed', 'contradiction', 'background'].map((cat) => {
                  const count = cat === 'all' ? caseGraph.facts.length : (categoryCounts[cat] || 0);
                  const isSelected = factCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFactCategoryFilter(cat)}
                      className={`btn ${isSelected ? 'btn-primary' : ''}`}
                      style={{ 
                        fontSize: '0.72rem', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '12px',
                        textTransform: 'capitalize' 
                      }}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Keyword Search Input */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search facts by keyword, party name, or date..."
                  value={factSearchQuery}
                  onChange={(e) => setFactSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.75rem 0.4rem 2rem',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Facts List */}
            {filteredFacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No facts match the selected filter or search criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredFacts.map((fact) => {
                  const badgeStyle = getFactBadgeStyle(fact.category);
                  const isDisputed = fact.category.toLowerCase() === 'disputed';
                  const isContradiction = fact.category.toLowerCase() === 'contradiction';

                  return (
                    <div 
                      key={fact.fact_id} 
                      style={{ 
                        backgroundColor: isDisputed 
                          ? 'rgba(245, 158, 11, 0.05)' 
                          : isContradiction 
                          ? 'rgba(239, 68, 68, 0.05)' 
                          : 'var(--bg-secondary)', 
                        border: isDisputed 
                          ? '1px solid rgba(245, 158, 11, 0.3)' 
                          : isContradiction 
                          ? '1px solid rgba(239, 68, 68, 0.3)' 
                          : '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '0.9rem 1.1rem' 
                      }}
                    >
                      {/* Fact Metadata Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              backgroundColor: badgeStyle.bg,
                              border: badgeStyle.border,
                              color: badgeStyle.color,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}
                          >
                            {badgeStyle.icon}
                            {fact.category}
                          </span>

                          {fact.date_context && (
                            <span className="provenance-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={11} /> {fact.date_context}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="provenance-tag">Page {fact.page_number}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {Math.round(fact.confidence * 100)}% Conf
                          </span>
                        </div>
                      </div>

                      {/* Fact Description */}
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: '0 0 0.5rem 0' }}>
                        {fact.description}
                      </p>

                      {/* Parties Tag Row */}
                      {fact.parties_involved && fact.parties_involved.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Parties:</span>
                          {fact.parties_involved.map((party, pIdx) => (
                            <span 
                              key={pIdx} 
                              style={{ 
                                fontSize: '0.7rem', 
                                backgroundColor: 'var(--bg-tertiary)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '3px', 
                                padding: '0.1rem 0.35rem', 
                                color: 'var(--text-secondary)' 
                              }}
                            >
                              {party}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <TimelineViewer 
            events={localTimeline} 
            onGenerateTimeline={handleGenerateTimeline} 
            loading={timelineLoading} 
          />
        )}

        {/* EVIDENCE & EXHIBITS TAB */}
        {activeTab === 'evidence' && <EvidenceMapView evidenceMap={caseGraph.evidence_map} />}

        {/* LEGAL ISSUES TAB */}
        {activeTab === 'issues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Core constitutional questions and substantive propositions framed for adjudication:
            </div>
            {caseGraph.legal_issues.map((issue) => (
              <div key={issue.issue_id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.15rem' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={16} style={{ color: '#818cf8' }} /> {issue.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.65rem', lineHeight: '1.5' }}>
                  {issue.question_text}
                </p>
                {issue.governing_statutes && issue.governing_statutes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Governing Law:</span>
                    {issue.governing_statutes.map((stat, sIdx) => (
                      <span key={sIdx} className="provenance-tag" style={{ fontSize: '0.7rem' }}>
                        {stat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
