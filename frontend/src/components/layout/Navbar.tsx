import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { History, LogOut, Menu, Settings, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/api/auth';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { ThemePicker } from './ThemePicker';

const LINKS = [
  { to: '/#features', label: 'Product' },
  { to: '/#how', label: 'How it works' },
  { to: '/#faq', label: 'FAQ' },
];

function UserMenu() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  if (!user) return null;

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Clearing local state is what matters; the cookie expires on its own.
    }
    clearSession();
    toast.success('Signed out');
    navigate('/');
  }

  const item = 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg-muted outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg';
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-[13px] font-semibold text-accent ring-1 ring-accent/30 transition hover:ring-accent/60"
        aria-label="Account menu"
      >
        {user.name.slice(0, 1).toUpperCase()}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-60 rounded-2xl border border-line-strong bg-surface p-1.5 shadow-2xl shadow-black/20">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-fg">{user.name}</p>
            <p className="truncate text-[12px] text-fg-subtle">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={item} onSelect={() => navigate('/history')}>
            <History className="size-4" /> History
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => navigate('/settings')}>
            <Settings className="size-4" /> Settings
          </DropdownMenu.Item>
          {user.role === 'admin' && (
            <DropdownMenu.Item className={item} onSelect={() => navigate('/admin')}>
              <Shield className="size-4" /> Admin
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={item} onSelect={handleLogout}>
            <LogOut className="size-4" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function Navbar() {
  const { user, isInitializing } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8));
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className={cn('sticky top-0 z-40 transition-[background,border] duration-300', scrolled || open ? 'glass border-b border-line' : 'border-b border-transparent')}>
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
                {l.label}
              </Link>
            ))}
            {user && (
              <NavLink to="/history" className={({ isActive }) => cn('rounded-lg px-3 py-1.5 text-sm transition-colors hover:text-fg', isActive ? 'text-fg' : 'text-fg-muted')}>
                History
              </NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemePicker />
          {!isInitializing && !user && (
            <Link to="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg sm:block">
              Sign in
            </Link>
          )}
          {user ? <UserMenu /> : null}
          <ButtonLink to="/analyze" size="sm" className="hidden sm:inline-flex">
            Check a job
          </ButtonLink>
          <button
            className="flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">
                  {l.label}
                </Link>
              ))}
              {user ? (
                <Link to="/history" className="rounded-lg px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">History</Link>
              ) : (
                <Link to="/login" className="rounded-lg px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">Sign in</Link>
              )}
              <ButtonLink to="/analyze" className="mt-2">Check a job</ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
