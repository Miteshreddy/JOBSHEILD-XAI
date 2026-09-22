import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { AnalysisDashboard } from '@/components/dashboard/AnalysisDashboard';
import { getAnalysisById } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        </Card>
        <Card>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        </Card>
      </div>
      <Card>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-16 w-full" />
      </Card>
    </div>
  );
}

/** UC-5/UC-6: reopen a specific past analysis, or view one just submitted —
 * every completed analysis lives at this URL so refresh/back/bookmark all
 * behave naturally instead of depending on in-memory component state. */
export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isFresh = Boolean((location.state as { fresh?: boolean } | null)?.fresh);

  const {
    data: analysis,
    isPending,
    error,
  } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysisById(id as string),
    enabled: Boolean(id),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isFresh ? (
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analysis Result</h1>
        ) : (
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to history
          </Link>
        )}
        {isFresh && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/analyze')}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Analyze another
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/history')}>
              <History className="h-4 w-4" aria-hidden="true" />
              View history
            </Button>
          </div>
        )}
      </div>
      {!isFresh && <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analysis Details</h1>}

      {error && <Alert variant="error">{getApiErrorMessage(error, 'Could not load this analysis.')}</Alert>}
      {isPending && !error && <DashboardSkeleton />}
      {analysis && <AnalysisDashboard analysis={analysis} />}
    </div>
  );
}
