import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Vite plugin: copy SW files from dist/ to .output/public/ for Nitro serving
function copySwToNitroOutput(): import('vite').Plugin {
  return {
    name: 'copy-sw-to-nitro',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const outputDir = resolve(__dirname, '.output/public')
      if (!existsSync(distDir)) return
      if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
      for (const f of readdirSync(distDir)) {
        if (f === 'sw.js' || f.startsWith('workbox-')) {
          copyFileSync(resolve(distDir, f), resolve(outputDir, f))
        }
      }
    },
  }
}

const config = defineConfig({
  plugins: [
    nitro({
      features: { websocket: true },
      serverDir: './server',
    }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Amore Couples',
        short_name: 'Amore',
        description: 'Relationship health platform for couples',
        theme_color: '#C96B4F',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          { src: '/pwa-icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/sse\//, /^\/ws\//, /^\/_server\//],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-stylesheets', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-webfonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          { urlPattern: /^\/_server\//, handler: 'NetworkOnly' },
          { urlPattern: /^\/api\//, handler: 'NetworkOnly' },
          { urlPattern: /^\/sse\//, handler: 'NetworkOnly' },
        ],
      },
    }),
    copySwToNitroOutput(),
  ],
})

export default config
