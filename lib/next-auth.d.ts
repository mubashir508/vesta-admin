type PanelUser = { id: string; email: string; capabilities: string[] };
declare module 'next-auth' {
  interface Session { accessToken?: string; panelUser?: PanelUser; error?: 'RefreshAccessTokenError'; }
  interface User { accessToken?: string; refreshToken?: string; accessTokenExpiresAt?: number; panelUser?: PanelUser; }
}
declare module 'next-auth/jwt' {
  interface JWT { accessToken?: string; refreshToken?: string; accessTokenExpiresAt?: number; panelUser?: PanelUser; error?: 'RefreshAccessTokenError'; }
}
export {};
