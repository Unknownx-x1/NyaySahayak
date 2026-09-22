import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Sparkles, ChevronDown, CheckCircle2, Scale, MessageSquare, Award } from 'lucide-react';

interface HeroSectionProps {
  onOpenChat: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenChat }) => {
  const headlineWords = ["Justice,", "Explained.", "In", "Your", "Language."];

  // Parallax fade on scroll
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0.2]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.95]);
  const yOffset = useTransform(scrollY, [0, 400], [0, 50]);

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      
      {/* Animated Gradient Mesh Background */}
      <div className="gradient-mesh">
        <div className="mesh-blob-1" />
        <div className="mesh-blob-2" />
      </div>

      <motion.div
        style={{ opacity, scale, y: yOffset }}
        className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto z-10"
      >
        
        {/* Left Column Text Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* Top Pill Tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 text-[var(--color-primary-light)] text-xs font-semibold tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" />
            <span>AI-Powered Legal Assistance for India</span>
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          </motion.div>

          {/* Word-by-Word Staggered Animated Serif Headline (With Explicit Word Spacing) */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text)] leading-[1.15] pt-2">
            {headlineWords.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className={`word-span ${word === "Explained." || word === "Language." ? "text-[var(--color-primary-light)] italic" : ""}`}
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </h1>

          {/* Subheadline (Fades in 0.3s after headline) */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-xl text-[var(--color-text-muted)] max-w-2xl font-normal leading-relaxed pt-1"
          >
            Understand your legal rights, draft error-free legal notices & RTIs in plain language, and connect with Bar-verified advocates across India.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
          >
            <button
              onClick={onOpenChat}
              className="btn-pill btn-primary-gold px-8 py-4 text-base font-semibold shadow-xl"
            >
              <span>Launch Legal Workspace</span>
              <Sparkles className="w-5 h-5 text-slate-950" />
            </button>

            <a
              href="#how-it-works"
              className="btn-pill btn-ghost px-7 py-4 text-base font-medium"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Horizontal Badges / Checkmarks Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-6 border-t border-[var(--color-border)] flex flex-row items-center gap-6 flex-wrap text-xs sm:text-sm text-[var(--color-text-muted)]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Confidential by Design</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Hindi, Tamil & Regional Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Grounded Citations</span>
            </div>
          </motion.div>

        </div>

        {/* Right Column Floating SVG Scale & Document Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-5 relative flex justify-center items-center"
        >
          {/* Animated Graphic Glass Box */}
          <div className="relative w-full max-w-md p-6 glass-card animate-float">
            
            {/* Scales of Justice Graphic Box */}
            <div className="relative w-full h-80 rounded-xl bg-gradient-to-b from-[var(--color-bg-alt)] to-[var(--color-bg)] border border-[var(--color-border)] p-6 flex flex-col justify-between overflow-hidden shadow-inner">
              
              {/* Background Glow Ring */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--color-primary-glow)] filter blur-3xl pointer-events-none" />

              {/* Top Header Card */}
              <div className="flex items-center justify-between z-10 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center text-[var(--color-primary-light)]">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--color-text)] block">Constitution & Penal Code</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Verified Judicial Knowledge</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  ACTIVE
                </span>
              </div>

              {/* Scales of Justice SVG Graphic */}
              <div className="my-auto flex justify-center items-center relative z-10 py-6">
                <svg className="w-36 h-36 text-[var(--color-primary-light)] filter drop-shadow-[0_0_20px_rgba(201,162,39,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v17" />
                  <path d="M5 7h14" />
                  <path d="M5 7l-3 7c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5L5 7z" fill="rgba(201,162,39,0.15)" />
                  <path d="M19 7l-3 7c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5L19 7z" fill="rgba(201,162,39,0.15)" />
                  <path d="M9 20h6" />
                  <circle cx="12" cy="3" r="1.5" fill="currentColor" />
                </svg>
              </div>

              {/* Bottom Interactive Prompt Mockup */}
              <div className="z-10 bg-[#0B0F14]/95 backdrop-blur border border-[var(--color-border)] rounded-lg p-3 flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-[var(--color-primary-light)] flex-shrink-0" />
                <span className="text-xs text-[var(--color-text-muted)] truncate">
                  "What are my rights if a landlord refuses deposit?"
                </span>
                <span className="ml-auto text-[10px] font-bold text-[var(--color-primary-light)] bg-[var(--color-primary)]/15 px-2 py-0.5 rounded whitespace-nowrap">
                  AI Instant
                </span>
              </div>

            </div>

            {/* Floating Badge Card 1 */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -left-4 bg-[#10151C]/95 border border-[var(--color-border)] p-3 rounded-xl shadow-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-[var(--color-text)]">Plain-Language Help</strong>
                <span className="text-[10px] text-[var(--color-text-muted)]">Zero Jargon</span>
              </div>
            </motion.div>

            {/* Floating Badge Card 2 */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -right-4 bg-[#10151C]/95 border border-[var(--color-border)] p-3 rounded-xl shadow-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-[var(--color-text)]">Bar-Verified</strong>
                <span className="text-[10px] text-[var(--color-text-muted)]">Pan-India Advocates</span>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </motion.div>

      {/* Bouncing Scroll Indicator Chevron */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full flex justify-center pb-2 z-10 cursor-pointer"
      >
        <a href="#trust-bar" aria-label="Scroll down">
          <ChevronDown className="w-6 h-6 text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors" />
        </a>
      </motion.div>

    </section>
  );
};
