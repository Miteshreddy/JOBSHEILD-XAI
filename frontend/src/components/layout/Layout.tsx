import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from './Navbar';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a frame so lazily-loaded sections exist before scrolling to them.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);
  return null;
}

function Footer() {
  const cols = [
    { title: 'Product', links: [{ to: '/analyze', label: 'Check a job' }, { to: '/#how', label: 'How it works' }, { to: '/#faq', label: 'FAQ' }] },
    { title: 'Account', links: [{ to: '/login', label: 'Sign in' }, { to: '/register', label: 'Create account' }, { to: '/history', label: 'History' }] },
    { title: 'Stay safe', links: [{ to: '/#faq', label: 'Common job scams' }, { to: '/settings', label: 'Appearance' }] },
  ];
  return (
    <footer className="border-t border-line">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
            Verify any job offer before you share your details, pay a fee, or quit your current role.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-[13px] font-medium text-fg">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-line py-6 text-[13px] text-fg-subtle sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} JobShield. Runs on your own machine — postings never leave it except for public lookups.</p>
        <p>Results are guidance, not a guarantee. Always verify through official channels.</p>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollManager />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, isInitializing } = useAuthStore();
  const location = useLocation();
  if (isInitializing) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
