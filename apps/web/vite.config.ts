import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { appVersionPlugin, resolveAppVersion } from './vite-app-version.plugin';

const appVersion = resolveAppVersion();

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mkt Agency OS',
        short_name: 'Mkt Agency',
        description: 'Plataforma de marketing para agencias',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,webmanifest}'],
        globIgnores: ['**/version.json'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/version\.json$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/version.json',
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
    // After PWA so version.json is always emitted in the final bundle.
    appVersionPlugin(appVersion),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
