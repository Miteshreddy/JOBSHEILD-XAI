import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-subtle transition-[border,box-shadow] outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-danger';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, FieldProps>(function Input(
  { label, error, icon, trailing, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-fg-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(control, 'h-11', icon && 'pl-10', trailing && 'pr-11', className)}
          {...props}
        />
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  function Textarea({ label, className, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-[13px] font-medium text-fg-muted">
            {label}
          </label>
        )}
        <textarea ref={ref} id={fieldId} className={cn(control, 'resize-none py-3 leading-relaxed', className)} {...props} />
      </div>
    );
  }
);
