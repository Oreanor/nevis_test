/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_URL ?? 'http://localhost:3001';
// Same-origin API in dev and preview: the browser never needs CORS.
const proxy = { '/api': apiTarget, '/avatars': apiTarget };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Keep in sync with `paths` in tsconfig.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy,
  },
  preview: { proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
