const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? response.statusText;
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type AdminUserRow = {
  id: string; email: string; isActive: boolean; createdAt: string;
  fullName: string | null; phone: string | null; city: string | null;
  gender: string | null; tierAComplete: boolean; tierBComplete: boolean;
  capabilities: string[];
};

export function fetchAdminUsers(accessToken: string, page = 1, limit = 20) {
  return apiRequest<{ total: number; page: number; limit: number; users: AdminUserRow[] }>(
    `/admin/users?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export type HostelListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type HostelListingImage = { url: string; storageKey: string; isCover?: boolean };
export type HostelListingDocument = { storageKey: string; label: string };

export type HostelListingSeat = {
  id: string;
  label: string;
  status: 'AVAILABLE' | 'OCCUPIED';
};

export type HostelListingRoom = {
  id: string;
  name: string;
  occupancy: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_PERSON' | 'DORMITORY';
  monthlyRent: number;
  bathroomType: 'ATTACHED' | 'SHARED';
  furnishing: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED';
  airConditioned: boolean;
  isPublished: boolean;
  seats: HostelListingSeat[];
};

export type AdminHostelListing = {
  id: string;
  slug: string;
  name: string;
  description: string;
  gender: 'MALE' | 'FEMALE';
  status: HostelListingStatus;
  contactPhone: string;
  whatsappNumber: string | null;
  addressLine: string;
  area: string;
  city: string;
  province: string;
  nearbyLandmark: string | null;
  images: HostelListingImage[];
  documents: HostelListingDocument[];
  rooms: HostelListingRoom[];
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; profile: { fullName: string | null } | null };
};

export function fetchAdminHostelQueue(accessToken: string, status?: HostelListingStatus) {
  const query = status ? `?status=${status}` : '';
  return apiRequest<AdminHostelListing[]>(`/hostels/admin/queue${query}`, accessToken);
}

export function fetchAdminHostelDetail(accessToken: string, hostelId: string) {
  return apiRequest<AdminHostelListing>(`/hostels/admin/${hostelId}`, accessToken);
}

export function fetchHostelDocumentUrl(accessToken: string, hostelId: string, storageKey: string) {
  return apiRequest<{ url: string }>(
    `/hostels/${hostelId}/documents/url?key=${encodeURIComponent(storageKey)}`,
    accessToken,
  );
}

export function reviewHostelListing(
  accessToken: string,
  hostelId: string,
  input: { status: 'PUBLISHED' | 'REJECTED'; notes?: string },
) {
  return apiRequest<AdminHostelListing>(`/hostels/${hostelId}/review`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
