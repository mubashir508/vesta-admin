'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import Link from 'next/link';
import { Card, PageHeader, Spinner } from '@/components/ui';

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
      <main className="flex min-h-screen items-center justify-center gap-2.5 bg-zinc-50 text-zinc-400">
        <Spinner className="h-5 w-5" />
        <p className="text-sm font-medium">Loading...</p>
      </main>
    );
  }

  return (
    <AdminShell>
      <PageHeader title="Overview" description="Verify hostel listings and keep an eye on the platform's registered accounts." />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/users" className="block">
          <Card className="p-6 transition hover:border-zinc-400 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg">👥</span>
            <h2 className="mt-4 text-lg font-bold text-zinc-950">Users</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Browse registered guests, hosts, and profile completion status.
            </p>
          </Card>
        </Link>
        <Link href="/listings" className="block">
          <Card className="p-6 transition hover:border-zinc-400 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg">🏠</span>
            <h2 className="mt-4 text-lg font-bold text-zinc-950">Hostel listings</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              View every listing and review owner submissions and verification documents.
            </p>
          </Card>
        </Link>
      </div>
    </AdminShell>
  );
}
