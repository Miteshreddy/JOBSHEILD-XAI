import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-500',
        'transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        'data-[state=active]:bg-white data-[state=active]:text-brand-600 data-[state=active]:shadow-soft',
        'dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white',
        'outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        className
      )}
      {...props}
    />
  );
}
