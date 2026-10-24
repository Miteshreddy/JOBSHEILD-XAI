import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { me, refresh } from '@/api/auth';
import { Layout, ProtectedRoute } from '@/components/layout/Layout';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { applyTheme, resolvedIsDark, useThemeStore } from '@/store/themeStore';

const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AnalyzePage = lazy(() => import('@/pages/AnalyzePage').then((m) => ({ default: m.AnalyzePage })));
const ReportPage = lazy(() => import('@/pages/ReportPage').then((m) => ({ default: m.ReportPage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const LoginPage = lazy(() => import('@/pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** Old /analyze/:id links keep working. */
function LegacyReportRedirect() {
  const { id } = useParams();
  return <Navigate to={`/report/${id}`} replace />;
}

export default function App() {
  const { setSession, setInitializing } = useAuthStore();
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const { mode: m, accent } = useThemeStore.getState();
      if (m === 'system') applyTheme('system', accent);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // The refresh token is an httpOnly cookie; one silent refresh per page
    // load restores the session.
    async function restoreSession() {
      try {
        const { accessToken } = await refresh();
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await me();
        setSession(user, accessToken);
      } catch {
        // Not signed in.
      } finally {
        setInitializing(false);
      }
    }
    restoreSession();
  }, [setSession, setInitializing]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <Toaster theme={resolvedIsDark(mode) ? 'dark' : 'light'} position="top-center" richColors closeButton />
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/report/:id" element={<ReportPage />} />
                <Route path="/analyze/:id" element={<LegacyReportRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
                <Route path="/about" element={<Navigate to="/#how" replace />} />
                <Route path="/dashboard" element={<Navigate to="/analyze" replace />} />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
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
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
