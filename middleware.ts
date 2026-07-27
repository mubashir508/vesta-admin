import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'vesta_admin_refresh';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAdminCookie = Boolean(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (pathname === '/login') {
    return NextResponse.next();
  }

  if (!hasAdminCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/users/:path*'],
};
