import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  // Served from https://<user>.github.io/pilates-app-design/ on GitHub Pages.
  // Override with VITE_BASE='/' for local dev or other hosts.
  base: process.env.VITE_BASE ?? '/pilates-app-design/',
});
