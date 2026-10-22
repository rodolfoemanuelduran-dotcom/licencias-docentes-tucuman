import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Licencias Docentes Tucumán',
        short_name: 'Licencias',
        description: 'Herramienta independiente, no oficial, para preparar partes de licencia.',
        lang: 'es-AR',
        theme_color: '#1d5fb8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './',
        id: 'licencias-docentes-tucuman',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,json}'], navigateFallback: 'index.html' },
    }),
  ],
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'], setupFiles: ['tests/unit/setup.ts'] },
});
