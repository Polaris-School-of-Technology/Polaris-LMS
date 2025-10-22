import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ums': {
        target: 'https://ums-672553132888.asia-south1.run.app',
        changeOrigin: true
      }
    }
  }
})
