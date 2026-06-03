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
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
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
