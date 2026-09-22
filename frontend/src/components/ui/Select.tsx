import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block">
        <select
          ref={ref}
          className={cn(
            'h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm text-slate-900 outline-none transition-colors',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';
