import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export function CTASection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto overflow-hidden">
      {/* Background ambient multi-color aurora */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Container Card */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/[0.05] to-transparent shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)]">
        <SpotlightCard
          spotlightColor="rgba(168, 85, 247, 0.25)"
          className="relative rounded-[22px] !bg-[#070613]/95 p-10 sm:p-16 text-center backdrop-blur-2xl border-white/10"
        >
          <BorderBeam size={320} duration={9} colorFrom="#c084fc" colorTo="#ec4899" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>100% Free for All Job Seekers</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08] max-w-3xl mx-auto">
            Stop Guessing. <br />
            <span className="gradient-heading-neon">
              Verify Before You Share Sensitive Data.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Paste any suspicious posting or drop a screenshot. Get real-time BERT classifications, deterministic Trust Scores, and word-by-word LIME attributions in seconds.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/analyze"
              className="relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_35px_rgba(139,92,246,0.5)] transition-all duration-300 hover:shadow-[0_0_55px_rgba(139,92,246,0.7)] hover:scale-[1.03] active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5 text-violet-200" />
              <span>Launch Free Security Scan</span>
              <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm text-slate-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <span>Create Free Account</span>
            </Link>
          </div>

          {/* Trust points */}
          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Credit Card Ever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              <span>Instant Token Attributions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Full Audit History</span>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
