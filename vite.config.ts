import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // Single-origin proxy so a public tunnel (or any other host) can reach
    // both the SPA and the backend without CORS gymnastics. The SPA calls
    // `/api/trpc/<procedure>` against the same origin; Vite forwards it to
    // the marketplace API on :4040.
    proxy: {
      '/api/trpc': {
        target: 'http://localhost:4040',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/trpc/, '/trpc'),
      },
    },
    allowedHosts: true,
  },
  // Served from https://<user>.github.io/pilates-app-design/ on GitHub Pages.
  // Override with VITE_BASE='/' for local dev or other hosts.
  base: process.env.VITE_BASE ?? '/pilates-app-design/',
});
