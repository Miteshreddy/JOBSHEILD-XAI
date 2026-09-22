import { UploadCloud, Cpu, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const STEPS = [
  {
    step: '01',
    icon: UploadCloud,
    title: 'Ingest & Preprocess',
    desc: 'Submit job postings via raw text, resume PDF, mobile screenshot, or career page URL. Text is sanitized and normalized.',
    tag: 'Multi-Modal Input',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Dual-Engine Inference',
    desc: 'BERT extracts deep contextual semantics while the deterministic Trust Engine verifies domains, fee requests, and salary bounds.',
    tag: 'FraudBERT™ Core',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'XAI Token Attribution',
    desc: 'LIME highlights word-level triggers in your text, and SHAP computes game-theoretic feature impacts across 17k+ ads.',
    tag: 'SHAP & LIME Math',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/30',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Actionable Intelligence',
    desc: 'Receive an instant risk tier (Low → Critical), a 0–100 Trust Score, and concrete guidance before you apply.',
    tag: 'Decision Support',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-indigo-300 mb-4 backdrop-blur-md">
          <span>End-to-End Pipeline</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          From Raw Ad to <br />
          <span className="gradient-heading-aurora">Mathematically Explained Verdict.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Four interconnected stages work concurrently to ensure you never walk into a phishing trap, identity theft scheme, or fake check scam.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <SpotlightCard
              key={step.step}
              spotlightColor="rgba(139, 92, 246, 0.15)"
              className="flex flex-col justify-between h-full group"
            >
              <div>
                {/* Step number & Tag */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-black font-mono text-white/20 group-hover:text-violet-400 transition-colors">
                    {step.step}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-400">
                    {step.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className={`p-3 rounded-xl bg-white/[0.03] border border-white/10 w-fit mb-4 ${step.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Title & Desc */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Step indicator footer */}
              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Stage {idx + 1} of 4</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
}
