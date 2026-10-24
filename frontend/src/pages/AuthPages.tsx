import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login, register } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { LogoMark } from '@/components/ui/Logo';
import { useAuthStore } from '@/store/authStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid mask-radial absolute inset-0 -z-10" aria-hidden />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-accent/15 blur-[110px]" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[400px]">
        <div className="text-center">
          <LogoMark className="mx-auto size-10" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-[15px] text-fg-muted">{subtitle}</p>
        </div>
        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-xl shadow-black/5 sm:p-7">{children}</div>
        <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>
      </motion.div>
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="rounded-lg p-1.5 text-fg-subtle hover:text-fg" aria-label={shown ? 'Hide password' : 'Show password'}>
      {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export function LoginPage() {
  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/analyze';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      setSession(res.user, res.accessToken);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your check history." footer={<>New here? <Link to="/register" className="font-medium text-accent hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Input label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="size-4" />} placeholder="you@example.com" />
        <Input
          label="Password"
          name="password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="size-4" />}
          trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />}
          placeholder="••••••••"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/analyze" replace />;

  const strength = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/].filter((r) => r.test(form.password)).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError('Enter your name.');
    if (!EMAIL_RE.test(form.email.trim())) return setError('Enter a valid email address.');
    if (strength < 4) return setError('Use at least 8 characters with upper- and lower-case letters and a number.');
    setLoading(true);
    try {
      const res = await register(form.name.trim(), form.email.trim(), form.password);
      setSession(res.user, res.accessToken);
      toast.success('Account created');
      navigate('/analyze', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title="Create your account" subtitle="Keep a history of every job you check." footer={<>Already have an account? <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Input label="Name" name="name" autoComplete="name" value={form.name} onChange={set('name')} icon={<UserIcon className="size-4" />} placeholder="Alex Morgan" />
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} icon={<Mail className="size-4" />} placeholder="you@example.com" />
        <div>
          <Input
            label="Password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            icon={<Lock className="size-4" />}
            trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />}
            placeholder="At least 8 characters"
          />
          <div className="mt-2 flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? (strength < 3 ? 'bg-warn' : 'bg-safe') : 'bg-surface-2'}`} />
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
