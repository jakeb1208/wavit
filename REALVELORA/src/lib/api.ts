// In a browser/web context the Vite dev proxy rewrites /api → localhost:3001
// In production the Express server serves the frontend and handles /api itself
// In a Capacitor native build, VITE_API_URL must point to the live Railway URL
// e.g. VITE_API_URL=https://your-app.up.railway.app

export const API_BASE: string = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api`
  : '/api';

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}
