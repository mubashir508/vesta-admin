import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
type AdminUser = { id: string; email: string; capabilities: string[] };

class InvalidAdminCredentials extends CredentialsSignin { code = 'invalid_admin_credentials'; }

async function refresh(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: 'admin', refreshToken: token.refreshToken }),
    });
    if (!response.ok) throw new Error('Refresh failed');
    const rotated = (await response.json()) as { accessToken: string; refreshToken: string; accessTokenExpiresAt: number };
    const verification = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${rotated.accessToken}` } });
    if (!verification.ok) throw new Error('Verification failed');
    const me = (await verification.json()) as { user: AdminUser };
    if (!me.user.capabilities.includes('ADMIN')) throw new Error('Admin role revoked');
    return { ...token, ...rotated, panelUser: me.user, error: undefined };
  } catch { return { ...token, error: 'RefreshAccessTokenError' }; }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  cookies: { sessionToken: { name: 'vesta-admin.session-token', options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' } } },
  providers: [Credentials({
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    async authorize(credentials) {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password, client: 'admin' }),
      });
      if (!response.ok) throw new InvalidAdminCredentials();
      const data = (await response.json()) as { accessToken: string; refreshToken: string; accessTokenExpiresAt: number; user: { user: AdminUser } };
      if (!data.user.user.capabilities.includes('ADMIN')) throw new InvalidAdminCredentials();
      return { id: data.user.user.id, ...data, panelUser: data.user.user };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) return { ...token, accessToken: user.accessToken, refreshToken: user.refreshToken, accessTokenExpiresAt: user.accessTokenExpiresAt, panelUser: user.panelUser };
      if (!token.accessTokenExpiresAt || Date.now() < token.accessTokenExpiresAt - 60_000) return token;
      return refresh(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.panelUser = token.panelUser;
      session.error = token.error;
      if (token.panelUser) session.user = { ...session.user, id: token.panelUser.id, email: token.panelUser.email };
      return session;
    },
    authorized({ auth }) { return Boolean(auth?.panelUser?.capabilities.includes('ADMIN')); },
  },
  events: { async signOut(message) { const token = 'token' in message ? message.token : undefined; if (!token?.refreshToken) return; await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: 'admin', refreshToken: token.refreshToken }) }).catch(() => {}); } },
});
