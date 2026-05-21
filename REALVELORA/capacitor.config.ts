import type { CapacitorConfig } from '@capacitor/cli';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Before building for Android/iOS, set VITE_API_URL to your
// live Railway backend URL, e.g.:
//
//   VITE_API_URL=https://your-app.up.railway.app npm run build
//   npx cap sync android
//
// Without this the native WebView (origin: https://localhost) cannot reach
// the backend, because relative /api URLs resolve to https://localhost/api.
// ─────────────────────────────────────────────────────────────────────────────

const config: CapacitorConfig = {
  appId: 'app.wavit.queue',
  appName: 'Wavit',
  webDir: 'dist',
  server: {
    // androidScheme: 'https' makes the WebView origin https://localhost
    // The backend CORS config explicitly allows this origin.
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1a0845',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
