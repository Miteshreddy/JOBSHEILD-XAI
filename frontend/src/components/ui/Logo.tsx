import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'rgb(var(--accent))' }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--accent) / 0.55)' }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lm-g)" />
      <path
        d="M16 6.5 9 9.4v5.9c0 4.5 3 8.4 7 9.7 4-1.3 7-5.2 7-9.7V9.4L16 6.5Z"
        fill="none"
        style={{ stroke: 'rgb(var(--accent-fg))' }}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m12.6 15.8 2.4 2.4 4.6-4.8" fill="none" style={{ stroke: 'rgb(var(--accent-fg))' }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5 font-semibold tracking-tight text-fg', className)} aria-label="JobShield home">
      <LogoMark />
      <span className="text-[17px]">JobShield</span>
    </Link>
  );
}
