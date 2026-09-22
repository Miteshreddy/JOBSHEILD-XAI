import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { applyTheme, useThemeStore } from '@/store/themeStore';
import { me, refresh } from '@/api/auth';

const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage').then((m) => ({ default: m.AnalysisPage })));
const AnalysisDetailPage = lazy(() => import('@/pages/AnalysisDetailPage').then((m) => ({ default: m.AnalysisDetailPage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 py-16">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
        <div className="absolute inset-1.5 rounded-full border-2 border-cyan-500/20 border-b-cyan-400 animate-spin [animation-direction:reverse]" />
      </div>
      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
        JobShield
      </span>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function App() {
  const { setSession, setInitializing } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    // Keeps a "system" choice live if the OS preference changes while the
    // app is open (a manual "light"/"dark" choice is unaffected by this).
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange() {
      if (useThemeStore.getState().theme === 'system') applyTheme('system');
    }
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Silent session restore: the refresh token lives in an httpOnly cookie,
    // invisible to JS, so a page reload otherwise looks logged-out even
    // though the cookie is still valid.
    async function restoreSession() {
      try {
        const { accessToken } = await refresh();
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await me();
        setSession(user, accessToken);
      } catch {
        // No valid refresh cookie — genuinely logged out, nothing to do.
      } finally {
        setInitializing(false);
      }
    }
    restoreSession();
  }, [setSession, setInitializing]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster theme={theme} position="top-right" richColors closeButton />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/analyze" element={<AnalysisPage />} />
              {/* Not wrapped in ProtectedRoute: the backend allows anyone holding
                  the id to view an anonymous (no-account) analysis (FR-11.3);
                  it 403s server-side for analyses owned by a different account. */}
              <Route path="/analyze/:id" element={<AnalysisDetailPage />} />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Navigate to="/analyze" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
