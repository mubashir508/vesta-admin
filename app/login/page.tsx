'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { Alert, Button, Field, Input, Logo, Spinner } from '@/components/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAdmin, isLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2.5 bg-zinc-50 text-zinc-400">
        <Spinner className="h-5 w-5" />
        <p className="text-sm font-medium">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="mb-8"><Logo size="lg" /></div>
      <div className="w-full max-w-[26rem] rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-zinc-950">Verification panel sign-in</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Restricted to platform admins. Owner accounts are managed in Vesta Owner.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="Email">
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
