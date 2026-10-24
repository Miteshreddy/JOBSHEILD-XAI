import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 text-center">
      <div className="bg-grid mask-radial absolute inset-0 -z-10" aria-hidden />
      <div>
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">This page doesn’t exist.</h1>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">The link may be broken, or the page may have moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink to="/">Go home</ButtonLink>
          <ButtonLink to="/analyze" variant="secondary">Check a job</ButtonLink>
        </div>
      </div>
    </div>
  );
}
