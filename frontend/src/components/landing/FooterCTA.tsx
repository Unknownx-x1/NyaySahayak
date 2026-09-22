import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface FooterCTAProps {
  onOpenChat: () => void;
}

export const FooterCTA: React.FC<FooterCTAProps> = ({ onOpenChat }) => {
  return (
    <footer className="bg-[var(--color-bg-alt)] border-t border-[var(--color-border)] pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Gold Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--color-primary-glow)] rounded-full filter blur-3xl pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Banner Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-10 sm:p-16 text-center rounded-3xl border border-[var(--color-primary)]/30 relative overflow-hidden shadow-2xl mb-20"
        >
          <span className="text-xs font-semibold tracking-widest text-[var(--color-primary-light)] uppercase block mb-3">
            Zero Cost • Instant Guidance • Confidential
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight max-w-2xl mx-auto leading-tight">
            Justice Belongs to Everyone. Start Free Today.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-text-muted)] max-w-xl mx-auto">
            Ask your legal question in your native language and get grounded answers citing Supreme Court rulings & Acts.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={onOpenChat}
              className="btn-pill btn-primary-gold px-10 py-4 text-base font-bold shadow-2xl"
            >
              <span>Launch Legal Workspace</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        </motion.div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--color-border)] text-sm">
          
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-slate-950 font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-serif text-xl font-bold text-[var(--color-text)]">Nyaysahayak</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Verified Multi-Agent AI Platform for Courtroom Preparation and Citizen Legal Access across India.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold text-[var(--color-text)] mb-4">Platform Features</h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-text-muted)]">
              <li><a href="#ai-demo" className="hover:text-[var(--color-primary-light)] transition-colors">24/7 AI Legal Assistant</a></li>
              <li><a href="#features" className="hover:text-[var(--color-primary-light)] transition-colors">Automated Document Drafting</a></li>
              <li><a href="#languages" className="hover:text-[var(--color-primary-light)] transition-colors">Multilingual Ingestion</a></li>
              <li><a href="#features" className="hover:text-[var(--color-primary-light)] transition-colors">Know Your Rights Library</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold text-[var(--color-text)] mb-4">Legal Authority Sources</h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-text-muted)]">
              <li>Supreme Court of India Judgments</li>
              <li>High Courts of Delhi, Bombay, Madras</li>
              <li>Central Bare Acts & Statutes (India Code)</li>
              <li>e-Gazette Notifications</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold text-[var(--color-text)] mb-4">Trust & Privacy</h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-text-muted)]">
              <li>6-Check Citation Verification</li>
              <li>AES-256 Encryption</li>
              <li>Zero Data Selling Policy</li>
              <li>Bar Council Accredited Network</li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-4">
          <p>© {new Date().getFullYear()} Nyaysahayak Platform. Built for Justice in India.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Bar Council Compliance</a>
          </div>
        </div>

      </div>

    </footer>
  );
};
