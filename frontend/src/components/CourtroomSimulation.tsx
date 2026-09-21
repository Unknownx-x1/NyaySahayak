import React, { useState } from 'react';
import { Swords, Scale, ShieldAlert, Sparkles, Lightbulb, AlertTriangle, Send, RefreshCw, BookOpen, User } from 'lucide-react';

interface AgentMessage {
  role: 'advocate' | 'opposing_counsel' | 'bench_judge' | 'courtroom_coach';
  speaker_name: string;
  message: string;
  objections?: string[] | null;
  timestamp: string;
}

interface SparringResult {
  case_id: string;
  case_title: string;
  opposing_counter_argument: string;
  procedural_objections: string[];
  bench_queries: string[];
  bench_ruling_tendency: string;
  coach_rebuttal_notes: string[];
  coach_evidentiary_gaps: string[];
  transcript: AgentMessage[];
  turn_count: number;
}

interface CourtroomSimulationProps {
  caseId: string;
}

export const CourtroomSimulation: React.FC<CourtroomSimulationProps> = ({ caseId }) => {
  const [userArgument, setUserArgument] = useState<string>(
    'The impugned executive order is ultra vires Article 14 and violates statutory appeal procedures under the enactment without providing any personal hearing.'
  );
  const [activeIssue, setActiveIssue] = useState<string>('Violation of Natural Justice & Statutory Overreach');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SparringResult | null>(null);
  const [transcript, setTranscript] = useState<AgentMessage[]>([]);
  const [battleBrief, setBattleBrief] = useState<any | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);

  const samplePrompts = [
    'Argue that alternative statutory remedy is not an absolute bar when fundamental rights are breached.',
    'Contend that the period of limitation does not apply because of continuous recurring cause of action.',
    'Submit that the lack of reasons in the impugned order renders it arbitrary under Wednesbury standard.'
  ];

  const handleSpar = async (customArg?: string) => {
    const argToUse = customArg || userArgument;
    if (!argToUse.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/simulation/spar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          user_argument: argToUse,
          active_issue: activeIssue,
          existing_transcript: transcript
        })
      });
      const data: SparringResult = await res.json();
      setResult(data);
      setTranscript(data.transcript);
    } catch (err) {
      console.error('Courtroom sparring simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBattleBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch(`/api/simulation/case/${caseId}/brief`);
      const data = await res.json();
      setBattleBrief(data);
    } catch (err) {
      console.error('Failed to load battle brief:', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const resetTranscript = () => {
    setTranscript([]);
    setResult(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Simulation Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              <Swords size={12} /> LangGraph Multi-Agent Courtroom Arena
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Adversarial Courtroom Sparring & Simulation</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Test your arguments against the <strong>Opposing Counsel Agent</strong> (Red Teamer), face queries from <strong>The Hon'ble Bench Agent</strong> (Inquisitor), and receive strategic guidance from the <strong>Courtroom Coach Agent</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn"
              onClick={handleLoadBattleBrief}
              disabled={briefLoading}
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <BookOpen size={14} /> {briefLoading ? 'Analyzing...' : 'Pre-Hearing Battle Brief'}
            </button>
            {transcript.length > 0 && (
              <button
                className="btn btn-ghost"
                onClick={resetTranscript}
                style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} /> Clear Arena
              </button>
            )}
          </div>
        </div>

        {/* Strategic Battle Brief Card */}
        {battleBrief && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Master Case Graph Vulnerability Audit
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Active Issues: {battleBrief.active_legal_issues?.length || 0}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#ef4444' }}>Contested Facts ({battleBrief.vulnerability_audit.disputed_facts_count}):</strong>
                <ul style={{ paddingLeft: '1.1rem', marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                  {battleBrief.vulnerability_audit.disputed_samples?.map((d: string, i: number) => (
                    <li key={i}>{d.slice(0, 90)}...</li>
                  ))}
                </ul>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#f59e0b' }}>Weak / Missing Evidence ({battleBrief.vulnerability_audit.weak_evidence_count}):</strong>
                <ul style={{ paddingLeft: '1.1rem', marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                  {battleBrief.vulnerability_audit.weak_evidence_samples?.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Argument Card */}
      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={16} /> Counsel's Submission & Substantive Proposition
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Active Legal Issue / Focus
            </label>
            <input
              type="text"
              className="form-input"
              value={activeIssue}
              onChange={(e) => setActiveIssue(e.target.value)}
              placeholder="e.g., Maintainability under Article 226, Limitation, Natural Justice"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Your Courtroom Argument
            </label>
            <textarea
              rows={3}
              className="form-textarea"
              value={userArgument}
              onChange={(e) => setUserArgument(e.target.value)}
              placeholder="State the legal proposition or argument you wish to test..."
            />
          </div>

          {/* Quick suggestions */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Test propositions:</span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setUserArgument(prompt);
                  handleSpar(prompt);
                }}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)' }}
              >
                {prompt.slice(0, 45)}...
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleSpar()}
            disabled={loading}
            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}
          >
            {loading ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Agents Debating...' : 'Spar in Courtroom Arena'}
          </button>
        </div>
      </div>

      {/* Multi-Agent Sparring Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Opposing Counsel Card */}
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: '#ef4444' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ef4444' }}>
                  Opposing Counsel Agent (Senior Advocate for Respondent)
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Red Team Counter</span>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              "{result.opposing_counter_argument}"
            </p>

            {result.procedural_objections.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Preliminary Objections Raised:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {result.procedural_objections.map((obj, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Bench Judge Card */}
          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>
                  The Hon'ble Bench Agent (Appellate / High Court Bench)
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Judicial Interrogation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Questions from the Bench:</span>
              {result.bench_queries.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>Q{i+1}:</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>

            {result.bench_ruling_tendency && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b' }}>Tentative Bench Leaning: </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.bench_ruling_tendency}</span>
              </div>
            )}
          </div>

          {/* 3. Courtroom Coach Card */}
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={18} style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981' }}>
                  Courtroom Coach Agent (Senior Strategist)
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actionable Preparation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Strategic Rebuttal Script for Counsel:
              </span>
              {result.coach_rebuttal_notes.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✔</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {result.coach_evidentiary_gaps.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#10b981', marginBottom: '0.25rem' }}>
                  <AlertTriangle size={13} /> Evidentiary Holes to Plug Before Hearing:
                </div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {result.coach_evidentiary_gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
