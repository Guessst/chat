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
    proxy: {
      '/chat': 'http://localhost:5249',
      "/chatHub": {
        target: "http://localhost:5249",
        ws: true,
      }
    },
  },
})
