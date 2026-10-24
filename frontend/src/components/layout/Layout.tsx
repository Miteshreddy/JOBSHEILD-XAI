import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
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
    { title: 'Product', links: [{ to: '/analyze', label: 'Check a job' }, { to: '/#features', label: 'Signals' }, { to: '/#how', label: 'How it works' }, { to: '/#transparency', label: 'Accuracy' }] },
    { title: 'Account', links: [{ to: '/login', label: 'Sign in' }, { to: '/register', label: 'Create account' }, { to: '/history', label: 'History' }, { to: '/settings', label: 'Appearance' }] },
    { title: 'Stay safe', links: [{ to: '/#faq', label: 'FAQ' }, { to: '/#how', label: 'Common job scams' }] },
  ];
  return (
    <footer className="container-page">
      <div className="h-px bg-line" />
      <div className="grid gap-14 py-16 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-10">
          <Link to="/" className="flex items-center gap-3 text-[32px] tracking-[-0.03em]">
            <LogoMark className="size-9" /> JobShield
          </Link>
          <div>
            <Link to="/analyze" className="inline-flex items-center gap-1.5 border-b border-fg pb-1 text-[15px]">
              Check a job <ArrowUpRight className="size-4" />
            </Link>
            <p className="mt-6 text-[14px] text-fg-muted">© {new Date().getFullYear()} JobShield · Runs on your own machine</p>
            <p className="mt-1 text-[13px] text-fg-subtle">Results are guidance, not a guarantee. Always verify through official channels.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[14px] text-fg-muted">{c.title}</p>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[15px] transition-opacity hover:opacity-60">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
