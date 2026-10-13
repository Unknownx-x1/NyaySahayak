import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, ShieldCheck, MapPin, Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface LawyerNetworkProps {
  onOpenChat: () => void;
}

export const LawyerNetworkShowcase: React.FC<LawyerNetworkProps> = ({ onOpenChat }) => {
  const advocates = [
    {
      name: "Adv. Rajesh Sharma",
      court: "Supreme Court of India & Delhi High Court",
      specialty: "Constitutional & Property Disputes",
      location: "New Delhi",
      verified: true
    },
    {
      name: "Adv. Meera Sundaram",
      court: "Madras High Court & District Courts",
      specialty: "Consumer Protection & Commercial Law",
      location: "Chennai",
      verified: true
    },
    {
      name: "Adv. Vikram Deshmukh",
      court: "Bombay High Court",
      specialty: "Tenancy & Civil Litigation",
      location: "Mumbai",
      verified: true
    },
    {
      name: "Adv. Ananya Chatterjee",
      court: "Calcutta High Court",
      specialty: "Cyber Law & Family Matters",
      location: "Kolkata",
      verified: true
    }
  ];

  return (
    <section id="lawyers" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-semibold tracking-widest text-[var(--color-primary-light)] uppercase block mb-3 flex items-center justify-center gap-2"
        >
          <UserCheck className="w-3.5 h-3.5" /> Bar Council Accredited Experts
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight"
        >
          Need In-Person Representation?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base sm:text-lg text-[var(--color-text-muted)]"
        >
          Connect seamlessly with verified advocates across all major High Courts and District Courts in India.
        </motion.p>
      </div>

      {/* 4 Advocates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {advocates.map((adv, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#1b4238] flex items-center justify-center text-emerald-300 font-serif font-bold text-lg border border-[var(--color-accent-light)]">
                  {adv.name.split(' ')[1]?.[0] || 'A'}
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[var(--color-text)] mb-1 group-hover:text-[var(--color-primary-light)] transition-colors">
                {adv.name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-3">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary-light)]" />
                <span>{adv.location}</span>
              </div>

              <p className="text-xs text-slate-300 font-medium mb-3">
                {adv.court}
              </p>

              <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-[#0B0F14] border border-[var(--color-border)] text-[var(--color-primary-light)]">
                {adv.specialty}
              </span>
            </div>

            <button
              onClick={onOpenChat}
              className="mt-6 w-full btn-pill btn-ghost py-2 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <span>Consult Advocate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </motion.div>
        ))}
      </div>

    </section>
  );
};
