import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, BookOpen, UserCheck, Clock, Languages, ShieldCheck, Sparkles } from 'lucide-react';

interface FeaturesGridProps {
  onOpenChat: () => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onOpenChat }) => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "24/7 AI Legal Assistant",
      description: "Ask any legal question in everyday words. Get instant, grounded answers citing relevant Indian Acts, Articles, & Court Rulings.",
      highlight: "Sub-Second Responses"
    },
    {
      icon: <FileText className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "Automated Document Drafting",
      description: "Generate legally sound RTIs, Lease Agreements, Consumer Complaints, and Formal Legal Notices in minutes with customized parameters.",
      highlight: "Court-Ready Formats"
    },
    {
      icon: <Languages className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "Multilingual Support",
      description: "Full native support for Hindi (हिन्दी), Tamil (தமிழ்), Marathi (मராठी), Bengali (বাংলা), Telugu, and English.",
      highlight: "Zero Translation Loss"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "Know Your Rights Library",
      description: "Simplified breakdowns of consumer rights, tenant protections, FIR registration rights, labor laws, and women's safety acts.",
      highlight: "Citizen Empowerment"
    },
    {
      icon: <UserCheck className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "Verified Lawyer Network",
      description: "Connect with Bar Council verified advocates specialized in District Courts, High Courts, and the Supreme Court of India.",
      highlight: "Verified Credentials"
    },
    {
      icon: <Clock className="w-6 h-6 text-[var(--color-primary-light)]" />,
      title: "Case Tracking & Timeline",
      description: "Organize petition documents, track hearing dates chronologically, and receive automated reminders for court deadlines.",
      highlight: "Page-Linked Provenance"
    }
  ];

  return (
    <section id="features" className="py-24 bg-[var(--color-bg-alt)] border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8 relative">
      
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-widest text-[var(--color-primary-light)] uppercase block mb-3 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Built for Everyday Citizens & Legal Minded
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight"
          >
            Everything You Need for Legal Protection
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-text-muted)]"
          >
            Combining modern AI architecture with authoritative legal sources to deliver complete peace of mind.
          </motion.p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card p-8 flex flex-col justify-between group cursor-pointer"
              onClick={onOpenChat}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-accent-light)] font-medium">
                    {feature.highlight}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-[var(--color-text)] mb-3 group-hover:text-[var(--color-primary-light)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-semibold text-[var(--color-primary-light)]">
                <span>Explore Feature</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

    </section>
  );
};
