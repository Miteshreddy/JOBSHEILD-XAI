import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

const VARIANT_STYLES: Record<AlertVariant, { classes: string; Icon: typeof Info }> = {
  error: {
    classes: 'border-risk-critical/20 bg-risk-critical-bg text-risk-critical',
    Icon: AlertCircle,
  },
  warning: {
    classes: 'border-risk-medium/20 bg-risk-medium-bg text-risk-medium',
    Icon: AlertTriangle,
  },
  success: {
    classes: 'border-risk-low/20 bg-risk-low-bg text-risk-low',
    Icon: CheckCircle2,
  },
  info: {
    classes: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300',
    Icon: Info,
  },
};

export function Alert({ variant = 'error', children }: { variant?: AlertVariant; children: ReactNode }) {
  const { classes, Icon } = VARIANT_STYLES[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm', classes)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
