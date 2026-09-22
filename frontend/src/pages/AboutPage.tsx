import { motion } from 'motion/react';
import { Gauge, ShieldQuestion, Sparkles, Info, Brain, Target, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const TRUST_BANDS = [
  { range: '80–100', label: 'Highly Trustworthy', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  { range: '60–79', label: 'Moderately Trustworthy', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)' },
  { range: '30–59', label: 'Suspicious / Elevated Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { range: '0–29', label: 'Critical Fraud Trap', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
];

const RISK_BADGES = [
  { cat: 'Low Risk', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { cat: 'Medium Risk', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { cat: 'High Risk', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { cat: 'Critical Risk', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
];

const CARDS = [
  {
    icon: Brain,
    title: 'The Fraud-BERT Foundation',
    body: 'Extends the Fraud-BERT baseline (Taneja, Vashishtha & Ratnoo, Discover Computing, 2025) with 99.4% accuracy on the EMSCAD dataset of 17,880 real-world job postings.',
    color: 'text-violet-400',
  },
  {
    icon: Sparkles,
    title: 'LIME — Local Explanations',
    body: 'LIME explains this one specific posting — which words in it pushed the prediction toward "fraudulent" or "legitimate." Word-level attribution, visualized.',
    color: 'text-fuchsia-400',
  },
  {
    icon: Target,
    title: 'SHAP — Global Explanations',
    body: "SHAP shows what the model relies on overall, aggregated across many postings. Validates the model's global reasoning — not just its verdict on the current posting.",
    color: 'text-indigo-400',
  },
  {
    icon: Info,
    title: 'A Tool, Not a Final Legal Verdict',
    body: "JobShield-XAI is a decision-support aid. Always independently verify a company's official website and contact channels. Never pay an upfront fee to apply for a job.",
    color: 'text-emerald-400',
  },
];

export function AboutPage() {
  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-4 backdrop-blur-md">
          <ShieldQuestion className="w-3.5 h-3.5 text-violet-400" />
          <span>About the Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
          Explainable AI, <br />
          <span className="gradient-heading-aurora">Not an Opaque Black Box.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          JobShield-XAI extends Fraud-BERT with SHAP/LIME explainability, a deterministic Trust Score engine,
          Risk Categorization, Fraud Severity assessment, and a Decision Support engine — all served through
          a single Explainability Dashboard. Every prediction is mathematically accountable.
        </p>
        <Link to="/analyze">
          <button className="mt-6 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all">
            <span>Analyze a Job Posting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </motion.div>

      {/* Trust Score Card */}
      <SpotlightCard
        spotlightColor="rgba(168, 85, 247, 0.15)"
        className="p-8 rounded-2xl mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reading the Trust Score</h2>
            <p className="text-xs text-slate-500 font-mono">0 – 100 · Deterministic · Independent of AI model</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          A 0–100 score, starting at 100, with points deducted for specific red flags: a registration fee requirement,
          a personal email domain (Gmail/Yahoo) instead of an official one, missing company profile,
          unrealistic salary, WhatsApp-only contact, and more. It is fully independent of the AI model's raw prediction.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRUST_BANDS.map((band) => (
            <div
              key={band.range}
              className="flex items-center gap-4 p-4 rounded-xl border font-mono"
              style={{ background: band.bg, borderColor: band.border }}
            >
              <div className="text-xl font-black" style={{ color: band.color }}>{band.range}</div>
              <div className="text-sm text-slate-300 font-sans">{band.label}</div>
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Risk Categories Card */}
      <SpotlightCard
        spotlightColor="rgba(236, 72, 153, 0.15)"
        className="p-8 rounded-2xl mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400">
            <ShieldQuestion className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reading the Risk Category</h2>
            <p className="text-xs text-slate-500 font-mono">Synthesizes BERT probability + Trust Score</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          The Risk Category combines the BERT model's fraud probability with the Trust Score into one overall verdict.
          Even if the AI gives 60% fraud probability but the trust score is very high (legitimately high salary, official email, verified company), the category may still resolve as Medium rather than High.
        </p>
        <div className="flex flex-wrap gap-3">
          {RISK_BADGES.map((badge) => (
            <div
              key={badge.cat}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold font-mono ${badge.bg} ${badge.border}`}
              style={{ color: badge.color }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
              {badge.cat}
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Pillars Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <SpotlightCard key={i} className="p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/10 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">{card.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Architecture Note */}
      <SpotlightCard className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Three-Tier Decoupled Architecture</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed font-mono">
          <span className="text-violet-400 font-bold">React Frontend</span> →{' '}
          <span className="text-indigo-400 font-bold">Express API Gateway</span> →{' '}
          <span className="text-fuchsia-400 font-bold">FastAPI BERT & XAI Microservice</span> +{' '}
          <span className="text-emerald-400 font-bold">MongoDB Persistence</span>.
        </p>
      </SpotlightCard>
    </div>
  );
}
