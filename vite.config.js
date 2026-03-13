// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Ganti ke 3000 karena Vercel Dev jalan di sini
        changeOrigin: true,
        // Hapus rewrite jika struktur folder Anda memang /api/gemini.js
      }
    }
  }
})