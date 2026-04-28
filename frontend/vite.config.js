import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // Fix 431 "Request Header Fields Too Large" caused by Sanctum
    // cookies being forwarded to Vite's HMR WebSocket connection.
    hmr: {
      // Use a separate port for HMR so it doesn't inherit the
      // bloated cookie headers from the main dev server connection.
      protocol: 'ws',
      port: 5174,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
