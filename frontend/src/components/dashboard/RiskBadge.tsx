import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { RiskCategory } from '@/types';
import { Badge, type BadgeSize } from '@/components/ui/Badge';

// IR-3: risk categories are color-coded consistently across the app. The
// `text-risk-*` class names are asserted verbatim in RiskBadge.test.tsx —
// keep them as literal Tailwind classes here, not composed indirectly.
const RISK_STYLES: Record<RiskCategory, string> = {
  Low: 'bg-risk-low-bg text-risk-low',
  Medium: 'bg-risk-medium-bg text-risk-medium',
  High: 'bg-risk-high-bg text-risk-high',
  Critical: 'bg-risk-critical-bg text-risk-critical',
};

const RISK_ICON: Record<RiskCategory, typeof ShieldCheck> = {
  Low: ShieldCheck,
  Medium: ShieldQuestion,
  High: ShieldAlert,
  Critical: AlertTriangle,
};

export function RiskBadge({ category, size = 'md' }: { category: RiskCategory; size?: BadgeSize }) {
  const Icon = RISK_ICON[category];
  return (
    <Badge size={size} className={RISK_STYLES[category]}>
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {category} Risk
    </Badge>
  );
}
