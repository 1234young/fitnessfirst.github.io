import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    //  Forward all /api requests to your Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  //  Express server port
        changeOrigin: true,
      }
    }
  }
})