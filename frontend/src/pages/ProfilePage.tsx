import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Mail, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useAuthStore } from '@/store/authStore';
import { logoutAll } from '@/api/auth';

function ProfileField({ icon: Icon, label, value, capitalize }: { icon: typeof UserIcon; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`font-medium text-slate-900 dark:text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogoutAll() {
    setIsLoggingOut(true);
    await logoutAll().catch(() => {});
    clearSession();
    toast.success('Logged out of all devices');
    navigate('/');
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-md animate-fade-in-up">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
      <Card className="space-y-5">
        <ProfileField icon={UserIcon} label="Name" value={user.name} />
        <ProfileField icon={Mail} label="Email" value={user.email} />
        <ProfileField icon={Shield} label="Role" value={user.role} capitalize />
        <ProfileField icon={Calendar} label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger" className="w-full">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out of all devices
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Log out everywhere?</DialogTitle>
            <DialogDescription>
              This ends every active session for your account, including this one. You'll need to log in again on
              each device.
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button variant="danger" isLoading={isLoggingOut} onClick={handleLogoutAll}>
                Log out everywhere
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
