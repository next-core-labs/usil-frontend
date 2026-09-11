import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
    proxy: {
      // the backend lives in ../usil backend (npm run dev there, PORT=43147)
      '/api': 'http://127.0.0.1:43147',
      '/uploads': 'http://127.0.0.1:43147',
    },
  },
  preview: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 3000,
  },
});
