import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://www.wavit.cc',
        changeOrigin: true,
        secure: true,
        // Rewrite cookie domain so the browser accepts cookies set by
        // www.wavit.cc when going through the Replit dev proxy.
        // Stripping the domain makes the browser store them for the
        // current origin (the Replit preview URL).
        cookieDomainRewrite: {
          'www.wavit.cc': '',
          '*': '',
        },
        // Also strip the Secure flag issues — keep path intact
        cookiePathRewrite: {
          '*': '/',
        },
        configure: (proxy) => {
          // Forward the original host so Railway CORS mirrors it correctly
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('origin', 'https://www.wavit.cc');
            if (req.headers['x-admin-token']) {
              proxyReq.setHeader('x-admin-token', req.headers['x-admin-token'] as string);
            }
            if (req.headers['x-superadmin-token']) {
              proxyReq.setHeader('x-superadmin-token', req.headers['x-superadmin-token'] as string);
            }
          });
          proxy.on('error', (err) => {
            console.error('[proxy error]', err.message);
          });
        },
      },
    },
  },
})
