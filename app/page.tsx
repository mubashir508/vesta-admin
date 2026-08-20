'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/login');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <AdminShell>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/users"
          className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Browse registered guests, hosts, and profile completion status.
          </p>
        </Link>
        <Link href="/listings" className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400">
          <h2 className="text-lg font-semibold text-zinc-900">Hostel listings</h2>
          <p className="mt-2 text-sm text-zinc-600">
            View every listing and review owner submissions and verification documents.
          </p>
        </Link>
      </div>
    </AdminShell>
  );
}
