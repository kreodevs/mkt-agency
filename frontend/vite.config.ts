import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,
    allowedHosts: ['mkt-agency.kreoint.mx', '.kreoint.mx'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
})
