'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import {
  fetchAdminUsers,
  type AdminUserRow,
} from '@/lib/api/client';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading, accessToken } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/login');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;

    void fetchAdminUsers(accessToken, page, limit)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setError('');
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [isAdmin, accessToken, page]);

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2.5 bg-zinc-50 text-zinc-400">
        <Spinner className="h-5 w-5" />
        <p className="text-sm font-medium">Loading...</p>
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AdminShell>
      <PageHeader title="Users" description={`${total} registered accounts`} />

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Capabilities</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td colSpan={6} className="px-4 py-4"><div className="h-4 w-full max-w-md animate-pulse rounded bg-zinc-100" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}><EmptyState icon="👤" title="No users yet" /></td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">
                        {user.fullName || '—'}
                      </div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{user.city || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={user.tierAComplete ? 'positive' : 'neutral'}>Tier A</Badge>
                        <Badge tone={user.tierBComplete ? 'positive' : 'neutral'}>Tier B</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {user.capabilities.map((cap) => (
                          <Badge key={cap} tone="neutral">{cap.replaceAll('_', ' ')}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.isActive ? 'positive' : 'negative'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            disabled={page <= 1}
            onClick={() => { setLoading(true); setPage((p) => Math.max(1, p - 1)); }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            disabled={page >= totalPages}
            onClick={() => { setLoading(true); setPage((p) => p + 1); }}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
