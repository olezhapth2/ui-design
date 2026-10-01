import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // относительные пути — сайт работает с любого префикса (GitHub Pages и т.п.)
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/ogl')) return 'ogl'
          if (id.includes('node_modules/motion')) return 'motion'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
  server: {
    port: 8080,
    strictPort: true,
    host: 'localhost',
  },
})
