import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How accurate is the FraudBERT detection engine?',
    a: 'The fine-tuned BERT model achieves 99.4% accuracy and an F1 score of 0.863 on the held-out test split of the EMSCAD corpus (17,880 real-world job postings). It captures deep syntactic nuance, urgency signals, and deception vectors that bypass keyword filters.',
  },
  {
    q: 'What is the Trust Score and how does it relate to the AI probability?',
    a: 'The Trust Score (0–100) is a deterministic rule-based engine that deducts points for verifiable operational red flags: upfront registration fees, free webmail recruiter domains (Gmail/Yahoo/Proton), WhatsApp/Telegram-only interviews, and anomalous compensation. The BERT model evaluates semantic deception. Both are synthesized into the final Risk Category.',
  },
  {
    q: 'What is the difference between SHAP and LIME in this framework?',
    a: 'LIME (Local Interpretable Model-agnostic Explanations) inspects the specific job advertisement you submitted, highlighting exact words that pushed the score toward fraud or legitimate. SHAP computes global game-theoretic Shapley values across thousands of ads to verify macro feature importance.',
  },
  {
    q: 'Can I analyze a job posting from a direct link or PDF?',
    a: 'Yes. You can paste any live URL, upload PDF documents, or drop screenshots which our OCR vision pipeline transcribes and sanitizes automatically before neural inference.',
  },
  {
    q: 'Is my uploaded resume or job advertisement kept private?',
    a: 'Yes. Analyses are processed in memory and tied strictly to your authenticated session. We do not sell or share user data with third-party advertisers. You can wipe your audit history at any time with a single click.',
  },
  {
    q: 'Can I integrate JobShield into my own recruiting workflow or ATS via API?',
    a: 'Yes. The backend exposes a full REST + OpenAPI documented API. Visit /api-docs on the backend server for schemas, endpoints, and authentication keys.',
  },
];

function FAQItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        open
          ? 'bg-[#0b0a18]/90 border-violet-500/40 shadow-[0_10px_30px_rgba(139,92,246,0.15)]'
          : 'bg-white/[0.02] border-white/[0.08] hover:border-white/15'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left transition-colors"
      >
        <span className="text-base sm:text-lg font-bold text-white tracking-tight">
          {faq.q}
        </span>
        <div
          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            open
              ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
              : 'bg-white/[0.05] text-slate-400'
          }`}
        >
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-2 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04]">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-4 backdrop-blur-md">
          <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Clear Answers. <br />
          <span className="gradient-heading-aurora">Zero Obfuscation.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Have questions about the underlying research, accuracy benchmarks, or privacy guarantees? We have answers.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <FAQItem key={i} faq={faq} index={i} />
        ))}
      </div>
    </section>
  );
}
