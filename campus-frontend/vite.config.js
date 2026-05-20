import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeBasePath = (value) => {
  const raw = String(value || '/').trim();
  if (!raw || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
};

const appBasePath = process.env.VERCEL ? '/' : process.env.VITE_APP_BASE_PATH;

// https://vite.dev/config/
export default defineConfig({
  base: normalizeBasePath(appBasePath),
  plugins: [react()],
  server: {
    // In dev, proxy same-origin `/api/*` calls to the backend to avoid CORS.
    // Backend runs on port 5000 by default.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/apartment/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apartment\/api/, '/api'),
      },
    },
  },
})
