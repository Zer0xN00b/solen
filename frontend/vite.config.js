import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      // Forward API calls to the Express backend during development,
      // so the frontend can use relative /api URLs with no CORS setup.
      '/api': 'http://localhost:4000',
    },
  },
});
