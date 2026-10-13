import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Moon, Sun, ArrowRight } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme, onOpenChat }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg)]/90 border-b border-[var(--color-border)]"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[#0B0F14] shadow-md"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B0F14'
            }}
          >
            <Scale className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[var(--color-text)]" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Nyaysahayak
            </span>
            <span
              className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(46, 111, 94, 0.25)',
                color: 'var(--color-primary-light)',
                border: '1px solid rgba(46, 111, 94, 0.4)',
                marginLeft: '0.5rem'
              }}
            >
              AI Legal Platform
            </span>
          </div>
        </a>

        {/* Navigation Links with Explicit Spacing */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-muted)]"
          style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}
        >
          <a href="#how-it-works" className="hover:text-[var(--color-primary-light)] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[var(--color-primary-light)] transition-colors">Features</a>
          <a href="#ai-demo" className="hover:text-[var(--color-primary-light)] transition-colors">AI Demo</a>
          <a href="#languages" className="hover:text-[var(--color-primary-light)] transition-colors">Languages</a>
          <a href="#lawyers" className="hover:text-[var(--color-primary-light)] transition-colors">Verified Lawyers</a>
          <a href="#faq" className="hover:text-[var(--color-primary-light)] transition-colors">FAQ</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-all"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--color-primary)]" /> : <Moon className="w-4 h-4 text-[var(--color-accent)]" />}
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenChat}
            className="btn-pill btn-primary-gold px-5 py-2.5 text-xs sm:text-sm font-semibold tracking-wide"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </motion.header>
  );
};
