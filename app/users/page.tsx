'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import {
  fetchAdminUsers,
  type AdminUserRow,
} from '@/lib/api/client';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdminAuth();
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
    if (!isAdmin) return;

    setLoading(true);
    void fetchAdminUsers(page, limit)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setError('');
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [isAdmin, page]);

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading...</p>
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Users</h2>
          <p className="mt-1 text-sm text-zinc-500">{total} registered accounts</p>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
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
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No users yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">
                        {user.fullName || '—'}
                      </div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{user.city || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge ok={user.tierAComplete}>Tier A</Badge>
                        <Badge ok={user.tierBComplete}>Tier B</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {user.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                          >
                            {cap.replaceAll('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
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
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function Badge({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
      }`}
    >
      {children}
    </span>
  );
}
