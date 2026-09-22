import { TrendingUp, ShieldCheck, Layers, Award } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const STATS = [
  {
    icon: TrendingUp,
    value: 99.4,
    suffix: '%',
    decimals: 1,
    label: 'Detection Accuracy',
    sub: 'Held-out test split of EMSCAD benchmark',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
  },
  {
    icon: ShieldCheck,
    value: 17880,
    suffix: '+',
    decimals: 0,
    label: 'Annotated Job Postings',
    sub: 'Trained on the peer-reviewed dataset',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  {
    icon: Layers,
    value: 184,
    suffix: 'ms',
    decimals: 0,
    label: 'Average Pipeline Latency',
    sub: 'BERT inference + LIME attributions',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/30',
  },
  {
    icon: Award,
    value: 0,
    suffix: '',
    decimals: 0,
    label: 'Unexplained Black Boxes',
    sub: 'Every token, weight & deduction verified',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
];

export function StatsSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <SpotlightCard
              key={i}
              spotlightColor="rgba(168, 85, 247, 0.15)"
              className="flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/10 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    BENCHMARK
                  </span>
                </div>

                {/* Massive Animated Counter Number */}
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-2">
                  <AnimatedCounter
                    end={stat.value}
                    decimals={stat.decimals}
                    suffix={stat.suffix}
                  />
                </div>

                <div className="text-base font-bold text-slate-200 group-hover:text-violet-300 transition-colors">
                  {stat.label}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-slate-500 font-mono">
                {stat.sub}
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
}
