import { type ReactNode } from 'react';
import { motion } from 'motion/react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'green' | 'red' | 'none';
  hover?: boolean;
  delay?: number;
}

const glowMap = {
  cyan:   'hover:shadow-[0_0_40px_rgba(6,182,212,0.3),0_0_80px_rgba(6,182,212,0.1)] hover:border-cyan-500/30',
  violet: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.3),0_0_80px_rgba(139,92,246,0.1)] hover:border-violet-500/30',
  green:  'hover:shadow-[0_0_40px_rgba(16,185,129,0.3),0_0_80px_rgba(16,185,129,0.1)] hover:border-emerald-500/30',
  red:    'hover:shadow-[0_0_40px_rgba(239,68,68,0.3),0_0_80px_rgba(239,68,68,0.1)] hover:border-red-500/30',
  none:   '',
};

export function GlowCard({
  children,
  className = '',
  glowColor = 'cyan',
  hover = true,
  delay = 0,
}: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`
        relative rounded-2xl
        bg-[rgba(5,15,30,0.8)]
        border border-white/[0.08]
        backdrop-blur-xl
        transition-all duration-300
        ${hover ? glowMap[glowColor] : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

/* Gradient border card variant */
export function GradientBorderCard({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`relative rounded-2xl p-px ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.4), rgba(139,92,246,0.4))',
      }}
    >
      <div className="relative rounded-[calc(1rem-1px)] bg-[#050f1e] h-full">
        {children}
      </div>
    </motion.div>
  );
}
