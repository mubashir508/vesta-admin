'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import {
  fetchAdminHostelQueue,
  type AdminHostelListing,
  type HostelListingStatus,
} from '@/lib/api/client';
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

const TABS: { value: HostelListingStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All listings' },
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REJECTED', label: 'Rejected' },
];

function statusTone(status: string): 'positive' | 'warning' | 'negative' | 'neutral' {
  if (status === 'PUBLISHED') return 'positive';
  if (status === 'REJECTED') return 'negative';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'neutral';
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading, accessToken } = useAdminAuth();
  const [status, setStatus] = useState<HostelListingStatus | undefined>();
  const [listings, setListings] = useState<AdminHostelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/login');
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    setLoading(true);
    void fetchAdminHostelQueue(accessToken, status)
      .then((data) => {
        setListings(data);
        setError('');
      })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false));
  }, [isAdmin, accessToken, status]);

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
      <PageHeader title="Hostel listings" description="Verify owner-submitted documents before a listing goes live." />

      <div className="mt-6 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value ?? 'ALL'}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              status === tab.value
                ? 'bg-zinc-950 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3 font-medium">Documents</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td colSpan={6} className="px-4 py-4"><div className="h-4 w-full max-w-md animate-pulse rounded bg-zinc-100" /></td>
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6}><EmptyState icon="🗂️" title="Nothing here" /></td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="font-semibold text-zinc-900 hover:underline"
                      >
                        {listing.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                        <span>{listing.gender === 'MALE' ? 'Male' : 'Female'}</span>
                        <span>·</span>
                        <Badge tone={statusTone(listing.status)}>{listing.status.replaceAll('_', ' ')}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {listing.owner.profile?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {listing.area}, {listing.city}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{listing.rooms.length}</td>
                    <td className="px-4 py-3 text-zinc-700">{listing.documents.length}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {new Date(listing.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
