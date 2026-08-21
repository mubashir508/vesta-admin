'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { Button, Logo } from '@/components/ui';

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { email, logout } = useAdminAuth();

  const links = [
    { href: '/', label: 'Overview' },
    { href: '/users', label: 'Users' },
    { href: '/listings', label: 'Listings' },
  ];

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Logo size="sm" />
            <nav className="flex items-center gap-1">
              {links.map((link) => {
                const active =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                {email?.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-zinc-600">{email}</span>
            </span>
            <Button variant="secondary" className="px-3 py-1.5" onClick={() => void logout().then(() => router.replace('/login'))}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </main>
  );
}
