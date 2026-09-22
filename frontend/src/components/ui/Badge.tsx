import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: BadgeSize;
}

/** Generic pill primitive — pass color classes in via `className`. Used
 * directly for neutral tags (e.g. input-type labels) and as the base for
 * domain badges like RiskBadge, which owns its own color mapping. */
export function Badge({ size = 'md', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  );
}
