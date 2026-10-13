import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const faqs = [
    {
      question: "Is Nyaysahayak free to use for everyday citizens?",
      answer: "Yes! Nyaysahayak offers free AI legal guidance, rights exploration, and basic RTI/notice drafting for all citizens. Premium features like direct advocate consultation booking and advanced court filing management have transparent, affordable pricing."
    },
    {
      question: "How accurate are the AI answers and legal citations?",
      answer: "Unlike general AI chatbots that hallucinate case laws, Nyaysahayak uses a 6-Check Citation Verification Protocol. Every legal response is grounded strictly in official, whitelisted sources including the Supreme Court of India, High Courts, Central Bare Acts, and e-Gazettes."
    },
    {
      question: "Does Nyaysahayak replace a human lawyer?",
      answer: "Nyaysahayak acts as your legal assistant to help you understand your rights, prepare documents, and evaluate case strength. When court representation or formal legal proceedings are required, Nyaysahayak connects you directly with Bar Council accredited advocates."
    },
    {
      question: "Is my case information and document data confidential?",
      answer: "Confidentiality is central to the product. Uploaded documents and legal queries are protected with encryption in transit and at rest, and private legal data is not shared with third parties or used to train public AI models."
    },
    {
      question: "Which Indian languages are currently supported?",
      answer: "Nyaysahayak natively supports Hindi (हिन्दी), Tamil (தமிழ்), Marathi (मराठी), Bengali (বাংলা), Telugu (తెలుగు), and English, with full support for Devanagari Unicode NFC script normalization."
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      <div className="text-center mb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-semibold tracking-widest text-[var(--color-primary-light)] uppercase block mb-3 flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight"
        >
          Got Questions? We Have Answers.
        </motion.h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="glass-card rounded-xl overflow-hidden border border-[var(--color-border)]"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-serif text-base sm:text-lg font-bold text-[var(--color-text)]">
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-primary-light)] transition-transform duration-300 ${isOpen ? "rotate-180 bg-[var(--color-primary)]/20" : ""}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 text-sm text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border)]/50 mt-1">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
};
