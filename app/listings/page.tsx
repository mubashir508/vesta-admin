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

const TABS: { value: HostelListingStatus; label: string }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminListingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading, accessToken } = useAdminAuth();
  const [status, setStatus] = useState<HostelListingStatus>('PENDING_REVIEW');
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">Hostel listings</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Verify owner-submitted documents before a listing goes live.
        </p>
      </div>

      <div className="mb-4 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              status === tab.value
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
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
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Loading listings...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Nothing here
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {listing.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{listing.gender}</div>
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
      </div>
    </AdminShell>
  );
}
