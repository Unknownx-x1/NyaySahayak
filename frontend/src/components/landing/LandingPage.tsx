import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { TrustBar } from './TrustBar';
import { HowItWorks } from './HowItWorks';
import { FeaturesGrid } from './FeaturesGrid';
import { InteractiveAIChatDemo } from './InteractiveAIChatDemo';
import { MultilingualShowcase } from './MultilingualShowcase';
import { LawyerNetworkShowcase } from './LawyerNetworkShowcase';
import { Testimonials } from './Testimonials';
import { FaqSection } from './FaqSection';
import { FooterCTA } from './FooterCTA';

interface LandingPageProps {
  onLaunchAppWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchAppWorkspace }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300 font-sans selection:bg-[var(--color-primary)] selection:text-slate-950 relative z-10">
      
      {/* Fixed Full-Viewport Cover Video Background */}
      <div className="bg-video-container">
        <video className="bg-video-element" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Top Fixed Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenChat={onLaunchAppWorkspace}
      />

      {/* Main Page Sections */}
      <main>
        {/* Hero Section */}
        <HeroSection onOpenChat={onLaunchAppWorkspace} />

        {/* Marquee Trust Bar */}
        <TrustBar />

        {/* How It Works (3-step scroll triggered) */}
        <HowItWorks onOpenChat={onLaunchAppWorkspace} />

        {/* Features Grid */}
        <FeaturesGrid onOpenChat={onLaunchAppWorkspace} />

        {/* Interactive Real-Time AI Chat Demo */}
        <InteractiveAIChatDemo />

        {/* Multilingual Showcase */}
        <MultilingualShowcase />

        {/* Lawyer Network Showcase */}
        <LawyerNetworkShowcase onOpenChat={onLaunchAppWorkspace} />

        {/* User Testimonials */}
        <Testimonials />

        {/* FAQ Accordion Section */}
        <FaqSection />

        {/* Footer & Final Callout Banner */}
        <FooterCTA onOpenChat={onLaunchAppWorkspace} />
      </main>

    </div>
  );
};
