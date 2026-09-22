import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react';
import type { TrustBand } from '@/types';

const BAND_STYLE: Record<TrustBand, { bar: string; icon: typeof ShieldCheck; text: string }> = {
  'Highly Trustworthy': { bar: 'bg-risk-low', icon: ShieldCheck, text: 'text-risk-low' },
  'Moderately Trustworthy': { bar: 'bg-risk-medium', icon: ShieldQuestion, text: 'text-risk-medium' },
  Suspicious: { bar: 'bg-risk-high', icon: ShieldAlert, text: 'text-risk-high' },
  'Very Low Trust': { bar: 'bg-risk-critical', icon: ShieldX, text: 'text-risk-critical' },
};

export function TrustMeter({ score, band }: { score: number; band: TrustBand }) {
  const { bar, icon: Icon, text } = BAND_STYLE[band];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Trust Score</span>
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{score}/100</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${text}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {band}
      </p>
    </div>
  );
}
