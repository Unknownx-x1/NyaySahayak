import React, { useEffect, useState } from 'react';
import {
  Database,
  ShieldCheck,
  ExternalLink,
  Terminal,
  Play,
  Clock,
  Layers,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface CorpusSource {
  id: string;
  name: string;
  authority_type: string;
  jurisdiction: string;
  court_name?: string;
  start_year: number;
  official_url: string;
  update_cadence: string;
  is_whitelisted: boolean;
}

interface CorpusStats {
  total_records: number;
  breakdown: Record<string, number>;
  fts_enabled: boolean;
  db_location: string;
}

interface SqlQueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  execution_time_ms: number;
  query: string;
  error?: string | null;
}

const PRESET_QUERIES = [
  {
    label: '📊 Count Total Rows',
    query: `SELECT COUNT(*) AS total_dataset_rows,\n       COUNT(DISTINCT case_title) AS total_authorities,\n       COUNT(DISTINCT court) AS distinct_courts\nFROM corpus_chunks;`,
  },
  {
    label: 'Rows by Category',
    query: `SELECT corpus_type, COUNT(*) AS row_count, COUNT(DISTINCT case_title) AS distinct_titles\nFROM corpus_chunks\nGROUP BY corpus_type;`,
  },
  {
    label: 'Top Landmarks',
    query: `SELECT case_title, citation_string, year, paragraph_number, text_span\nFROM corpus_chunks\nWHERE corpus_type = 'supreme_court_judgment'\nLIMIT 10;`,
  },
  {
    label: 'Search "Natural Justice"',
    query: `SELECT chunk_id, case_title, citation_string, text_span\nFROM corpus_chunks\nWHERE text_span LIKE '%natural justice%'\nLIMIT 10;`,
  },
  {
    label: 'Central Bare Acts',
    query: `SELECT document_id, case_title, citation_string, text_span\nFROM corpus_chunks\nWHERE corpus_type = 'bare_act';`,
  },
  {
    label: 'FTS5 MATCH (Hearing/Writ)',
    query: `SELECT chunk_id, case_title, citation_string, text_span\nFROM corpus_fts\nWHERE corpus_fts MATCH 'hearing OR prerogative'\nLIMIT 10;`,
  },
  {
    label: 'Group by Court',
    query: `SELECT court, COUNT(*) as chunk_count\nFROM corpus_chunks\nGROUP BY court;`,
  },
];

export const CorpusWhitelistView: React.FC = () => {
  const [sources, setSources] = useState<CorpusSource[]>([]);
  const [stats, setStats] = useState<CorpusStats | null>(null);

  // SQL Search State
  const [sqlQuery, setSqlQuery] = useState<string>(PRESET_QUERIES[0].query);
  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    // Load Whitelist Sources
    fetch('/api/verification/corpus/whitelist')
      .then((res) => res.json())
      .then((data) => setSources(data))
      .catch((err) => console.error('Failed to load whitelist:', err));

    // Load Corpus Stats
    fetch('/api/verification/corpus/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load corpus stats:', err));

    // Execute default query on mount
    handleExecuteSql(PRESET_QUERIES[0].query);
  }, []);

  const handleExecuteSql = async (queryToRun?: string) => {
    const q = queryToRun !== undefined ? queryToRun : sqlQuery;
    if (!q.trim()) return;

    setExecuting(true);
    try {
      const res = await fetch('/api/verification/corpus/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, max_rows: 50 }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({
        success: false,
        columns: [],
        rows: [],
        row_count: 0,
        execution_time_ms: 0,
        query: q,
        error: err.message || 'Network request failed',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
      {/* 1. Header & Live Corpus Metrics */}
      <div className="card" style={{ background: 'linear-gradient(180deg, #18181b 0%, #111113 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Database size={22} style={{ color: '#ffffff' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Authoritative Indian Legal Corpus & SQL Explorer</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
              Directly query canonical Supreme Court precedents (Whirlpool, Kesavananda, Maneka Gandhi), ILDC dataset, and Central Bare Acts indexed with SQLite FTS5.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={13} style={{ color: 'var(--status-verified)' }} />
              {stats ? `${stats.total_records} Verified Chunks` : 'Loading...'}
            </span>
            <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Terminal size={13} style={{ color: '#ffffff' }} />
              FTS5 Full-Text Indexed
            </span>
          </div>
        </div>

        {/* 2. SQL Search Interactive Console */}
        <div style={{ background: '#0a0a0c', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>SQL Query Editor (Read-Only)</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSqlQuery(preset.query);
                    handleExecuteSql(preset.query);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              backgroundColor: '#000000',
              color: '#4ade80',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              padding: '0.75rem 0.85rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.4,
            }}
            placeholder="SELECT case_title, citation_string, year, text_span FROM corpus_chunks LIMIT 10;"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports SQLite <code style={{ color: 'var(--text-secondary)' }}>corpus_chunks</code> and FTS5 virtual table <code style={{ color: 'var(--text-secondary)' }}>corpus_fts</code>.
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setSqlQuery('SELECT * FROM corpus_chunks LIMIT 10;')}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExecuteSql()}
                disabled={executing}
                style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}
              >
                <Play size={14} style={{ fill: '#000000' }} />
                <span>{executing ? 'Executing SQL...' : 'Run SQL Search'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Query Results Display */}
        {queryResult && (
          <div style={{ marginTop: '1.25rem' }}>
            {/* Meta Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                backgroundColor: queryResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${queryResult.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.75rem',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {queryResult.success ? (
                  <ShieldCheck size={16} style={{ color: 'var(--status-verified)' }} />
                ) : (
                  <AlertCircle size={16} style={{ color: 'var(--status-contested)' }} />
                )}
                <span>
                  {queryResult.success
                    ? `Query executed successfully — ${queryResult.row_count} row${queryResult.row_count === 1 ? '' : 's'} returned`
                    : `Query Error: ${queryResult.error}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                <Clock size={13} />
                <span>{queryResult.execution_time_ms} ms</span>
              </div>
            </div>

            {/* Results Table */}
            {queryResult.success && queryResult.rows.length > 0 ? (
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#0c0c0e',
                  maxHeight: '480px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600, width: '40px' }}>#</th>
                      {queryResult.columns.map((col) => (
                        <th key={col} style={{ padding: '0.65rem 0.75rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                      <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600, width: '70px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        }}
                      >
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rIdx + 1}</td>
                        {queryResult.columns.map((col) => {
                          const val = row[col];
                          const isTextSpan = col === 'text_span' || col === 'ratio_decidendi';
                          const isExpanded = expandedRow === rIdx;

                          return (
                            <td
                              key={col}
                              style={{
                                padding: '0.65rem 0.75rem',
                                color: isTextSpan ? 'var(--text-secondary)' : 'var(--text-primary)',
                                maxWidth: isTextSpan ? '420px' : '220px',
                                verticalAlign: 'top',
                              }}
                            >
                              {isTextSpan && typeof val === 'string' ? (
                                <div>
                                  <div style={{ whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {val}
                                  </div>
                                  {val.length > 90 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRow(isExpanded ? null : rIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontSize: '0.72rem',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        padding: 0,
                                        marginTop: '0.2rem',
                                      }}
                                    >
                                      {isExpanded ? 'Show less' : 'Expand full passage'}
                                    </button>
                                  )}
                                </div>
                              ) : col === 'checksum_sha256' && typeof val === 'string' ? (
                                <code style={{ fontSize: '0.72rem', color: 'var(--status-verified)' }}>{val.substring(0, 16)}...</code>
                              ) : (
                                <span>{val !== null && val !== undefined ? String(val) : '—'}</span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', verticalAlign: 'top' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyText(JSON.stringify(row, null, 2), rIdx)}
                            title="Copy row JSON"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedIndex === rIdx ? 'var(--status-verified)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                            }}
                          >
                            {copiedIndex === rIdx ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : queryResult.success ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: '#0a0a0c', borderRadius: 'var(--radius-sm)' }}>
                No records matched the query. Try broadening your SELECT parameters.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Whitelisted Legal Authority Sources Grid */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <BookOpen size={18} style={{ color: '#ffffff' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Authoritative Whitelisted Repositories</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1rem' }}>
          NyaySahayak enforces legal grounding exclusively against verified Indian state repositories and national statutes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0.85rem' }}>
          {sources.map((source) => (
            <div
              key={source.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.95rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{source.name}</strong>
                  <ShieldCheck size={16} style={{ color: 'var(--status-verified)' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span>Jurisdiction: {source.jurisdiction} ({source.start_year}–Present)</span>
                  <span>Cadence: {source.update_cadence}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>ID: <code>{source.id}</code></span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <a
                  href={source.official_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  Official Repository <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
