import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Binary,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { InteractiveScanner } from '@/components/ui/InteractiveScanner';
import { BorderBeam } from '@/components/ui/BorderBeam';

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-violet-600/25 via-indigo-500/20 to-fuchsia-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Floating Announcement Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6 group cursor-pointer"
      >
        <Link
          to="/about"
          className="relative inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/50 hover:bg-white/[0.07] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]"
        >
          <BorderBeam size={120} duration={6} colorFrom="#c084fc" colorTo="#818cf8" />
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <span className="text-xs font-mono font-medium text-violet-200">
            FraudBERT™ 2.4 Active · 99.4% Accuracy
          </span>
          <span className="text-white/30 text-xs">•</span>
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
            See EMSCAD Benchmark <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </motion.div>

      {/* Flagship Headline */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
          Detect Fake Jobs Before <br />
          <span className="gradient-heading-aurora">
            They Steal Your Identity.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          The next-generation cybersecurity platform that inspects job advertisements using{' '}
          <span className="text-violet-300 font-medium">Fine-Tuned BERT</span>, computes a{' '}
          <span className="text-cyan-300 font-medium">0–100 Trust Score</span>, and delivers transparent{' '}
          <span className="text-fuchsia-300 font-medium">SHAP & LIME token explanations</span> in milliseconds.
        </p>

        {/* Action Button Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/analyze"
            className="relative group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <BorderBeam size={160} duration={5} colorFrom="#ffffff" colorTo="#c084fc" />
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span>Scan a Job Posting Free</span>
            <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm text-slate-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all duration-200"
          >
            <Binary className="w-4 h-4 text-slate-400" />
            <span>How XAI Works</span>
          </Link>
        </div>

        {/* Micro-Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Free for Job Seekers</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
            <span>Token-Level Explainability</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Multi-Modal OCR & PDF Support</span>
          </div>
        </div>
      </motion.div>

      {/* Flagship Centerpiece: Interactive Cockpit Simulator */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mt-14 relative"
      >
        {/* The Live Interactive Scanner */}
        <InteractiveScanner />
      </motion.div>
    </section>
  );
}
