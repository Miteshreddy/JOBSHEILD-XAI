import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import type { Verdict } from '@/types';

const toneVar: Record<Verdict, string> = {
  legitimate: '--safe',
  suspicious: '--warn',
  fraudulent: '--danger',
};

/** Animated 0-100 legitimacy gauge. */
export function ScoreRing({ score, verdict, size = 168 }: { score: number; verdict: Verdict; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const value = useMotionValue(0);
  const dashOffset = useTransform(value, (v) => circumference * (1 - v / 100));
  const label = useTransform(value, (v) => Math.round(v).toString());

  useEffect(() => {
    const controls = animate(value, score, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [score, value]);

  const color = `rgb(var(${toneVar[verdict]}))`;
  const glow = `rgb(var(${toneVar[verdict]}) / 0.18)`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Legitimacy score ${score} out of 100`}>
      <div className="absolute inset-3 rounded-full blur-2xl" style={{ background: glow }} aria-hidden />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'rgb(var(--fg) / 0.08)' }} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ stroke: color, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">{label}</motion.span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Legitimacy</span>
      </div>
    </div>
  );
}
