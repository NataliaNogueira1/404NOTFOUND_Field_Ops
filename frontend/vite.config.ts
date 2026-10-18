import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The Dockerized API is published on the host via API_EXTERNAL_PORT (see api/.env);
// locally it defaults to 8085 because 8080 is often already taken. Override with
// VITE_DEV_API_PROXY_TARGET when the backend runs elsewhere.
const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET ?? 'http://localhost:8085'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
