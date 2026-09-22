import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, ShieldCheck, ShieldX, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { getAdminStats, listAdminUsers } from '@/api/admin';
import { getApiErrorMessage } from '@/api/client';

const RISK_COLORS: Record<string, string> = {
  Low: 'text-risk-low',
  Medium: 'text-risk-medium',
  High: 'text-risk-high',
  Critical: 'text-risk-critical',
};

// The backend's max accepted page size (see backend/controllers/adminController.js)
// — fetching the largest page the API allows keeps client-side search
// meaningful across as much of the user base as possible without adding a
// new server-side search query param (out of scope: no backend changes).
const USERS_PAGE_SIZE = 100;

function StatCard({ icon: Icon, label, value, valueClass }: { icon: LucideIcon; label: string; value: number; valueClass?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`text-3xl font-bold tabular-nums ${valueClass ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      </div>
    </Card>
  );
}

export function AdminPage() {
  const [usersPage, setUsersPage] = useState(1);
  const [search, setSearch] = useState('');

  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', usersPage],
    queryFn: () => listAdminUsers(usersPage, USERS_PAGE_SIZE),
    placeholderData: (previous) => previous,
  });

  const error = statsQuery.error ?? usersQuery.error;
  if (error) return <Alert variant="error">{getApiErrorMessage(error)}</Alert>;

  const stats = statsQuery.data;
  const allUsers = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;

  // Client-side only — the admin/users endpoint has no search query param and
  // adding one is a backend change, out of scope here. This filters within
  // whatever page is currently loaded (up to USERS_PAGE_SIZE users).
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsQuery.isPending || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
            <StatCard icon={Activity} label="Total Analyses" value={stats.totalAnalyses} />
            <StatCard
              icon={ShieldX}
              label="Fraudulent Predictions"
              value={stats.predictionLabelCounts.fraudulent}
              valueClass="text-risk-critical"
            />
            <StatCard
              icon={ShieldCheck}
              label="Legitimate Predictions"
              value={stats.predictionLabelCounts.legitimate}
              valueClass="text-risk-low"
            />
          </>
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Risk Category Breakdown</h2>
        {statsQuery.isPending || !stats ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-4 gap-4 text-center">
            {(['Low', 'Medium', 'High', 'Critical'] as const).map((risk) => (
              <div key={risk} className="rounded-lg bg-slate-50 py-3 dark:bg-slate-800/50">
                <p className={`text-2xl font-bold tabular-nums ${RISK_COLORS[risk]}`}>{stats.riskCategoryCounts[risk]}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{risk}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Users</h2>
          <div className="w-full max-w-xs">
            <Input
              label="Search users"
              placeholder="Search by name or email..."
              icon={<Search className="h-4 w-4" aria-hidden="true" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent>
          {usersQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={Search} title="No matching users" description="Try a different name or email." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Joined</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {pagination && !search && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={setUsersPage}
              isFetching={usersQuery.isFetching}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
