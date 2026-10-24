import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getAdminStats, listAdminUsers } from '@/api/admin';
import { getApiErrorMessage } from '@/api/client';
import { Alert, Badge, Skeleton } from '@/components/ui/Badge';
import { PageIntro } from '@/components/landing/Effects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

const PAGE_SIZE = 20;

export function AdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const users = useQuery({ queryKey: ['admin', 'users', page], queryFn: () => listAdminUsers(page, PAGE_SIZE), placeholderData: keepPreviousData });

  // Hooks run unconditionally, before any early return.
  const filtered = useMemo(() => {
    const all = users.data?.users ?? [];
    const q = search.trim().toLowerCase();
    return q ? all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : all;
  }, [users.data, search]);

  const error = stats.error ?? users.error;
  const s = stats.data;
  const cards = s
    ? [
        { label: 'Users', value: s.totalUsers },
        { label: 'Checks run', value: s.totalAnalyses },
        { label: 'Likely scams', value: s.verdictCounts?.fraudulent ?? 0 },
        { label: 'Looked legitimate', value: s.verdictCounts?.legitimate ?? 0 },
      ]
    : [];

  return (
    <div className="container-page max-w-5xl py-12 sm:py-16">
      <PageIntro label="Admin" title="Platform usage" sub="at a glance" />
      {error && (
        <div className="mt-6">
          <Alert>{getApiErrorMessage(error)}</Alert>
        </div>
      )}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.isPending
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[13px] text-fg-subtle">{c.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{c.value.toLocaleString()}</p>
              </div>
            ))}
      </div>

      <div className="mt-10 rounded-3xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <h2 className="font-medium">Users</h2>
          <div className="w-full sm:w-72">
            <Input aria-label="Search users on this page" placeholder="Search this page…" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="size-4" />} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[12px] uppercase tracking-wider text-fg-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-fg-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!users.isPending && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-fg-muted">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {users.data && users.data.pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line p-4">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-[13px] text-fg-muted">Page {page} of {users.data.pagination.pages}</span>
            <Button size="sm" variant="secondary" disabled={page >= users.data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
