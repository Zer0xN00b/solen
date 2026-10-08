import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    // Pinned, not left to Vite's default. The design skill and every
    // screenshot baseline were taken against 5199, and Better Auth's
    // trustedOrigins list has to name this exact port (see
    // backend/src/auth/auth.ts) — a silent fallback to 5173 would break
    // sign-in with a CSRF origin error that reads like a config bug.
    port: 5199,
    strictPort: true,
    proxy: {
      // Forward API calls to the Express backend during development,
      // so the frontend can use relative /api URLs with no CORS setup.
      '/api': 'http://localhost:4000',
    },
  },
});
