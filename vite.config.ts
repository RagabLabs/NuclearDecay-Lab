import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative assets work both at a domain root and in /repository/ on GitHub Pages.
// Hash routes do not require a host-side SPA fallback.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
  build: { target: 'es2022', chunkSizeWarningLimit: 650 },
});
