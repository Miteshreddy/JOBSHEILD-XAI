import { Flame } from 'lucide-react';

const SEVERITY_BAND_COLOR: Record<string, string> = {
  Low: 'bg-risk-low',
  Medium: 'bg-risk-medium',
  High: 'bg-risk-high',
  Critical: 'bg-risk-critical',
};

function bandForScore(score: number): string {
  if (score <= 20) return 'Low';
  if (score <= 40) return 'Medium';
  if (score <= 70) return 'High';
  return 'Critical';
}

const FLAG_LABELS: Record<string, string> = {
  registration_fee_requested: 'Registration fee requested',
  unrealistic_salary: 'Unrealistic salary',
  missing_company_profile: 'Missing company profile',
  whatsapp_only_contact: 'WhatsApp-only contact',
  urgent_or_spam_wording: 'Urgent / spam wording',
  unverified_website_or_email: 'Unverified website or email',
};

export function SeverityMeter({ score, flags }: { score: number; flags: string[] }) {
  const band = bandForScore(score);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Fraud Severity</span>
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{score}/100</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${SEVERITY_BAND_COLOR[band]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{band} severity</p>
      {flags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {flags.map((flag) => (
            <li
              key={flag}
              className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Flame className="h-3 w-3 text-risk-high" aria-hidden="true" />
              {FLAG_LABELS[flag] ?? flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
