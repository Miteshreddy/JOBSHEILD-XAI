import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RiskCategory } from '@/types';
import { cn } from '@/lib/cn';

const RISK_BORDER: Record<RiskCategory, string> = {
  Low: 'border-l-risk-low',
  Medium: 'border-l-risk-medium',
  High: 'border-l-risk-high',
  Critical: 'border-l-risk-critical',
};

export function RecommendationCard({
  riskCategory,
  recommendations,
  warnings,
}: {
  riskCategory: RiskCategory;
  recommendations: string[];
  warnings: string[];
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900',
        RISK_BORDER[riskCategory]
      )}
    >
      <h3 className="font-semibold text-slate-900 dark:text-white">Recommendation</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" aria-hidden="true" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>

      {warnings.length > 0 && (
        <>
          <h4 className="mt-5 flex items-center gap-1.5 font-semibold text-risk-critical">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Warnings
          </h4>
          <ul className="mt-2.5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {warnings.map((warning, i) => (
              <li key={i} className="flex gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" aria-hidden="true" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
