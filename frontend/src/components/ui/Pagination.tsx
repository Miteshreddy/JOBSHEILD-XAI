import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pagination({
  page,
  pages,
  onPageChange,
  isFetching,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}) {
  if (pages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </Button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Page {page} of {pages}
        {isFetching && <span className="ml-1.5 animate-pulse">•</span>}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
