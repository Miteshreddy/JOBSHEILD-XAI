import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
} from 'lucide-react';
import { BorderBeam } from './BorderBeam';

interface PresetScenario {
  id: string;
  name: string;
  categoryBadge: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  content: {
    text: string;
    tokens: { word: string; weight: number; isRedFlag: boolean }[];
  };
  verdict: 'CRITICAL' | 'HIGH' | 'LEGITIMATE';
  trustScore: number;
  fraudProb: number;
  keySignals: string[];
}

const PRESETS: PresetScenario[] = [
  {
    id: 'crypto-scam',
    name: '🚨 Crypto Wire Scam',
    categoryBadge: 'High-Yield Trap',
    title: 'Remote Operations Associate ($85/hr)',
    company: 'Nexus Global Holdings (Unverified)',
    location: 'Remote · Worldwide',
    salary: '$85 / hour · Daily Payout',
    content: {
      text: 'We are hiring urgently! Interview conducted via Telegram. Applicant must deposit $250 refundable security fee for proprietary encrypted workstation before onboarding starts. Guaranteed weekly wire transfer.',
      tokens: [
        { word: 'urgently!', weight: 0.28, isRedFlag: true },
        { word: 'Telegram', weight: 0.44, isRedFlag: true },
        { word: 'deposit $250 fee', weight: 0.52, isRedFlag: true },
        { word: 'workstation', weight: 0.12, isRedFlag: true },
        { word: 'wire transfer', weight: 0.36, isRedFlag: true },
      ],
    },
    verdict: 'CRITICAL',
    trustScore: 8,
    fraudProb: 98.4,
    keySignals: [
      'Upfront deposit requested for equipment',
      'Informal communication (Telegram)',
      'Unrealistic entry-level compensation ($85/hr)',
    ],
  },
  {
    id: 'whatsapp-ghost',
    name: '⚠️ Fake WhatsApp Recruiter',
    categoryBadge: 'Phishing Ad',
    title: 'Executive Assistant to VP',
    company: 'Aura Ventures LLC',
    location: 'Remote · US Only',
    salary: '$120,000 / year',
    content: {
      text: 'Immediate start. Send your passport scan and ID card copy to whatsapp recruiter at +1 800-FAKE-JOB. We will mail a cashier check to buy home office supplies from our approved vendor.',
      tokens: [
        { word: 'Immediate start', weight: 0.22, isRedFlag: true },
        { word: 'passport scan', weight: 0.46, isRedFlag: true },
        { word: 'whatsapp recruiter', weight: 0.39, isRedFlag: true },
        { word: 'cashier check', weight: 0.48, isRedFlag: true },
        { word: 'approved vendor', weight: 0.31, isRedFlag: true },
      ],
    },
    verdict: 'HIGH',
    trustScore: 24,
    fraudProb: 82.6,
    keySignals: [
      'Identity theft risk: PII requested upfront',
      'Classic fake check overpayment scheme',
      'No formal ATS or company email address',
    ],
  },
  {
    id: 'verified-stripe',
    name: '🛡️ Verified Tech Job',
    categoryBadge: 'Official Listing',
    title: 'Staff Distributed Systems Engineer',
    company: 'Stripe, Inc.',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$240,000 – $310,000 + Equity',
    content: {
      text: 'Build low-latency payment processing pipelines. We offer competitive base salary, 401(k) match, comprehensive medical/dental, and annual equity refreshers. Apply through official careers portal.',
      tokens: [
        { word: 'payment pipelines', weight: -0.25, isRedFlag: false },
        { word: '401(k) match', weight: -0.38, isRedFlag: false },
        { word: 'comprehensive medical', weight: -0.29, isRedFlag: false },
        { word: 'equity refreshers', weight: -0.34, isRedFlag: false },
        { word: 'official careers portal', weight: -0.45, isRedFlag: false },
      ],
    },
    verdict: 'LEGITIMATE',
    trustScore: 97,
    fraudProb: 1.6,
    keySignals: [
      'Domain verified: stripe.com via SPF/DKIM',
      'Industry-standard benefits & ATS portal',
      'Zero financial/credential red flags detected',
    ],
  },
];

export function InteractiveScanner() {
  const [activePreset, setActivePreset] = useState<PresetScenario>(PRESETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'signals'>('tokens');

  const handleSelectPreset = (preset: PresetScenario) => {
    if (preset.id === activePreset.id) return;
    setIsScanning(true);
    setActivePreset(preset);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  const isSafe = activePreset.verdict === 'LEGITIMATE';
  const isCritical = activePreset.verdict === 'CRITICAL';

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)]">
      {/* Outer Glow matching verdict */}
      <div
        className="absolute -inset-1 rounded-3xl blur-2xl opacity-40 transition-all duration-700 pointer-events-none"
        style={{
          background: isSafe
            ? 'radial-gradient(circle, rgba(16,185,129,0.35), transparent 70%)'
            : isCritical
            ? 'radial-gradient(circle, rgba(239,68,68,0.35), transparent 70%)'
            : 'radial-gradient(circle, rgba(249,115,22,0.35), transparent 70%)',
        }}
      />

      {/* Main Glass Shell */}
      <div className="relative rounded-[22px] bg-[#070611]/90 backdrop-blur-2xl border border-white/10 overflow-hidden">
        {/* Animated Border Beam around Cockpit */}
        <BorderBeam
          size={350}
          duration={10}
          colorFrom={isSafe ? '#34d399' : isCritical ? '#f87171' : '#fb923c'}
          colorTo="#818cf8"
        />

        {/* Top Cockpit Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          {/* Status Indicator & Live Terminal Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <BrainCircuit className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>BERT-XAI Neural Pipeline</span>
              <span className="text-white/20">/</span>
              <span className="text-violet-300">Live Interactive Simulator</span>
            </div>
          </div>

          {/* Scenario Selection Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            {PRESETS.map((p) => {
              const active = p.id === activePreset.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? 'bg-violet-600/30 text-white border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cockpit Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Job Ad View with Scanning Laser (7 Cols) */}
          <div className="relative lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden flex flex-col justify-between">
            {/* Live Scanning Laser Line */}
            {isScanning && (
              <motion.div
                initial={{ top: '0%', opacity: 0 }}
                animate={{ top: '100%', opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_20px_#a855f7] z-30 pointer-events-none"
              />
            )}

            <div>
              {/* Job Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-white/[0.06] text-slate-300 border border-white/10">
                      {activePreset.categoryBadge}
                    </span>
                    <span className="text-xs text-slate-500">{activePreset.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{activePreset.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5 font-medium">{activePreset.company}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 block">Reported Pay</span>
                  <span className="text-sm font-semibold text-violet-300">{activePreset.salary}</span>
                </div>
              </div>

              {/* Text Body with Explanatory Token Highlighting */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] my-4 font-mono text-xs leading-relaxed text-slate-300 relative">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center justify-between">
                  <span>Job Advertisement Extract</span>
                  <span className="text-violet-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> LIME Token Weights
                  </span>
                </div>
                <p>
                  {activePreset.content.text.split(' ').map((word, i) => {
                    // Check if word is highlighted token
                    const match = activePreset.content.tokens.find((t) =>
                      word.toLowerCase().includes(t.word.split(' ')[0].toLowerCase())
                    );
                    if (match) {
                      return (
                        <span
                          key={i}
                          className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-semibold transition-all duration-300 ${
                            match.isRedFlag
                              ? 'bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                              : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          }`}
                          title={`Feature Weight: ${(match.weight * 100).toFixed(0)}%`}
                        >
                          {word}{' '}
                        </span>
                      );
                    }
                    return <span key={i}>{word} </span>;
                  })}
                </p>
              </div>
            </div>

            {/* Bottom Tabs: Token Weights vs Key Signals */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex gap-4 text-xs font-semibold mb-3">
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={`pb-1 transition-all ${
                    activeTab === 'tokens'
                      ? 'text-violet-400 border-b-2 border-violet-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Neural Attributions (LIME)
                </button>
                <button
                  onClick={() => setActiveTab('signals')}
                  className={`pb-1 transition-all ${
                    activeTab === 'signals'
                      ? 'text-violet-400 border-b-2 border-violet-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Engineered Signals
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'tokens' ? (
                  <motion.div
                    key="tokens"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex flex-wrap gap-2"
                  >
                    {activePreset.content.tokens.map((token, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                          token.isRedFlag
                            ? 'bg-red-500/10 border-red-500/20 text-red-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <span>{token.word}</span>
                        <span className="text-[10px] opacity-70 font-bold">
                          {token.isRedFlag ? '+' : '-'}
                          {Math.abs(Math.round(token.weight * 100))}%
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="signals"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-1.5 text-xs text-slate-400"
                  >
                    {activePreset.keySignals.map((signal, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {isSafe ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{signal}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Dynamic XAI Verdict & Meters (5 Cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-b from-white/[0.015] to-black/40 flex flex-col justify-between">
            {/* Verdict Badge with Pulsing Aura */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                  AI Verdict Analysis
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Latency: 184ms
                </span>
              </div>

              {/* Huge Verdict Pill */}
              <motion.div
                key={activePreset.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 rounded-2xl border flex items-center justify-between mb-6 ${
                  isSafe
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    : isCritical
                    ? 'bg-red-950/40 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                    : 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSafe
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCritical
                        ? 'bg-red-500/20 text-red-400 animate-bounce'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isSafe ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <ShieldAlert className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      Detection Verdict
                    </div>
                    <div
                      className={`text-lg font-black tracking-wide ${
                        isSafe
                          ? 'text-emerald-300'
                          : isCritical
                          ? 'text-red-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {activePreset.verdict === 'LEGITIMATE'
                        ? 'VERIFIED SAFE'
                        : `${activePreset.verdict} FRAUD RISK`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Confidence</span>
                  <span className="text-base font-bold text-white">{activePreset.fraudProb}%</span>
                </div>
              </motion.div>

              {/* Dual Meters: Trust Score & Fraud Probability */}
              <div className="space-y-4">
                {/* Trust Score Meter */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">JobShield Trust Score</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isSafe
                          ? 'text-emerald-400'
                          : isCritical
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {activePreset.trustScore} / 100
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activePreset.trustScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isSafe
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                          : isCritical
                          ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                          : 'bg-gradient-to-r from-amber-600 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                      }`}
                    />
                  </div>
                </div>

                {/* Fraud Probability */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">BERT Classification Probability</span>
                    <span className="text-slate-200 font-mono font-bold text-sm">
                      {activePreset.fraudProb}% Fraud
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activePreset.fraudProb}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Note */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                SHAP Global Model: Active
              </span>
              <span>EMSCAD Trained</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
