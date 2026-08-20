'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { AdminShell } from '@/components/AdminShell';
import {
  ApiError,
  fetchAdminHostelDetail,
  fetchHostelDocumentUrl,
  reviewHostelListing,
  type AdminHostelListing,
} from '@/lib/api/client';

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminListingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAdmin, isLoading, accessToken } = useAdminAuth();
  const [listing, setListing] = useState<AdminHostelListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'PUBLISHED' | 'REJECTED' | null>(null);
  const [docLoading, setDocLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/login');
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    void fetchAdminHostelDetail(accessToken, params.id)
      .then((data) => {
        setListing(data);
        setNotes(data.reviewNotes ?? '');
        setError('');
      })
      .catch(() => setError('Failed to load this listing'))
      .finally(() => setLoading(false));
  }, [isAdmin, accessToken, params.id]);

  async function handleViewDocument(storageKey: string) {
    if (!accessToken || !listing) return;
    setDocLoading(storageKey);
    try {
      const { url } = await fetchHostelDocumentUrl(accessToken, listing.id, storageKey);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open document');
    } finally {
      setDocLoading(null);
    }
  }

  async function handleReview(nextStatus: 'PUBLISHED' | 'REJECTED') {
    if (!accessToken || !listing) return;
    setSubmitting(nextStatus);
    setError('');
    try {
      const updated = await reviewHostelListing(accessToken, listing.id, {
        status: nextStatus,
        notes: notes || undefined,
      });
      setListing(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the review');
    } finally {
      setSubmitting(null);
    }
  }

  if (isLoading || !isAdmin || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <AdminShell>
        <p className="text-sm text-red-600">{error || 'Listing not found'}</p>
        <Link href="/listings" className="mt-4 inline-block text-sm text-zinc-600 hover:underline">
          ← Back to listings
        </Link>
      </AdminShell>
    );
  }

  const canReview = listing.status === 'PENDING_REVIEW';

  return (
    <AdminShell>
      <Link href="/listings" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to listings
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{listing.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {listing.addressLine}, {listing.area}, {listing.city}, {listing.province}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Owner: {listing.owner.profile?.fullName || '—'} · {listing.contactPhone}
          </p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <Section title="Description">
            <p className="whitespace-pre-line text-sm text-zinc-700">{listing.description}</p>
          </Section>

          <Section title={`Photos (${listing.images.length})`}>
            {listing.images.length ? (
              <div className="grid grid-cols-3 gap-3">
                {listing.images.map((image) => (
                  <img
                    key={image.storageKey}
                    src={image.url}
                    alt={listing.name}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No photos uploaded</p>
            )}
          </Section>

          <Section title={`Verification documents (${listing.documents.length})`}>
            {listing.documents.length ? (
              <ul className="divide-y divide-zinc-100">
                {listing.documents.map((doc) => (
                  <li key={doc.storageKey} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-zinc-700">{doc.label}</span>
                    <button
                      type="button"
                      onClick={() => void handleViewDocument(doc.storageKey)}
                      disabled={docLoading === doc.storageKey}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {docLoading === doc.storageKey ? 'Opening...' : 'View document'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No documents uploaded</p>
            )}
          </Section>

          <Section title={`Rooms (${listing.rooms.length})`}>
            {listing.rooms.length ? (
              <div className="space-y-3">
                {listing.rooms.map((room) => (
                  <div key={room.id} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-zinc-900">{room.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          room.isPublished
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {room.isPublished ? 'Published' : 'Not published'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatLabel(room.occupancy)} · {formatLabel(room.bathroomType)} bath ·{' '}
                      {formatLabel(room.furnishing)} · PKR {room.monthlyRent.toLocaleString()}/month
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {room.seats.filter((s) => s.status === 'AVAILABLE').length} of {room.seats.length}{' '}
                      seats available
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No rooms added yet</p>
            )}
          </Section>
        </div>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Review decision</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the owner (optional for approval, recommended for rejection)"
            rows={4}
            maxLength={1000}
            disabled={!canReview}
            className="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-400"
          />
          {canReview ? (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleReview('PUBLISHED')}
                disabled={submitting !== null}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting === 'PUBLISHED' ? 'Approving...' : 'Approve & publish'}
              </button>
              <button
                type="button"
                onClick={() => void handleReview('REJECTED')}
                disabled={submitting !== null}
                className="w-full rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {submitting === 'REJECTED' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              This listing is {listing.status.toLowerCase().replace('_', ' ')} — only pending
              submissions can be reviewed.
            </p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: AdminHostelListing['status'] }) {
  const styles: Record<AdminHostelListing['status'], string> = {
    DRAFT: 'bg-zinc-100 text-zinc-500',
    PENDING_REVIEW: 'bg-amber-50 text-amber-700',
    PUBLISHED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
    ARCHIVED: 'bg-zinc-100 text-zinc-500',
  };
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {formatLabel(status)}
    </span>
  );
}
