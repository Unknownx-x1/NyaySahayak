import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { ThreeCourtFileHero } from '../three/ThreeCourtFileHero';

interface RevampedHeroLandingProps {
  onNavigate: (view: 'home' | 'graph' | 'documents' | 'simulation' | 'verify') => void;
  activeNav?: string;
}

export const RevampedHeroLanding: React.FC<RevampedHeroLandingProps> = ({ onNavigate, activeNav = 'home' }) => {
  return (
    <div className="hero-viewport-container">
      {/* 1) Architectural Background Lighting & Concrete Pillar Shadows */}
      <div className="hero-architectural-bg">
        <div className="hero-concrete-pillar hero-concrete-pillar-1" />
        <div className="hero-concrete-pillar hero-concrete-pillar-2" />
      </div>

      {/* 2) Top Fixed Header (72px) */}
      <header className="hero-top-header">
        {/* Logo */}
        <div onClick={() => onNavigate('home')} className="hero-logo-box">
          <span className="hero-logo-text">NyaySahayak</span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono-nyay)', padding: '2px 6px', borderRadius: '4px', background: '#1c202d', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            v2.0
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hero-nav-pill-group">
          <button onClick={() => onNavigate('graph')} className="hero-nav-link">
            Case Graph
          </button>
          <button onClick={() => onNavigate('documents')} className="hero-nav-link">
            Documents
          </button>
          <button onClick={() => onNavigate('simulation')} className="hero-nav-link">
            Courtroom Simulation
          </button>
          <button onClick={() => onNavigate('verify')} className="hero-nav-link">
            6-Check Verification
          </button>
        </nav>

        {/* Right CTA Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => onNavigate('graph')} className="hero-nav-link" style={{ fontSize: '13px' }}>
            Sign In
          </button>
          <button onClick={() => onNavigate('graph')} className="hero-cta-btn">
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 3) Main 3-Column Hero Grid (140px Stepper | 480px Text | 1fr 3D Court File) */}
      <main className="hero-main-grid">
        {/* Column 1: Left Vertical Stepper */}
        <div className="hero-stepper-col">
          {[
            { id: 'home', label: '01 Home' },
            { id: 'graph', label: '02 Case Graph' },
            { id: 'documents', label: '03 Research' },
            { id: 'simulation', label: '04 Simulation' },
            { id: 'verify', label: '05 Verify' }
          ].map((step) => {
            const isActive = activeNav === step.id;
            return (
              <button
                key={step.id}
                onClick={() => onNavigate(step.id as any)}
                className={`hero-step-item ${isActive ? 'active' : ''}`}
              >
                {isActive && <span className="hero-step-bar" />}
                <span>{step.label}</span>
              </button>
            );
          })}

          <div className="hero-scroll-indicator">
            <span>SCROLL</span>
            <div className="hero-scroll-line" />
          </div>
        </div>

        {/* Column 2: Editorial Typography & CTAs */}
        <div className="hero-text-col">
          {/* Eyebrow Pill */}
          <div className="hero-eyebrow-pill">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>AI FOR INDIAN LAWYERS</span>
          </div>

          {/* Stately Serif Headline */}
          <h1 className="hero-title-headline">
            Turn <br />
            Case Files <br />
            Into Clarity.
          </h1>

          {/* Subtitle Description */}
          <p className="hero-subtitle-desc">
            Understand, analyse and prepare your cases with verifiable sources — built specifically for the Indian legal system.
          </p>

          {/* Buttons Row */}
          <div className="hero-buttons-row">
            <button onClick={() => onNavigate('graph')} className="hero-btn-crimson">
              <span>Explore the Platform</span>
              <ArrowRight size={16} />
            </button>

            <button onClick={() => onNavigate('simulation')} className="hero-btn-outline">
              <Play size={13} style={{ fill: '#ef4444', color: '#ef4444' }} />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Column 3: 3D Court File Canvas */}
        <div className="hero-three-col">
          <ThreeCourtFileHero
            onSelectFeature={(feature) => {
              if (feature === 'timeline' || feature === 'evidence') onNavigate('graph');
              else if (feature === 'petitions') onNavigate('documents');
              else if (feature === 'judgments') onNavigate('verify');
            }}
          />
        </div>
      </main>

      {/* 4) Bottom 4-Column Feature Ticker Bar (80px) */}
      <footer className="hero-bottom-ticker">
        <div onClick={() => onNavigate('graph')} className="hero-ticker-item">
          <div className="hero-ticker-title">DOCUMENT INTELLIGENCE</div>
          <div className="hero-ticker-desc">Extract facts, evidence and timelines with page provenance.</div>
        </div>

        <div onClick={() => onNavigate('verify')} className="hero-ticker-item">
          <div className="hero-ticker-title">VERIFIED LEGAL RESEARCH</div>
          <div className="hero-ticker-desc">Find and audit real judgments across whitelisted corpora.</div>
        </div>

        <div onClick={() => onNavigate('simulation')} className="hero-ticker-item">
          <div className="hero-ticker-title">CASE SIMULATION</div>
          <div className="hero-ticker-desc">Practice arguments with opposing counsel & bench AI agents.</div>
        </div>

        <div onClick={() => onNavigate('documents')} className="hero-ticker-item">
          <div className="hero-ticker-title">BUILT FOR INDIAN LAW</div>
          <div className="hero-ticker-desc">Native Hindi & Tamil normalization for real court workflows.</div>
        </div>
      </footer>
    </div>
  );
};
