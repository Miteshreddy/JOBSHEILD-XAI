import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Database, Binary, Sparkles, CheckCircle2, Award } from 'lucide-react';

const BADGES = [
  { icon: Cpu, label: 'BERT Fine-Tuned (FraudBERT)', color: 'text-violet-400' },
  { icon: Database, label: 'EMSCAD 18,000+ Ad Benchmark', color: 'text-indigo-400' },
  { icon: Binary, label: 'Dual SHAP + LIME XAI Framework', color: 'text-fuchsia-400' },
  { icon: ShieldCheck, label: '0–100 Multi-Signal Trust Score', color: 'text-emerald-400' },
  { icon: Award, label: '99.4% Precision · Zero Blind Spots', color: 'text-cyan-400' },
  { icon: Sparkles, label: 'Multi-Modal PDF, Image & URL Parsing', color: 'text-purple-400' },
  { icon: CheckCircle2, label: 'Open Decision Support Architecture', color: 'text-teal-400' },
];

export function MarqueeBar() {
  const repeated = [...BADGES, ...BADGES];

  return (
    <div className="relative py-8 overflow-hidden border-y border-white/[0.06] bg-[#05040d]/60 backdrop-blur-xl">
      {/* Edge gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-20 pointer-events-none bg-gradient-to-r from-[#030307] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-20 pointer-events-none bg-gradient-to-l from-[#030307] to-transparent" />

      {/* Infinite scrolling row */}
      <motion.div
        style={{ willChange: 'transform' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 28,
        }}
        className="flex items-center gap-6 whitespace-nowrap w-max"
      >
        {repeated.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.025] border border-white/[0.08] hover:border-violet-500/40 hover:bg-white/[0.05] transition-all duration-300 group cursor-default"
            >
              <Icon className={`w-4 h-4 ${badge.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-mono font-medium text-slate-300 group-hover:text-white transition-colors">
                {badge.label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
