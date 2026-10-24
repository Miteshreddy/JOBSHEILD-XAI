import { SignalField, TwoTone } from '@/components/landing/Effects';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 text-center">
      <div className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" aria-hidden>
        <SignalField />
      </div>
      <div>
        <p className="font-mono text-sm text-fg-muted">404</p>
        <TwoTone as="h1" title="This page doesn’t exist." sub="The link may be broken, or the page may have moved." className="mt-4 text-[32px] leading-[1.2] sm:text-[44px]" />
        <div className="mt-10 flex justify-center gap-3">
          <ButtonLink to="/">Go home</ButtonLink>
          <ButtonLink to="/analyze" variant="secondary">Check a job</ButtonLink>
        </div>
      </div>
    </div>
  );
}
