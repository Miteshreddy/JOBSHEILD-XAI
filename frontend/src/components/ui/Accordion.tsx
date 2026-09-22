import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = ({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item
    className={cn('rounded-lg border border-slate-200 dark:border-slate-700', className)}
    {...props}
  />
);

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'group flex w-full flex-1 items-center justify-between px-4 py-3 text-left outline-none',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        'overflow-hidden border-t border-slate-200 dark:border-slate-700',
        'data-[state=open]:animate-fade-in',
        className
      )}
      {...props}
    >
      <div className="px-4 py-4">{children}</div>
    </AccordionPrimitive.Content>
  );
}
