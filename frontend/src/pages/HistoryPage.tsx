import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, Image as ImageIcon, Inbox, Link2, Type } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { listHistory } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';
import type { InputType, RiskCategory } from '@/types';

const RISK_OPTIONS: (RiskCategory | 'All')[] = ['All', 'Low', 'Medium', 'High', 'Critical'];
const PAGE_SIZE = 20;

const INPUT_ICON: Record<InputType, typeof Type> = {
  text: Type,
  url: Link2,
  pdf: FileText,
  image: ImageIcon,
};

export function HistoryPage() {
  const [riskFilter, setRiskFilter] = useState<RiskCategory | 'All'>('All');
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ['history', riskFilter, page],
    queryFn: () =>
      listHistory({
        ...(riskFilter !== 'All' && { riskCategory: riskFilter }),
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  function handleRiskFilterChange(value: RiskCategory | 'All') {
    setRiskFilter(value);
    setPage(1);
  }

  const analyses = data?.analyses ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis History</h1>
        <Select
          value={riskFilter}
          onChange={(e) => handleRiskFilterChange(e.target.value as RiskCategory | 'All')}
        >
          {RISK_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'All' ? 'All risk levels' : `${opt} risk`}
            </option>
          ))}
        </Select>
      </div>

      {isPending && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </Card>
          ))}
        </div>
      )}
      {error && <Alert variant="error">{getApiErrorMessage(error)}</Alert>}

      {!isPending && !error && analyses.length === 0 && (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No analyses yet"
            description="Run your first check to see it appear here."
            action={
              <Link to="/analyze" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Analyze another job posting
              </Link>
            }
          />
        </Card>
      )}

      {!isPending && !error && analyses.length > 0 && (
        <>
          <div className="animate-fade-in-up space-y-3">
            {analyses.map((a) => {
              const Icon = INPUT_ICON[a.inputType];
              return (
                <Link key={a._id} to={`/analyze/${a._id}`}>
                  <Card className="flex items-center justify-between gap-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft-md">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">
                          {a.sourceReference.length > 80 ? a.sourceReference.slice(0, 80) + '...' : a.sourceReference}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {a.inputType.toUpperCase()} • {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RiskBadge category={a.riskCategory} />
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          {pagination && (
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} isFetching={isFetching} />
          )}
        </>
      )}
    </div>
  );
}
