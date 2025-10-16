import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // wichtig für Zugriff von außerhalb des Containers
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: true // 🔥 notwendig für funktionierendes Debugging
  }
})
