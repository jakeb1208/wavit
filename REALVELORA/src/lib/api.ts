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

export class ApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNotFoundError';
  }
}

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
