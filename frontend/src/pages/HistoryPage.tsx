import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowRight, Building2, ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listHistory } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';
import { Alert, Badge, Skeleton } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageIntro } from '@/components/landing/Effects';
import { cn } from '@/lib/cn';
import { VERDICT_COPY } from '@/lib/verdict';
import type { Verdict } from '@/types';

const FILTERS: { id: Verdict | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'legitimate', label: 'Legitimate' },
  { id: 'suspicious', label: 'Needs verification' },
  { id: 'fraudulent', label: 'Likely scam' },
];
const PAGE_SIZE = 10;
const scoreColor = { safe: 'text-safe', warn: 'text-warn', danger: 'text-danger' } as const;

export function HistoryPage() {
  const [filter, setFilter] = useState<Verdict | 'all'>('all');
  const [page, setPage] = useState(1);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ['history', filter, page],
    queryFn: () => listHistory({ verdict: filter === 'all' ? undefined : filter, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <PageIntro label="History" title="Every job you’ve checked" sub="saved while you were signed in">
        <ButtonLink to="/analyze">Check a job</ButtonLink>
      </PageIntro>

      <div className="mt-8 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by verdict">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
            className={cn('rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors', filter === f.id ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line text-fg-muted hover:text-fg')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={cn('mt-6 space-y-2.5 transition-opacity', isFetching && !isPending && 'opacity-60')}>
        {error && <Alert>{getApiErrorMessage(error)}</Alert>}
        {isPending && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-2xl" />)}
        {data && data.analyses.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
            <FileSearch className="mx-auto size-8 text-fg-subtle" />
            <p className="mt-4 font-medium">{filter === 'all' ? 'No checks yet' : 'Nothing in this category'}</p>
            <p className="mt-1 text-sm text-fg-muted">Checks you run while signed in will appear here.</p>
          </div>
        )}
        {data?.analyses.map((a, i) => {
          const v = VERDICT_COPY[a.verdict] ?? VERDICT_COPY.suspicious;
          return (
            <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/report/${a._id}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-bg-subtle">
                <span className={cn('w-12 text-center text-2xl font-semibold tabular-nums', scoreColor[v.tone])}>{a.legitimacyScore ?? '–'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      <Building2 className="size-3.5 text-fg-subtle" />
                      {a.company?.name ?? 'Unknown employer'}
                    </p>
                    <Badge tone={v.tone}>{v.label}</Badge>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-fg-muted">{a.summary || a.sourceReference}</p>
                </div>
                <div className="hidden text-right text-[12px] text-fg-subtle sm:block">
                  <p>{a.source?.platform ?? a.inputType}</p>
                  <p>{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <ArrowRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft className="size-4" />}>
            Previous
          </Button>
          <span className="text-[13px] text-fg-muted">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
