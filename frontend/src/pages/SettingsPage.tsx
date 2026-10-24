import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logoutAll } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemeControls } from '@/components/layout/ThemePicker';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-8 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function signOutEverywhere() {
    setBusy(true);
    try {
      await logoutAll();
      clearSession();
      toast.success('Signed out on every device');
      navigate('/login');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1.5 text-fg-muted">Manage your account and how JobShield looks.</p>
      <div className="mt-10">
        <Section title="Appearance" description="Choose light or dark mode and an accent colour. Saved on this device.">
          <ThemeControls />
        </Section>
        {user && (
          <>
            <Section title="Profile" description="Your account details.">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-fg-subtle">Name</dt>
                  <dd className="mt-0.5 font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Email</dt>
                  <dd className="mt-0.5 font-medium">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Member since</dt>
                  <dd className="mt-0.5 font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Role</dt>
                  <dd className="mt-0.5 font-medium capitalize">{user.role}</dd>
                </div>
              </dl>
            </Section>
            <Section title="Security" description="Sign out of JobShield on every browser and device.">
              <Button variant="secondary" onClick={signOutEverywhere} loading={busy} icon={<LogOut className="size-4" />}>
                Sign out everywhere
              </Button>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
