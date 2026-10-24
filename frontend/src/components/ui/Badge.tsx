import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'safe' | 'warn' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-line-strong bg-surface-2 text-fg-muted',
  accent: 'border-accent/25 bg-accent/10 text-accent',
  safe: 'border-safe/25 bg-safe/10 text-safe',
  warn: 'border-warn/25 bg-warn/10 text-warn',
  danger: 'border-danger/25 bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function Alert({ tone = 'danger', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role="alert" className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone])}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer-bg animate-shimmer rounded-lg bg-surface-2', className)} />;
}
