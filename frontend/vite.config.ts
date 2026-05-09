import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@/components', replacement: path.resolve(__dirname, './src/components/ui') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
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
