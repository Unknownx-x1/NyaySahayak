import React, { useState } from 'react';
import {
  Home,
  Layers,
  FileText,
  ShieldCheck,
  Scale,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { RevampedHeroLanding } from './components/revamped/RevampedHeroLanding';
import { RevampedCaseGraphPage } from './components/revamped/RevampedCaseGraphPage';
import { RevampedDocumentViewerPage } from './components/revamped/RevampedDocumentViewerPage';
import { RevampedCourtroomSimulationPage } from './components/revamped/RevampedCourtroomSimulationPage';
import { RevampedVerificationPage } from './components/revamped/RevampedVerificationPage';

export type AppView = 'home' | 'graph' | 'documents' | 'simulation' | 'verify';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  // If in 'home' mode, render the full-screen editorial landing experience with Three.js Court File Hero
  if (currentView === 'home') {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        <RevampedHeroLanding
          activeNav="home"
          onNavigate={(view) => setCurrentView(view)}
        />

        {/* Floating Quick View Switcher Bar (Always accessible for easy previewing of all 4 designs) */}
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '32px',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: 'rgba(18, 20, 28, 0.95)',
            border: '1px solid #2a3044',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}
        >
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono-nyay)', color: '#94a3b8', marginRight: '4px' }}>
            SUITE PREVIEWS:
          </span>
          <button
            onClick={() => setCurrentView('graph')}
            className="app-view-pill-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={13} style={{ color: '#ef4444' }} />
            <span>02 Case Graph</span>
          </button>
          <button
            onClick={() => setCurrentView('documents')}
            className="app-view-pill-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={13} style={{ color: '#ef4444' }} />
            <span>03 Document Viewer</span>
          </button>
          <button
            onClick={() => setCurrentView('simulation')}
            className="app-view-pill-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Scale size={13} style={{ color: '#ef4444' }} />
            <span>04 Courtroom Arena</span>
          </button>
          <button
            onClick={() => setCurrentView('verify')}
            className="app-view-pill-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldCheck size={13} style={{ color: '#ef4444' }} />
            <span>05 Verification</span>
          </button>
        </div>
      </div>
    );
  }

  // Workspace Mode (Case Graph, Documents, Simulation, Verify)
  return (
    <div className="app-workspace-layout select-none">
      {/* 1) LEFT VERTICAL ICON SIDEBAR matching the design */}
      <aside className="app-sidebar-rail">
        {/* Top Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setCurrentView('home')}
            className="app-sidebar-logo"
            title="NyaySahayak Home"
          >
            N
          </button>

          {/* Navigation Icons */}
          <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setCurrentView('home')}
              className="app-sidebar-btn"
              title="01 Home (Landing)"
            >
              <Home size={18} />
            </button>

            <button
              onClick={() => setCurrentView('graph')}
              className={`app-sidebar-btn ${currentView === 'graph' ? 'active' : ''}`}
              title="02 Case Graph (3D/2D)"
            >
              <Layers size={18} />
            </button>

            <button
              onClick={() => setCurrentView('documents')}
              className={`app-sidebar-btn ${currentView === 'documents' ? 'active' : ''}`}
              title="03 Document Viewer"
            >
              <FileText size={18} />
            </button>

            <button
              onClick={() => setCurrentView('simulation')}
              className={`app-sidebar-btn ${currentView === 'simulation' ? 'active' : ''}`}
              title="04 Courtroom Simulation Arena"
            >
              <Scale size={18} />
            </button>

            <button
              onClick={() => setCurrentView('verify')}
              className={`app-sidebar-btn ${currentView === 'verify' ? 'active' : ''}`}
              title="05 6-Check Citation Verification"
            >
              <ShieldCheck size={18} />
            </button>
          </nav>
        </div>

        {/* Bottom User Avatar */}
        <div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#c52828',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(197, 40, 40, 0.4)'
            }}
            title="Advocate Profile"
          >
            A
          </div>
        </div>
      </aside>

      {/* 2) MAIN CONTENT CANVAS */}
      <div className="app-main-canvas">
        {/* Global App Topbar */}
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setCurrentView('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Hero</span>
            </button>

            <span style={{ color: '#2a3044' }}>|</span>

            <span style={{ fontFamily: 'var(--font-serif-nyay)', fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
              NyaySahayak
            </span>
          </div>

          {/* Center Mode Switcher Tabs */}
          <div className="app-view-pill-group">
            <button
              onClick={() => setCurrentView('graph')}
              className={`app-view-pill-btn ${currentView === 'graph' ? 'active' : ''}`}
            >
              Case Graph (3D)
            </button>
            <button
              onClick={() => setCurrentView('documents')}
              className={`app-view-pill-btn ${currentView === 'documents' ? 'active' : ''}`}
            >
              Document Viewer
            </button>
            <button
              onClick={() => setCurrentView('simulation')}
              className={`app-view-pill-btn ${currentView === 'simulation' ? 'active' : ''}`}
            >
              Courtroom Arena
            </button>
            <button
              onClick={() => setCurrentView('verify')}
              className={`app-view-pill-btn ${currentView === 'verify' ? 'active' : ''}`}
            >
              6-Check Verify
            </button>
          </div>

          {/* Right Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono-nyay)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Live System Active
            </span>
          </div>
        </header>

        {/* View Router */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {currentView === 'graph' && (
            <RevampedCaseGraphPage
              onNavigate={(v) => setCurrentView(v)}
              onOpenDocument={() => setCurrentView('documents')}
            />
          )}

          {currentView === 'documents' && (
            <RevampedDocumentViewerPage onNavigate={(v) => setCurrentView(v)} />
          )}

          {currentView === 'simulation' && (
            <RevampedCourtroomSimulationPage onNavigate={(v) => setCurrentView(v)} />
          )}

          {currentView === 'verify' && (
            <RevampedVerificationPage onNavigate={(v) => setCurrentView(v)} />
          )}
        </main>
      </div>
    </div>
  );
}
