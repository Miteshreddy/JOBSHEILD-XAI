import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User as UserIcon, LayoutDashboard, Menu, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/cn';
import { BorderBeam } from '@/components/ui/BorderBeam';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const NAV_ITEMS = [
  { label: 'Home', to: '/', end: true },
  { label: 'Analyze Job', to: '/analyze', end: false },
  { label: 'How It Works', to: '/about', end: false },
];

export function Navbar() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    function handleScroll() {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const isScrolled = y > 20;
          const isHidden = y > lastYRef.current && y > 100;

          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          setHidden((prev) => (prev !== isHidden ? isHidden : prev));
          lastYRef.current = y;
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await apiLogout().catch(() => {});
    clearSession();
    toast.success('Logged out');
    navigate('/');
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
      isActive
        ? 'text-violet-300'
        : 'text-slate-400 hover:text-white'
    );

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none"
      >
        <div
          className={cn(
            'w-full max-w-5xl rounded-2xl transition-all duration-300 pointer-events-auto',
            scrolled
              ? 'bg-[#090815]/85 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] border border-white/10'
              : 'bg-[#090815]/60 backdrop-blur-xl border border-white/[0.08]'
          )}
        >
          <nav className="flex items-center justify-between gap-4 px-5 py-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                JobShield<span className="text-violet-400">-XAI</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-400"
                          style={{ boxShadow: '0 0 10px rgba(168,85,247,0.9)' }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              {user && (
                <NavLink to="/history" end={false} className={navLinkClass}>
                  History
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" end={false} className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-500/40 text-sm font-bold text-violet-300 hover:border-violet-500/80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      style={{ boxShadow: '0 0 12px rgba(168,85,247,0.3)' }}
                    >
                      {initials(user.name)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0e0c1c] border-white/10 text-slate-200">
                    <DropdownMenuLabel className="text-slate-300">{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="text-slate-400 hover:text-white">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="text-slate-400 hover:text-white">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onSelect={handleLogout} className="text-slate-400 hover:text-white">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/analyze"
                    className="relative group inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300"
                  >
                    <BorderBeam size={100} duration={6} colorFrom="#ffffff" colorTo="#c084fc" />
                    <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                    <span>Scan Free</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-4 right-4 z-40 bg-[#090815]/95 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {user && (
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  History
                </NavLink>
              )}
              <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Log out
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/analyze"
                      className="text-center py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    >
                      Scan Job Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
