// API base URL resolution:
// - Web (dev):        Vite proxy rewrites /api → localhost:3001
// - Web (prod):       Express serves frontend + /api on the same origin
// - Capacitor native: VITE_API_URL must be set to the live Railway URL at build time
//                     e.g.  VITE_API_URL=https://your-app.up.railway.app npm run build
//
// Without VITE_API_URL the native app will hit https://localhost/api (nothing).

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  // Warn loudly when running inside a Capacitor native context without a URL
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    console.error(
      '[Wavit] VITE_API_URL is not set. ' +
      'All API calls will fail in the native app. ' +
      'Rebuild with: VITE_API_URL=https://your-app.up.railway.app npm run build'
    );
  }
  return '/api';
}

export const API_BASE: string = resolveApiBase();

// ── Token storage (localStorage fallback for Capacitor WebView) ───────────────
// Android WebView often blocks cross-origin cookies even with SameSite=None.
// We store the session token in localStorage and send it as a custom header
// so auth works identically on web, iOS, and Android.

const ADMIN_TOKEN_KEY = 'wavit_admin_token';
const SUPERADMIN_TOKEN_KEY = 'wavit_superadmin_token';

function safeLS(fn: () => void) {
  try { fn(); } catch { /* localStorage unavailable (SSR, private mode, etc.) */ }
}

export function storeAdminToken(token: string): void {
  safeLS(() => localStorage.setItem(ADMIN_TOKEN_KEY, token));
}
export function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}
export function clearAdminToken(): void {
  safeLS(() => localStorage.removeItem(ADMIN_TOKEN_KEY));
}

export function storeSuperadminToken(token: string): void {
  safeLS(() => localStorage.setItem(SUPERADMIN_TOKEN_KEY, token));
}
export function getSuperadminToken(): string | null {
  try { return localStorage.getItem(SUPERADMIN_TOKEN_KEY); } catch { return null; }
}
export function clearSuperadminToken(): void {
  safeLS(() => localStorage.removeItem(SUPERADMIN_TOKEN_KEY));
}

// ── Error types ───────────────────────────────────────────────────────────────

export class ApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNotFoundError';
  }
}

// ── General-purpose fetch (public endpoints) ──────────────────────────────────

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    // Ensure caller-supplied headers are merged, not replaced
    ...(options?.headers
      ? { headers: { 'Content-Type': 'application/json', ...options.headers } }
      : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    if (res.status === 404) throw new ApiNotFoundError(err.error || 'Not found');
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ── Admin-authenticated fetch ─────────────────────────────────────────────────
// Sends cookies AND the stored admin token header so auth works in Capacitor.

export function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const callerHeaders = (options.headers as Record<string, string>) || {};
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...callerHeaders,
      ...(token ? { 'X-Admin-Token': token } : {}),
    },
  });
}

// ── Super-admin-authenticated fetch ──────────────────────────────────────────

export function superadminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSuperadminToken();
  const callerHeaders = (options.headers as Record<string, string>) || {};
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...callerHeaders,
      ...(token ? { 'X-Superadmin-Token': token } : {}),
    },
  });
}
