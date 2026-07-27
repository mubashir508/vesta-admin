'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  adminLogin,
  adminLogout,
  fetchAdminMe,
  setAccessToken,
} from '@/lib/api/client';

type AdminAuthContextValue = {
  email: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client: 'admin' }),
        });

        if (!refreshRes.ok) {
          setEmail(null);
          setIsAdmin(false);
          return;
        }

        const { accessToken } = (await refreshRes.json()) as {
          accessToken: string;
        };
        setAccessToken(accessToken);

        const me = await fetchAdminMe();
        const admin = me.user.capabilities.includes('ADMIN');

        if (!admin) {
          await adminLogout();
          setEmail(null);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        setEmail(me.user.email);
      } catch {
        setEmail(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, []);

  const login = useCallback(async (loginEmail: string, password: string) => {
    const data = await adminLogin(loginEmail, password);
    setEmail(data.user.user.email ?? loginEmail);
    setIsAdmin(true);
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setEmail(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({ email, isAdmin, isLoading, login, logout }),
    [email, isAdmin, isLoading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
