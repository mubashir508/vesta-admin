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
import { Alert, BackLink, Badge, Button, Card, Spinner, Textarea } from '@/components/ui';

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): 'positive' | 'warning' | 'negative' | 'neutral' {
  if (status === 'PUBLISHED') return 'positive';
  if (status === 'REJECTED') return 'negative';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'neutral';
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
      <main className="flex min-h-screen items-center justify-center gap-2.5 bg-zinc-50 text-zinc-400">
        <Spinner className="h-5 w-5" />
        <p className="text-sm font-medium">Loading...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <AdminShell>
        <Alert tone="error">{error || 'Listing not found'}</Alert>
        <Link href="/listings" className="mt-4 inline-block text-sm text-zinc-600 hover:underline">
          ← Back to listings
        </Link>
      </AdminShell>
    );
  }

  const canReview = listing.status === 'PENDING_REVIEW';

  return (
    <AdminShell>
      <BackLink href="/listings">Back to listings</BackLink>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">{listing.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {listing.addressLine}, {listing.area}, {listing.city}, {listing.province}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Owner: {listing.owner.profile?.fullName || '—'} · {listing.contactPhone}
          </p>
        </div>
        <Badge tone={statusTone(listing.status)}>{formatLabel(listing.status)}</Badge>
      </div>

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Section title="Description">
            <p className="whitespace-pre-line text-sm text-zinc-700">{listing.description}</p>
          </Section>

          <Section title={`Photos (${listing.images.length})`}>
            {listing.images.length ? (
              <div className="grid grid-cols-3 gap-3">
                {listing.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
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
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      loading={docLoading === doc.storageKey}
                      onClick={() => void handleViewDocument(doc.storageKey)}
                    >
                      {docLoading === doc.storageKey ? 'Opening' : 'View document'}
                    </Button>
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
                      <p className="font-semibold text-zinc-950">{room.name}</p>
                      <Badge tone={room.isPublished ? 'positive' : 'neutral'}>{room.isPublished ? 'Published' : 'Not published'}</Badge>
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

        <Card className="h-fit p-5">
          <h3 className="text-sm font-bold text-zinc-950">Review decision</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the owner (optional for approval, recommended for rejection)"
            rows={4}
            maxLength={1000}
            disabled={!canReview}
            className="mt-3 disabled:bg-zinc-50 disabled:text-zinc-400"
          />
          {canReview ? (
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="positive" className="w-full" loading={submitting === 'PUBLISHED'} disabled={submitting !== null} onClick={() => void handleReview('PUBLISHED')}>
                {submitting === 'PUBLISHED' ? 'Approving' : 'Approve & publish'}
              </Button>
              <Button variant="danger" className="w-full" loading={submitting === 'REJECTED'} disabled={submitting !== null} onClick={() => void handleReview('REJECTED')}>
                {submitting === 'REJECTED' ? 'Rejecting' : 'Reject'}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              This listing is {listing.status.toLowerCase().replace('_', ' ')} — only pending
              submissions can be reviewed.
            </p>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
