const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ADMIN_CLIENT = 'admin';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client: ADMIN_CLIENT }),
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!skipAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }
  if (rest.body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: 'include',
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      requestHeaders.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: requestHeaders,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        message = data.message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export async function adminLogin(email: string, password: string) {
  const data = await apiRequest<{
    accessToken: string;
    user: { user: { capabilities: string[]; email: string } };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, client: ADMIN_CLIENT }),
    skipAuth: true,
  });

  setAccessToken(data.accessToken);
  return data;
}

export async function adminLogout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ client: ADMIN_CLIENT }),
    });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchAdminMe() {
  return apiRequest<{ user: { capabilities: string[]; email: string } }>(
    '/auth/me',
  );
}

export type AdminUserRow = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  gender: string | null;
  tierAComplete: boolean;
  tierBComplete: boolean;
  capabilities: string[];
};

export async function fetchAdminUsers(page = 1, limit = 20) {
  return apiRequest<{
    total: number;
    page: number;
    limit: number;
    users: AdminUserRow[];
  }>(`/admin/users?page=${page}&limit=${limit}`);
}
