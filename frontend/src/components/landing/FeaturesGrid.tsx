import {
  Brain,
  FileSearch,
  Gauge,
  Eye,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { BorderBeam } from '@/components/ui/BorderBeam';

export function FeaturesGrid() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Explainable AI Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Zero Black Boxes. <br />
          <span className="gradient-heading-neon">Engineered to Explain Every Word.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Generic AI tools give you a binary guess with no evidence. JobShield-XAI breaks down job advertisements into mathematically verifiable token attributions, deterministic trust deductions, and actionable guidance.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento 1: BERT Neural Architecture (Spans 2 cols on desktop) */}
        <div className="md:col-span-2 relative">
          <SpotlightCard
            spotlightColor="rgba(139, 92, 246, 0.2)"
            glowColor="rgba(139, 92, 246, 0.35)"
            className="h-full flex flex-col justify-between"
          >
            <BorderBeam size={220} duration={8} colorFrom="#c084fc" colorTo="#60a5fa" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                  Transformer Core
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Fine-Tuned FraudBERT™ Neural Classifier
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Trained on the EMSCAD benchmark of 17,880+ annotated postings. Understands semantic deception, psychological urgency cues, and evasive syntax far beyond simple static keyword blacklists.
              </p>
            </div>

            {/* Neural Matrix Graphic Simulation */}
            <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3">
                <span>ATTENTION LAYER 12 · HEAD 8</span>
                <span className="text-violet-400 font-bold">F1 Score: 0.863</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { token: '[CLS]', weight: 'bg-violet-500/80' },
                  { token: 'urgent', weight: 'bg-red-500/90' },
                  { token: 'deposit', weight: 'bg-red-600/90' },
                  { token: 'wire', weight: 'bg-orange-500/80' },
                  { token: 'fee', weight: 'bg-red-500/90' },
                  { token: '[SEP]', weight: 'bg-violet-500/60' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`h-8 rounded-md ${item.weight} flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm`}>
                      {item.token}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">T-{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Bento 2: LIME Local Token Attribution */}
        <SpotlightCard
          spotlightColor="rgba(236, 72, 153, 0.2)"
          glowColor="rgba(236, 72, 153, 0.35)"
          className="h-full flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 w-fit mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              LIME Local Explanations
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Isolates the exact phrases in your specific job ad that triggered the fraud verdict, assigning positive and negative mathematical weights.
            </p>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs">
            <div className="flex justify-between items-center text-red-400 bg-red-500/10 px-2 py-1 rounded">
              <span>"deposit workstation"</span>
              <span className="font-bold">+44%</span>
            </div>
            <div className="flex justify-between items-center text-red-400 bg-red-500/10 px-2 py-1 rounded">
              <span>"telegram interview"</span>
              <span className="font-bold">+38%</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
              <span>"company 401(k)"</span>
              <span className="font-bold">-26%</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Bento 3: Trust Score Engine */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.2)"
          glowColor="rgba(16, 185, 129, 0.35)"
          className="h-full flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 w-fit mb-4">
              <Gauge className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              0–100 Trust Score
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Deterministic rule-based scoring that audits email MX records, company domains, upfront fees, and compensation ranges.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-mono">BASE SCORE: 100</div>
              <div className="text-xs text-red-400 font-mono mt-1">-40 Fee Request</div>
              <div className="text-xs text-red-400 font-mono">-30 Free Mail Domain</div>
            </div>
            <div className="text-center pl-4 border-l border-white/10">
              <div className="text-2xl font-black text-amber-400 font-mono">30</div>
              <div className="text-[10px] text-slate-500 uppercase">Trust Score</div>
            </div>
          </div>
        </SpotlightCard>

        {/* Bento 4: SHAP Global Feature Importance */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.2)"
          glowColor="rgba(99, 102, 241, 0.35)"
          className="h-full flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 w-fit mb-4">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              SHAP Global Attributions
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Game-theoretic Shapley values reveal macro patterns across all historical fraud campaigns so you understand overall model behavior.
            </p>
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            {[
              { label: 'Payment Urgency', pct: 92, color: 'bg-indigo-500' },
              { label: 'Unverified Domain', pct: 78, color: 'bg-violet-500' },
              { label: 'Off-Platform Chat', pct: 64, color: 'bg-fuchsia-500' },
            ].map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{f.label}</span>
                  <span>{f.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Bento 5: Multi-Modal Ingestion (Spans 1 Col or Multi) */}
        <SpotlightCard
          spotlightColor="rgba(6, 182, 212, 0.2)"
          glowColor="rgba(6, 182, 212, 0.35)"
          className="h-full flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 w-fit mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Multi-Modal Ingestion
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Inspect ads via raw text, PDF resumes, direct career portal URLs, or mobile screenshots using our high-precision OCR pipeline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
              📄 PDF Parse
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
              📸 OCR Vision
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
              🔗 URL Scrape
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
              ✍️ Raw Text
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
