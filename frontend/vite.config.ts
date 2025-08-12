import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// No Node built-ins to avoid needing @types/node for config typing

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3001,
    host: true,
    allowedHosts: ['durgeshkhade.me', '146.190.168.234'],
    proxy: {
      '/api': {
        target: 'http://146.190.168.234:3003',
        // target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3001,
    host: true,
    allowedHosts: ['durgeshkhade.me', '146.190.168.234'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})