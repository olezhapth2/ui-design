import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // относительные пути — сайт работает с любого префикса (GitHub Pages и т.п.)
  base: './',
  server: {
    port: 8080,
    strictPort: true,
    host: 'localhost',
  },
})
