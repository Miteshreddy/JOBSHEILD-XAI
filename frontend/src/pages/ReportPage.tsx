import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Type,
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Copy,
  Globe,
  Info,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getAnalysisById } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';
import { Alert, Badge, Skeleton } from '@/components/ui/Badge';
import { ButtonLink, buttonClasses } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { cn } from '@/lib/cn';
import { VERDICT_COPY } from '@/lib/verdict';
import type { Analysis, CheckStatus, DecisionFactor, LanguageExplanation } from '@/types';

const PLATFORM_TYPE_COPY: Record<string, string> = {
  official: 'Employer’s official website',
  job_board: 'Job board',
  ats: 'Employer hiring portal',
  anonymous: 'Anonymous host',
  messaging: 'Messaging app',
  web: 'Website',
  none: 'Submitted directly',
};

const INPUT_COPY: Record<string, string> = { url: 'Link', text: 'Pasted text', image: 'Screenshot', pdf: 'PDF' };

function Panel({ title, icon, children, className, aside }: { title: string; icon?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn('rounded-3xl border border-line bg-surface p-6 sm:p-7', className)}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          {icon && <span className="text-accent">{icon}</span>}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

function CheckIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return <CircleCheck className="size-[18px] shrink-0 text-safe" aria-label="Passed" />;
  if (status === 'warn') return <CircleAlert className="size-[18px] shrink-0 text-warn" aria-label="Warning" />;
  if (status === 'fail') return <CircleX className="size-[18px] shrink-0 text-danger" aria-label="Failed" />;
  return <Info className="size-[18px] shrink-0 text-fg-subtle" aria-label="Info" />;
}

function FactorBars({ factors }: { factors: DecisionFactor[] }) {
  const max = Math.max(1, ...factors.map((f) => Math.abs(f.impact)));
  return (
    <div className="space-y-3.5">
      <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.1em] text-fg-subtle">
        <span className="text-safe">← Points to legitimate</span>
        <span className="text-danger">Points to scam →</span>
      </div>
      {factors.map((f, i) => {
        const width = `${(Math.abs(f.impact) / max) * 50}%`;
        const scam = f.impact > 0;
        return (
          <div key={`${f.label}-${i}`} className="group">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[14px] font-medium text-fg">{f.label}</p>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-surface-2">
              <div className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-line-strong" aria-hidden />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={cn('absolute top-0 h-2 rounded-full', scam ? 'left-1/2 bg-danger' : 'right-1/2 bg-safe')}
              />
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{f.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

function WordAttribution({ explanation }: { explanation: LanguageExplanation }) {
  const words = explanation.words.slice(0, 10);
  const max = Math.max(0.0001, ...words.map((w) => Math.abs(w.weight)));
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div>
      {explanation.method === 'shap' && explanation.baseValue !== null && explanation.outputValue !== null && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
          <span className="rounded-lg border border-line bg-bg-subtle px-2.5 py-1">
            Baseline <span className="font-semibold text-fg tabular-nums">{pct(explanation.baseValue)}</span>
          </span>
          <ArrowRight className="size-3.5 text-fg-subtle" />
          <span className="rounded-lg border border-line bg-bg-subtle px-2.5 py-1">
            This posting <span className="font-semibold text-fg tabular-nums">{pct(explanation.outputValue)}</span> scam-like
          </span>
        </div>
      )}
      <ul className="space-y-2.5">
        {words.map((w, i) => {
          const scam = w.weight > 0;
          return (
            <li key={w.term} className="grid grid-cols-[minmax(80px,140px)_1fr_56px] items-center gap-3 text-[13px]">
              <span className="truncate font-medium text-fg">{w.term}</span>
              <div className="relative h-2 rounded-full bg-surface-2">
                <span className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-line-strong" aria-hidden />
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.abs(w.weight) / max) * 50}%` }}
                  transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('absolute top-0 h-2 rounded-full', scam ? 'left-1/2 bg-danger' : 'right-1/2 bg-safe')}
                />
              </div>
              <span className={cn('text-right tabular-nums', scam ? 'text-danger' : 'text-safe')}>
                {scam ? '+' : '−'}
                {Math.abs(w.weight * 100).toFixed(1)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-fg-subtle">
        {explanation.method === 'shap'
          ? 'Contributions are Shapley values in percentage points: starting from the baseline (the score with every word hidden), they add up exactly to this posting’s language score.'
          : 'Approximate word contributions to the language score.'}
      </p>
    </div>
  );
}

function HighlightedText({ text, highlights }: { text: string; highlights: Analysis['highlights'] }) {
  const parts = useMemo(() => {
    const terms = highlights.filter((h) => h.term.length > 2).slice(0, 12);
    if (!terms.length) return [{ t: text, w: 0 }];
    const escaped = terms.map((h) => h.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const weights = new Map(terms.map((h) => [h.term.toLowerCase(), h.weight]));
    return text.split(re).map((t) => ({ t, w: weights.get(t.toLowerCase()) ?? 0 }));
  }, [text, highlights]);
  return (
    <p className="whitespace-pre-wrap text-[14px] leading-7 text-fg-muted">
      {parts.map((p, i) =>
        p.w === 0 ? (
          <span key={i}>{p.t}</span>
        ) : (
          <mark key={i} className={cn('rounded px-0.5 text-fg', p.w > 0 ? 'bg-danger/15' : 'bg-safe/15')}>
            {p.t}
          </mark>
        )
      )}
    </p>
  );
}

function ReportSkeleton() {
  return (
    <div className="container-page max-w-6xl space-y-4 py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}

function hostname(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ReportView({ analysis }: { analysis: Analysis }) {
  const [showText, setShowText] = useState(false);
  const v = VERDICT_COPY[analysis.verdict];
  const VerdictIcon = v.icon;
  const { company, source, signals } = analysis;
  const passed = analysis.checks.filter((c) => c.status === 'pass').length;
  const failed = analysis.checks.filter((c) => c.status === 'fail').length;

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }

  return (
    <div className="container-page max-w-6xl py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/analyze" className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
          <ArrowLeft className="size-4" /> Check another job
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-fg-subtle">{new Date(analysis.createdAt).toLocaleString()}</span>
          <button onClick={share} className={buttonClasses('secondary', 'sm')}>
            <Copy className="size-3.5" /> Copy link
          </button>
        </div>
      </div>

      {/* Verdict */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden border bg-surface p-6 sm:p-9',
          v.tone === 'safe' ? 'border-safe/25' : v.tone === 'warn' ? 'border-warn/25' : 'border-danger/25'
        )}
      >
        <div
          className={cn('pointer-events-none absolute -right-24 -top-24 size-80 rounded-full blur-[90px]', v.tone === 'safe' ? 'bg-safe/15' : v.tone === 'warn' ? 'bg-warn/15' : 'bg-danger/15')}
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
          <ScoreRing score={analysis.legitimacyScore} verdict={analysis.verdict} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={v.tone} icon={<VerdictIcon className="size-3.5" />}>
                {v.label}
              </Badge>
              <Badge tone="neutral">{analysis.confidence[0].toUpperCase() + analysis.confidence.slice(1)} confidence</Badge>
              <Badge tone="neutral">{INPUT_COPY[analysis.inputType]}</Badge>
            </div>
            <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-[28px]">{analysis.summary}</h1>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg-subtle p-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface ring-1 ring-line">
                  {company.logo ? <img src={company.logo} alt="" className="size-7" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /> : <Building2 className="size-5 text-fg-subtle" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {company.name ?? 'Employer not identified'}
                    {company.verified && <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified employer record" />}
                  </p>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-[13px] text-accent hover:underline">
                      {hostname(company.website)} · {company.verified ? 'official website' : 'likely website'} <ArrowUpRight className="size-3" />
                    </a>
                  ) : (
                    <p className="text-[13px] text-fg-subtle">No official website found</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg-subtle p-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface ring-1 ring-line">
                  <Globe className="size-5 text-fg-subtle" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{source.platform ?? PLATFORM_TYPE_COPY[source.platformType] ?? 'Unknown source'}</p>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 truncate text-[13px] text-fg-muted hover:text-fg">
                      <span className="truncate">{PLATFORM_TYPE_COPY[source.platformType]} · {source.domain}</span> <ArrowUpRight className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[13px] text-fg-subtle">{PLATFORM_TYPE_COPY[source.platformType] ?? 'Submitted directly'}</p>
                  )}
                </div>
              </div>
            </div>

            {analysis.verdict === 'legitimate' && company.website && (
              <p className="mt-4 flex items-start gap-2 text-[14px] text-fg-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  Apply only through{' '}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                    {hostname(company.website)}
                  </a>{' '}
                  {source.platform && source.platformType === 'job_board' ? `or the ${source.platform} listing` : ''} — never via links sent in private messages.
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
          <Signal label="Language analysis" value={signals.language.available && signals.language.score !== null ? `${Math.round(signals.language.score * 100)}% scam-like` : 'Unavailable'} />
          <Signal
            label="Reasoning engine"
            value={signals.reasoning.available && signals.reasoning.verdict ? `${VERDICT_COPY[signals.reasoning.verdict].label} · ${signals.reasoning.confidence}%` : 'Offline — rules only'}
          />
          <Signal label="Verification" value={`${passed} passed · ${failed} failed · ${analysis.checks.length} checks`} />
        </div>
      </motion.section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="How we reached this verdict" icon={<Sparkles className="size-4" />}>
            <ol className="relative space-y-5 pl-9">
              <span className="absolute bottom-2 left-[13px] top-2 w-px bg-line-strong" aria-hidden />
              {analysis.reasoning.map((step, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="relative text-[15px] leading-relaxed text-fg">
                  <span className="absolute -left-9 top-0.5 flex size-[27px] items-center justify-center rounded-full border border-line-strong bg-surface text-[12px] font-semibold text-fg-muted">{i + 1}</span>
                  {step}
                </motion.li>
              ))}
            </ol>
          </Panel>

          {analysis.factors.length > 0 && (
            <Panel title="What weighed on the decision" icon={<ListChecks className="size-4" />}>
              <FactorBars factors={analysis.factors} />
            </Panel>
          )}

          {analysis.explanation && analysis.explanation.words.length > 0 && (
            <Panel title="Which words moved the language score" icon={<Type className="size-4" />}>
              <WordAttribution explanation={analysis.explanation} />
            </Panel>
          )}

          <Panel
            title="The posting"
            aside={
              <button onClick={() => setShowText((s) => !s)} className="inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg" aria-expanded={showText}>
                {showText ? 'Hide' : 'Show'} text <ChevronDown className={cn('size-4 transition-transform', showText && 'rotate-180')} />
              </button>
            }
          >
            <p className="text-[13px] text-fg-muted">
              {analysis.highlights.length > 0 ? 'Influential words are highlighted — red pushed toward scam, green toward legitimate.' : 'The text that was analysed.'}
            </p>
            {showText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 max-h-[420px] overflow-y-auto rounded-2xl border border-line bg-bg-subtle p-4">
                <HighlightedText text={analysis.extractedText} highlights={analysis.highlights} />
              </motion.div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Verification checks" icon={<BadgeCheck className="size-4" />}>
            <ul className="space-y-4">
              {analysis.checks.map((c) => (
                <li key={c.id + c.label} className="flex gap-3">
                  <CheckIcon status={c.status} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{c.label}</p>
                    <p className="mt-0.5 break-words text-[13px] leading-relaxed text-fg-muted">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {(analysis.redFlags.length > 0 || analysis.greenFlags.length > 0) && (
            <Panel title="Signals found">
              {analysis.redFlags.length > 0 && (
                <ul className="space-y-2">
                  {analysis.redFlags.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[14px] text-fg-muted">
                      <CircleX className="mt-0.5 size-4 shrink-0 text-danger" /> {f}
                    </li>
                  ))}
                </ul>
              )}
              {analysis.greenFlags.length > 0 && (
                <ul className={cn('space-y-2', analysis.redFlags.length > 0 && 'mt-4 border-t border-line pt-4')}>
                  {analysis.greenFlags.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[14px] text-fg-muted">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-safe" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel title="What to do next" className={cn(v.tone === 'danger' && 'border-danger/25')}>
            <ul className="space-y-3">
              {analysis.advice.map((a, i) => (
                <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-fg-muted">
                  <span className="mt-[3px] flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] text-fg-subtle">This verdict is guidance based on the evidence above, not a guarantee. When in doubt, contact the employer through their official website.</p>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-[14px] font-medium">{value}</p>
    </div>
  );
}

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isPending } = useQuery({ queryKey: ['analysis', id], queryFn: () => getAnalysisById(id!), enabled: !!id });
  if (isPending) return <ReportSkeleton />;
  if (error || !data)
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <Alert>{getApiErrorMessage(error, 'This report could not be loaded.')}</Alert>
        <ButtonLink to="/analyze" variant="secondary" className="mt-6">
          Check a job
        </ButtonLink>
      </div>
    );
  return <ReportView analysis={data} />;
}
