import { motion } from 'motion/react';
import { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Globe,
  Camera,
  ArrowRight,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const TABS = [
  { id: 'text', label: 'Raw Job Text', icon: FileText },
  { id: 'url', label: 'Live URL Ingestion', icon: Globe },
  { id: 'pdf', label: 'PDF / OCR Extraction', icon: Camera },
] as const;

type TabId = typeof TABS[number]['id'];

const DEMO_DATA: Record<TabId, {
  title: string;
  company: string;
  source: string;
  risk: 'CRITICAL' | 'MEDIUM' | 'LOW';
  trust: number;
  fraud: number;
  color: string;
  flags: string[];
  action: string;
}> = {
  text: {
    title: 'Senior Cloud Engineer (Immediate Start)',
    company: 'FinTech Growth Partners (Unverified)',
    source: 'Pasted Job Description Text',
    risk: 'CRITICAL',
    trust: 12,
    fraud: 96.8,
    color: 'text-red-400',
    flags: [
      'Advance deposit required for Apple equipment ($300)',
      'Recruiter email hosted on free proton.me domain',
      'No formal ATS tracking link provided',
    ],
    action: 'DO NOT APPLY. High risk financial fraud campaign identified with 96.8% confidence.',
  },
  url: {
    title: 'Lead Product Designer',
    company: 'Vertex Digital Labs',
    source: 'https://vertex-jobs-careers.live/apply',
    risk: 'MEDIUM',
    trust: 58,
    fraud: 38.4,
    color: 'text-amber-400',
    flags: [
      'Domain registered less than 14 days ago',
      'Missing SSL Organization Validation certificate',
      'Salary 40% above regional market average',
    ],
    action: 'Proceed with caution. Verify corporate registration via state databases before sending resume.',
  },
  pdf: {
    title: 'Senior Security Architect',
    company: 'CrowdStrike Holdings',
    source: 'Official JD Brochure (PDF Upload)',
    risk: 'LOW',
    trust: 96,
    fraud: 2.1,
    color: 'text-emerald-400',
    flags: [],
    action: 'Verified legitimate posting. All enterprise security signals matched official career guidelines.',
  },
};

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<TabId>('text');
  const activeData = DEMO_DATA[activeTab];

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-4 backdrop-blur-md">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          <span>Interactive Modality Sandbox</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Inspect Any Format. <br />
          <span className="gradient-heading-aurora">Receive Instant Deep Diagnostics.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Switch between ingestion channels to see how JobShield-XAI sanitizes, tokenizes, and delivers transparent explainability on diverse data formats.
        </p>
      </div>

      {/* Main Sandbox Card */}
      <div className="max-w-4xl mx-auto">
        {/* Modality Selector Tabs */}
        <div className="flex justify-center mb-8">
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-2 backdrop-blur-xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    active
                      ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Result Panel */}
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
          <SpotlightCard
            spotlightColor="rgba(168, 85, 247, 0.18)"
            className="p-8 sm:p-10 !bg-[#070612]/95 backdrop-blur-2xl"
          >
            <BorderBeam size={280} duration={8} colorFrom="#a855f7" colorTo="#38bdf8" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  Source: {activeData.source}
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight">{activeData.title}</h3>
                <p className="text-sm text-slate-400 font-medium mt-0.5">{activeData.company}</p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider border ${
                  activeData.risk === 'CRITICAL'
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : activeData.risk === 'MEDIUM'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  {activeData.risk} RISK
                </span>
              </div>
            </div>

            {/* Meters & Visuals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              {/* Trust Score Card */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-400">Trust Engine Score</span>
                  <span className={`text-base font-bold font-mono ${activeData.color}`}>
                    {activeData.trust} / 100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    key={activeTab + '-trust'}
                    initial={{ width: 0 }}
                    animate={{ width: `${activeData.trust}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      activeData.trust < 40
                        ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                        : activeData.trust < 70
                        ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                        : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                    }`}
                  />
                </div>
              </div>

              {/* BERT Fraud Probability Card */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-400">BERT Neural Probability</span>
                  <span className="text-base font-bold font-mono text-white">
                    {activeData.fraud}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    key={activeTab + '-fraud'}
                    initial={{ width: 0 }}
                    animate={{ width: `${activeData.fraud}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                  />
                </div>
              </div>
            </div>

            {/* Red Flags Triggered */}
            <div className="mb-8">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block mb-3">
                Detected Signals & Heuristics
              </span>
              {activeData.flags.length > 0 ? (
                <div className="space-y-2">
                  {activeData.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 font-mono"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero structural, financial, or credential red flags detected in document.</span>
                </div>
              )}
            </div>

            {/* Tactical Decision Output */}
            <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-violet-200 leading-relaxed font-medium">
                <span className="font-bold text-white block mb-0.5">XAI Recommendation</span>
                {activeData.action}
              </div>
            </div>

            {/* Call to action button */}
            <div className="mt-8 text-center">
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                <span>Run this test on your own job ad</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
