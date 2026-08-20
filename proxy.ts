import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((request) => {
  const authPage = request.nextUrl.pathname === '/login';
  const isAdmin = request.auth?.panelUser?.capabilities.includes('ADMIN') ?? false;
  if (!isAdmin && !authPage) return NextResponse.redirect(new URL('/login', request.url));
  if (isAdmin && authPage) return NextResponse.redirect(new URL('/', request.url));
  return NextResponse.next();
});
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'] };
