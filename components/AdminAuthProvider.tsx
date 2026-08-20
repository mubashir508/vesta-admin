'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

type AdminAuthContextValue = {
  email: string | null;
  accessToken: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isAdmin = session?.panelUser?.capabilities.includes('ADMIN') ?? false;

  const login = useCallback(async (loginEmail: string, password: string) => {
    const result = await signIn('credentials', { email: loginEmail, password, redirect: false });
    if (result?.error) throw new Error('Invalid administrator credentials');
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const value = useMemo(
    () => ({
      email: session?.panelUser?.email ?? null,
      accessToken: session?.accessToken ?? null,
      isAdmin,
      isLoading: status === 'loading',
      login,
      logout,
    }),
    [session, status, isAdmin, login, logout],
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
