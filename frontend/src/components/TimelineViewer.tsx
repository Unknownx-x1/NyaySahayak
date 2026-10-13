import React from 'react';
import { Calendar, Clock, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';

export interface TimelineEvent {
  event_id: string;
  date_str: string;
  event_summary: string;
  is_approximate: boolean;
  is_conflicting: boolean;
  conflict_notes?: string;
  document_id: string;
  page_number: number;
  text_span: string;
}

interface TimelineViewerProps {
  events: TimelineEvent[];
  onGenerateTimeline?: () => void;
  loading?: boolean;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ events, onGenerateTimeline, loading = false }) => {
  if (!events || events.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <Calendar size={44} style={{ marginBottom: '1rem', opacity: 0.6, color: '#ffffff' }} />
        <h4 style={{ color: '#ffffff', marginBottom: '0.4rem' }}>No Chronological Events Extracted Yet</h4>
        <p style={{ fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 1.25rem', color: 'var(--text-secondary)' }}>
          Extract an accurate chronological timeline of government orders, tender dates, impugned notices, and petition milestones from the uploaded case filings using Groq LLM.
        </p>
        {onGenerateTimeline && (
          <button className="btn btn-primary" onClick={onGenerateTimeline} disabled={loading} style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem' }}>
            <Sparkles size={16} /> {loading ? 'Extracting Chronology with Groq...' : 'Generate Case Timeline with Groq'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
            <Calendar size={18} style={{ color: '#ffffff' }} /> Dynamic Case Timeline ({events.length} Events)
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Chronological milestone chain extracted and verified against case record
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {onGenerateTimeline && (
            <button 
              className="btn btn-primary" 
              onClick={onGenerateTimeline} 
              disabled={loading}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Sparkles size={13} /> {loading ? 'Extracting...' : 'Re-Compile with Groq'}
            </button>
          )}
          <span className="provenance-tag">Page-Linked Chronology</span>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {events.map((evt) => (
          <div key={evt.event_id} style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
            {/* Timeline Dot */}
            <div
              style={{
                position: 'absolute',
                left: '-2.15rem',
                top: '1.2rem',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: evt.is_conflicting ? 'var(--status-contested)' : '#ffffff',
                boxShadow: `0 0 0 3px ${evt.is_conflicting ? 'var(--status-contested-bg)' : 'rgba(255, 255, 255, 0.18)'}`
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono-text" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                  {evt.date_str}
                </span>
                {evt.is_approximate && (
                  <span className="badge badge-PARTIAL" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    <Clock size={10} /> APPROXIMATE
                  </span>
                )}
                {evt.is_conflicting && (
                  <span className="badge badge-CONTESTED" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    <AlertTriangle size={10} /> CONFLICTING DATE
                  </span>
                )}
              </div>
              <span className="provenance-tag">Page {evt.page_number}</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {evt.event_summary}
            </p>

            {evt.is_conflicting && evt.conflict_notes && (
              <div style={{ fontSize: '0.78rem', color: 'var(--status-contested)', backgroundColor: 'var(--status-contested-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                ⚠️ {evt.conflict_notes}
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
              Provenance: doc={evt.document_id.slice(0, 8)}... | page={evt.page_number} | span="{evt.text_span.slice(0, 50)}..."
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
