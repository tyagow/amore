# PWA / Mobile-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Amore installable as a PWA on Android/iOS with offline shell, safe-area support, install prompt, and offline indicators.

**Architecture:** Service worker via vite-plugin-pwa (Workbox) with network-first for API/SSR, cache-first for assets/fonts, offline.html fallback. No caching of SSE/WS/server-function paths.

**Tech Stack:** vite-plugin-pwa, Workbox, Web App Manifest, Service Worker API

**Monorepo:** pnpm + turborepo -- `apps/web` is the target package (`@amore-couples/web`).

**Brand colors:** coral-500 = `#C96B4F`, warm-50 = `#FAF8F5`

---

### Task 1: Install vite-plugin-pwa and configure manifest + service worker

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`

- [ ] **Step 1: Install vite-plugin-pwa**

```bash
cd /Users/partiu/workspace/amore-couples
pnpm --filter @amore-couples/web add -D vite-plugin-pwa
```

- [ ] **Step 2: Update `apps/web/vite.config.ts` with VitePWA plugin**

The current file has these imports and plugin array. Replace the ENTIRE file with:

```typescript
// File: apps/web/vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = parseNumber(env.VITE_DEV_PORT, 9941)
  const watchPolling = env.VITE_WATCH_POLLING === 'true' || env.CHOKIDAR_USEPOLLING === 'true'
  const hmrHost = env.VITE_HMR_HOST
  const hmrProtocol = env.VITE_HMR_PROTOCOL as 'ws' | 'wss' | undefined
  const hmrClientPort =
    env.VITE_HMR_CLIENT_PORT || env.VITE_HMR_PORT
      ? parseNumber(env.VITE_HMR_CLIENT_PORT || env.VITE_HMR_PORT, devPort)
      : undefined

  return {
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
            {
              src: '/pwa-icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Never cache server-side routes
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/sse\//,
            /^\/ws\//,
            /^\/_server\//,
          ],
          // Offline fallback page
          navigateFallback: '/offline.html',
          runtimeCaching: [
            {
              // Cache Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache Google Fonts webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // NetworkOnly for server functions — never cache these
              urlPattern: /^\/_server\//,
              handler: 'NetworkOnly',
            },
            {
              // NetworkOnly for API routes
              urlPattern: /^\/api\//,
              handler: 'NetworkOnly',
            },
            {
              // NetworkOnly for SSE
              urlPattern: /^\/sse\//,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: devPort,
      strictPort: true,
      watch: watchPolling
        ? {
            usePolling: true,
            interval: parseNumber(env.VITE_WATCH_INTERVAL, 100),
          }
        : undefined,
      hmr:
        hmrHost || hmrProtocol || hmrClientPort
          ? {
              host: hmrHost,
              protocol: hmrProtocol,
              clientPort: hmrClientPort ?? devPort,
            }
          : undefined,
    },
  }
})
```

- [ ] **Step 3: Verify the config is valid TypeScript**

```bash
cd /Users/partiu/workspace/amore-couples/apps/web && npx tsc --noEmit vite.config.ts --skipLibCheck 2>&1 | head -20
```

If there are type errors with the VitePWA import, that is OK -- vite-plugin-pwa types may not resolve against the vite.config.ts tsconfig. The build itself will work.

- [ ] **Step 4: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/package.json apps/web/vite.config.ts pnpm-lock.yaml
git commit -m "feat(pwa): add vite-plugin-pwa with manifest and workbox config"
```

---

### Task 2: Create PWA icons and offline fallback page

**Files:**
- Create: `apps/web/public/` (directory)
- Create: `apps/web/public/offline.html`
- Create: `apps/web/scripts/generate-pwa-icons.mjs`
- Create: `apps/web/public/pwa-icon-192x192.png`
- Create: `apps/web/public/pwa-icon-512x512.png`
- Create: `apps/web/public/apple-touch-icon-180x180.png`
- Create: `apps/web/public/favicon-32x32.png`

- [ ] **Step 1: Create `apps/web/public/` directory**

```bash
mkdir -p /Users/partiu/workspace/amore-couples/apps/web/public
```

- [ ] **Step 2: Create the icon generation script at `apps/web/scripts/generate-pwa-icons.mjs`**

This script generates minimal valid PNG files in coral (#C96B4F) at required sizes. It uses no external dependencies -- it constructs valid PNG binary data directly.

```javascript
// File: apps/web/scripts/generate-pwa-icons.mjs
// Generates minimal solid-color PNG icons for PWA.
// These are placeholders -- replace with real brand assets before launch.
// Usage: node apps/web/scripts/generate-pwa-icons.mjs

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Coral brand color #C96B4F -> RGB(201, 107, 79)
const R = 201, G = 107, B = 79

function createPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type: RGB
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace
  const ihdr = makeChunk('IHDR', ihdrData)

  // IDAT chunk - raw image data
  // Each row: filter byte (0) + RGB pixels
  const rowSize = 1 + width * 3
  const rawData = Buffer.alloc(rowSize * height)
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize
    rawData[offset] = 0 // no filter
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3
      rawData[px] = R
      rawData[px + 1] = G
      rawData[px + 2] = B
    }
  }
  const compressed = zlib.deflateSync(rawData)
  const idat = makeChunk('IDAT', compressed)

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcData), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

mkdirSync(publicDir, { recursive: true })

const sizes = [
  { name: 'pwa-icon-192x192.png', w: 192, h: 192 },
  { name: 'pwa-icon-512x512.png', w: 512, h: 512 },
  { name: 'apple-touch-icon-180x180.png', w: 180, h: 180 },
  { name: 'favicon-32x32.png', w: 32, h: 32 },
]

for (const { name, w, h } of sizes) {
  const png = createPNG(w, h)
  const path = join(publicDir, name)
  writeFileSync(path, png)
  console.log(`Created ${name} (${w}x${h}, ${png.length} bytes)`)
}

console.log('\nDone! Replace these placeholder icons with real brand assets before launch.')
```

- [ ] **Step 3: Run the icon generation script**

```bash
cd /Users/partiu/workspace/amore-couples
node apps/web/scripts/generate-pwa-icons.mjs
```

Verify the files were created:
```bash
ls -la apps/web/public/
```

- [ ] **Step 4: Create `apps/web/public/offline.html`**

This is a self-contained offline fallback page with inline CSS and Amore branding.

```html
<!-- File: apps/web/public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Offline -- Amore Couples</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=DM+Sans:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background-color: #FAF8F5;
      color: #3D3229;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
    }

    .container {
      text-align: center;
      max-width: 24rem;
    }

    .icon-circle {
      width: 5rem;
      height: 5rem;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background-color: #FFF5F0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-circle svg {
      width: 2.5rem;
      height: 2.5rem;
      color: #C96B4F;
    }

    .brand {
      font-family: 'Instrument Serif', Georgia, serif;
      font-style: italic;
      font-size: 1.75rem;
      color: #C96B4F;
      margin-bottom: 0.75rem;
    }

    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #3D3229;
    }

    p {
      color: #8A7A6A;
      line-height: 1.6;
      margin-bottom: 2rem;
      font-size: 0.9375rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: #C96B4F;
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn:hover { background-color: #A85540; }
    .btn:active { transform: scale(0.97); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-circle">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    </div>
    <div class="brand">Amore</div>
    <h1>You're offline</h1>
    <p>It looks like you've lost your internet connection. Check your Wi-Fi or cellular data and try again.</p>
    <button class="btn" onclick="window.location.reload()">Try again</button>
  </div>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/public/ apps/web/scripts/generate-pwa-icons.mjs
git commit -m "feat(pwa): add placeholder icons and offline fallback page"
```

---

### Task 3: Update __root.tsx with PWA meta tags and SW registration

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`

- [ ] **Step 1: Replace the entire `apps/web/src/routes/__root.tsx` file**

The current file has `head()` returning meta/links arrays, `RootErrorComponent`, and `RootDocument`. The new version adds PWA meta tags to `head()`, registers the service worker in `RootDocument`, and adds apple-touch-icon/favicon links.

```typescript
// File: apps/web/src/routes/__root.tsx
import { HeadContent, Scripts, createRootRoute, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import appCss from '~/styles.css?url'

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Something went wrong -- Amore Couples</title>
        <link rel="stylesheet" href={appCss} />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-warm-600 mb-6">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Amore Couples' },
      { name: 'theme-color', content: '#C96B4F' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png', sizes: '180x180' },
      { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  errorComponent: RootErrorComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // SW registration failed -- this is non-critical
      })
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

Key changes from the original:
1. Added `import { useEffect } from 'react'`
2. Changed viewport meta to include `viewport-fit=cover` (both in `head()` and in `RootErrorComponent`)
3. Added `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` meta tags
4. Added `apple-touch-icon`, `favicon`, and `manifest` links
5. Added `useEffect` in `RootDocument` to register the service worker

- [ ] **Step 2: Verify no type errors**

```bash
cd /Users/partiu/workspace/amore-couples/apps/web && pnpm check-types 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/routes/__root.tsx
git commit -m "feat(pwa): add PWA meta tags and service worker registration to root"
```

---

### Task 4: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run the build**

```bash
cd /Users/partiu/workspace/amore-couples
pnpm --filter @amore-couples/web build 2>&1 | tail -30
```

- [ ] **Step 2: Check that sw.js and manifest exist in the build output**

```bash
# The build output is typically in apps/web/.output/public/ or apps/web/dist/
# Check both possible locations
ls -la /Users/partiu/workspace/amore-couples/apps/web/.output/public/sw.js 2>/dev/null || \
ls -la /Users/partiu/workspace/amore-couples/apps/web/dist/sw.js 2>/dev/null || \
echo "sw.js not found -- check build output location"

ls -la /Users/partiu/workspace/amore-couples/apps/web/.output/public/manifest.webmanifest 2>/dev/null || \
ls -la /Users/partiu/workspace/amore-couples/apps/web/dist/manifest.webmanifest 2>/dev/null || \
echo "manifest.webmanifest not found -- check build output location"
```

If `sw.js` is not in the output, the VitePWA plugin may not be emitting files for SSR builds. In that case, you may need to add `devOptions: { enabled: false }` and `injectRegister: null` to the VitePWA config, and instead rely on the manual SW registration in `__root.tsx`. Check the vite-plugin-pwa docs for SSR/Nitro compatibility.

- [ ] **Step 3: Run type check**

```bash
cd /Users/partiu/workspace/amore-couples/apps/web && pnpm check-types 2>&1 | tail -20
```

- [ ] **Step 4: If build produced sw.js and manifest, commit any build-related fixes**

Only commit if you had to make changes to fix the build. If no changes were needed, skip this step.

```bash
cd /Users/partiu/workspace/amore-couples
git add -A apps/web/
git commit -m "fix(pwa): adjust vite-plugin-pwa config for SSR build compatibility"
```

---

### Task 5: Safe-area CSS fixes

**Files:**
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/routes/_authenticated/-components/nav.tsx`
- Modify: `apps/web/src/routes/_authenticated.tsx`

- [ ] **Step 1: Add safe-area utility classes to `apps/web/src/styles.css`**

Add the following block at the END of the file (after the existing `.animate-draw` rule at line 80):

```css
/* ── PWA safe-area utilities ──────────────────────────────── */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}

/* Overscroll suppression in standalone mode */
@media (display-mode: standalone) {
  html {
    overscroll-behavior: none;
  }
}
```

The current end of the file (for locating where to append):
```css
/* Sparkline draw animation */
@keyframes drawLine {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
.animate-draw { animation: drawLine 1.5s ease-out forwards; stroke-dasharray: 1000; }
```

- [ ] **Step 2: Fix mobile nav bottom padding in `apps/web/src/routes/_authenticated/-components/nav.tsx`**

Find this line (line 29):
```tsx
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-warm-50/80 backdrop-blur-lg border-t border-warm-200 md:hidden">
```

Replace with:
```tsx
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-warm-50/80 backdrop-blur-lg border-t border-warm-200 pb-safe md:hidden">
```

This adds `pb-safe` so the nav respects the home indicator on iPhones with notches.

- [ ] **Step 3: Fix mobile nav touch targets in `apps/web/src/routes/_authenticated/-components/nav.tsx`**

The `NavItem` component (line 187) currently uses `py-1` which is only 4px vertical padding -- too small for comfortable touch targets (44px minimum recommended).

Find the NavItem Link className (line 187):
```tsx
      className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-warm-400 transition-colors"
```

Replace with:
```tsx
      className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-warm-400 transition-colors"
```

Find the NavButtonItem button className (line 220):
```tsx
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
```

Replace with:
```tsx
      className={`relative flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg transition-colors ${
```

- [ ] **Step 4: Fix content area bottom padding in `apps/web/src/routes/_authenticated.tsx`**

Find this line (line 106):
```tsx
      <div className={`md:ml-64 pb-20 md:pb-0 transition-[margin] duration-300 ${coachOpen ? 'lg:mr-[22rem]' : ''}`}>
```

Replace with:
```tsx
      <div className={`md:ml-64 pb-24 md:pb-0 transition-[margin] duration-300 ${coachOpen ? 'lg:mr-[22rem]' : ''}`}>
```

Changed `pb-20` to `pb-24` to account for larger nav touch targets plus safe area.

- [ ] **Step 5: Fix coach FAB position in `apps/web/src/routes/_authenticated.tsx`**

Find this line (line 131):
```tsx
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-all hover:bg-coral-600 active:scale-95 lg:hidden"
```

Replace with:
```tsx
          className="fixed bottom-28 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-all hover:bg-coral-600 active:scale-95 lg:hidden"
```

Changed `bottom-24` to `bottom-28` to maintain spacing above the taller nav.

- [ ] **Step 6: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/styles.css apps/web/src/routes/_authenticated/-components/nav.tsx apps/web/src/routes/_authenticated.tsx
git commit -m "feat(pwa): add safe-area support and fix mobile touch targets"
```

---

### Task 6: Standalone mode hook + overscroll suppression

**Files:**
- Create: `apps/web/src/hooks/use-standalone.ts`

- [ ] **Step 1: Create `apps/web/src/hooks/use-standalone.ts`**

```typescript
// File: apps/web/src/hooks/use-standalone.ts
import { useState, useEffect } from 'react'

/**
 * Detects if the app is running in standalone (installed PWA) mode.
 * Returns true when launched from home screen on iOS/Android.
 */
export function useStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check display-mode media query (Android Chrome, desktop)
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    // Check iOS Safari standalone mode
    const isIosStandalone = 'standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true

    setIsStandalone(mediaQuery.matches || isIosStandalone)

    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches || isIosStandalone)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isStandalone
}
```

Note: The overscroll suppression CSS was already added in Task 5 (the `@media (display-mode: standalone)` rule in styles.css). This hook is for React components that need to conditionally render based on standalone mode.

- [ ] **Step 2: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/hooks/use-standalone.ts
git commit -m "feat(pwa): add useStandalone hook for detecting installed PWA mode"
```

---

### Task 7: Install prompt hook + banner component

**Files:**
- Create: `apps/web/src/hooks/use-install-prompt.ts`
- Create: `apps/web/src/routes/_authenticated/-components/install-banner.tsx`
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`

- [ ] **Step 1: Create `apps/web/src/hooks/use-install-prompt.ts`**

```typescript
// File: apps/web/src/hooks/use-install-prompt.ts
import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface UseInstallPromptReturn {
  /** Whether the install prompt is available (browser supports it and app is not installed) */
  canInstall: boolean
  /** Trigger the native install prompt. Returns true if user accepted. */
  promptInstall: () => Promise<boolean>
  /** Dismiss the banner without installing */
  dismiss: () => void
  /** Whether the user has dismissed the banner this session */
  dismissed: boolean
}

const DISMISS_KEY = 'amore-pwa-install-dismissed'

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if previously dismissed (session storage -- resets each session)
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detect if app was installed
    const installedHandler = () => {
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }, [])

  return {
    canInstall: deferredPrompt !== null,
    promptInstall,
    dismiss,
    dismissed,
  }
}
```

- [ ] **Step 2: Create `apps/web/src/routes/_authenticated/-components/install-banner.tsx`**

```tsx
// File: apps/web/src/routes/_authenticated/-components/install-banner.tsx
import { useInstallPrompt } from '~/hooks/use-install-prompt'

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss, dismissed } = useInstallPrompt()

  if (!canInstall || dismissed) return null

  return (
    <div className="card flex items-center gap-4 p-4 animate-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900">Install Amore</p>
        <p className="text-xs text-warm-500">Add to your home screen for the best experience</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-xs font-medium text-warm-500 hover:text-warm-700 transition-colors"
        >
          Later
        </button>
        <button
          onClick={() => promptInstall()}
          className="px-4 py-1.5 text-xs font-medium bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add InstallBanner to dashboard**

In `apps/web/src/routes/_authenticated/dashboard.tsx`, add the import and render the banner.

Find this import block at the top of the file (lines 1-18):
```typescript
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getIntelligence, triggerAnalysis } from '~/server/intelligence'
import { getActiveCoaching } from '~/server/coaching'
import { getPendingMoodDetections } from '~/server/mood-detection'
import {
  getPendingRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '~/server/connections'
import { CoupleHero } from './-components/couple-hero'
import { MoodSelector } from './-components/mood-selector'
import { GoalsCard } from './-components/goals-card'
import { InsightsCard } from './-components/insights-card'
import { CoachingCard } from './-components/coaching-card'
import { PatternCards } from './-components/pattern-cards'
import { MoodDetectionModal } from './-components/mood-detection-modal'
import { OnboardingCard } from './-components/onboarding-card'
```

Replace with:
```typescript
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getIntelligence, triggerAnalysis } from '~/server/intelligence'
import { getActiveCoaching } from '~/server/coaching'
import { getPendingMoodDetections } from '~/server/mood-detection'
import {
  getPendingRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '~/server/connections'
import { CoupleHero } from './-components/couple-hero'
import { MoodSelector } from './-components/mood-selector'
import { GoalsCard } from './-components/goals-card'
import { InsightsCard } from './-components/insights-card'
import { CoachingCard } from './-components/coaching-card'
import { PatternCards } from './-components/pattern-cards'
import { MoodDetectionModal } from './-components/mood-detection-modal'
import { OnboardingCard } from './-components/onboarding-card'
import { InstallBanner } from './-components/install-banner'
```

Then find this block in the `CouplesDashboard` function (lines 182-184):
```tsx
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <CoupleHero
        userName={data.userName}
```

Replace with:
```tsx
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <InstallBanner />
      <CoupleHero
        userName={data.userName}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/hooks/use-install-prompt.ts apps/web/src/routes/_authenticated/-components/install-banner.tsx apps/web/src/routes/_authenticated/dashboard.tsx
git commit -m "feat(pwa): add install prompt hook and banner component"
```

---

### Task 8: Online/offline hooks + indicator

**Files:**
- Create: `apps/web/src/hooks/use-online-status.ts`
- Create: `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx`
- Modify: `apps/web/src/routes/_authenticated.tsx`

- [ ] **Step 1: Create `apps/web/src/hooks/use-online-status.ts`**

```typescript
// File: apps/web/src/hooks/use-online-status.ts
import { useState, useEffect } from 'react'

/**
 * Tracks browser online/offline state via navigator.onLine and events.
 * Returns true when the browser reports being online.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state from browser
    setIsOnline(navigator.onLine)

    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
```

- [ ] **Step 2: Create `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx`**

```tsx
// File: apps/web/src/routes/_authenticated/-components/offline-indicator.tsx
import { useOnlineStatus } from '~/hooks/use-online-status'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-warm-800 text-white text-center py-2 text-sm font-medium shadow-lg pt-safe">
      <div className="flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        You're offline -- some features may be unavailable
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add OfflineIndicator to `apps/web/src/routes/_authenticated.tsx`**

Find this import block at lines 1-13:
```typescript
import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
  useLocation,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getAuthSession } from '~/server/auth'
import { getMyCouple } from '~/server/connections'
import { getCoachNudges } from '~/server/coach'
import { Nav } from './_authenticated/-components/nav'
import { CoachSidebar } from './_authenticated/-components/coach-sidebar'
```

Replace with:
```typescript
import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
  useLocation,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getAuthSession } from '~/server/auth'
import { getMyCouple } from '~/server/connections'
import { getCoachNudges } from '~/server/coach'
import { Nav } from './_authenticated/-components/nav'
import { CoachSidebar } from './_authenticated/-components/coach-sidebar'
import { OfflineIndicator } from './_authenticated/-components/offline-indicator'
```

Then find the opening of the return in `AuthenticatedLayout` (line 94-96):
```tsx
    return (
    <div className="min-h-screen bg-warm-50">
      <Nav
```

Replace with:
```tsx
    return (
    <div className="min-h-screen bg-warm-50">
      <OfflineIndicator />
      <Nav
```

- [ ] **Step 4: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/hooks/use-online-status.ts apps/web/src/routes/_authenticated/-components/offline-indicator.tsx apps/web/src/routes/_authenticated.tsx
git commit -m "feat(pwa): add offline indicator with online/offline detection"
```

---

### Task 9: Offline-aware enhancements to existing hooks

**Files:**
- Modify: `apps/web/src/hooks/use-chat-websocket.ts`
- Modify: `apps/web/src/hooks/use-dashboard-events.ts`

- [ ] **Step 1: Add offline awareness to `apps/web/src/hooks/use-dashboard-events.ts`**

Replace the ENTIRE file content with:

```typescript
// File: apps/web/src/hooks/use-dashboard-events.ts
import { useEffect, useRef } from 'react'

type DashboardEvent =
  | { type: 'mood_update'; data: { userId: string; mood: string; visibility: string } }
  | { type: 'goal_update'; data: { goalId: string; status: string } }
  | { type: 'insight_update'; data: { insightId: string; type: string } }
  | { type: 'analysis_complete'; data: { coupleId: string } }

export type { DashboardEvent }

export function useDashboardEvents(onEvent: (event: DashboardEvent) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let source: EventSource | null = null
    let disposed = false

    function connect() {
      if (disposed) return
      // Don't attempt SSE connection when offline
      if (!navigator.onLine) return

      source = new EventSource('/sse/updates')

      source.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as DashboardEvent
          onEventRef.current(event)
        } catch {
          /* ignore parse errors */
        }
      }

      source.onerror = () => {
        // Close the errored source; we'll reconnect when we come back online
        source?.close()
        source = null
      }
    }

    function handleOnline() {
      // Reconnect SSE when browser comes back online
      if (!source) {
        connect()
      }
    }

    function handleOffline() {
      // Close SSE cleanly when going offline
      source?.close()
      source = null
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    connect()

    return () => {
      disposed = true
      source?.close()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}
```

Key changes from original:
1. Added `useRef` for stable callback reference
2. `connect()` checks `navigator.onLine` before creating EventSource
3. Added `online`/`offline` event listeners to pause/resume SSE
4. On error, the source is closed gracefully instead of relying on auto-reconnect

- [ ] **Step 2: Add `isOffline` to `use-chat-websocket.ts` return value**

This step adds an `isOffline` boolean to the hook's return value so the chat UI can show offline state.

In `apps/web/src/hooks/use-chat-websocket.ts`, find the interface at line 4:
```typescript
interface UseChatWebSocketReturn {
  messages: ChatMessage[]
  send: (text: string, jid: string) => void
  loadMore: () => void
  connectionStatus: ConnectionStatus
  isLoading: boolean
  hasMore: boolean
  requestResync: () => void
  isResyncing: boolean
  partnerName: string
}
```

Replace with:
```typescript
interface UseChatWebSocketReturn {
  messages: ChatMessage[]
  send: (text: string, jid: string) => void
  loadMore: () => void
  connectionStatus: ConnectionStatus
  isLoading: boolean
  hasMore: boolean
  requestResync: () => void
  isResyncing: boolean
  partnerName: string
  isOffline: boolean
}
```

Find the import line at line 1:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
```

This stays the same (no new imports needed -- we'll use navigator.onLine).

Find the state declarations around lines 27-34:
```typescript
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)
  const [partnerName, setPartnerName] = useState('Partner')
```

Replace with:
```typescript
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)
  const [partnerName, setPartnerName] = useState('Partner')
  const [isOffline, setIsOffline] = useState(false)
```

Find the connect-on-mount useEffect (lines 494-514):
```typescript
  // Connect on mount
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      // Clear all send timeouts
      for (const timeout of sendTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      sendTimeoutsRef.current.clear()

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
```

Replace with:
```typescript
  // Connect on mount + track online/offline
  useEffect(() => {
    mountedRef.current = true

    const handleOnline = () => {
      setIsOffline(false)
      // Reconnect WS if not already connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect()
      }
    }
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    connect()

    return () => {
      mountedRef.current = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      // Clear all send timeouts
      for (const timeout of sendTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      sendTimeoutsRef.current.clear()

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
```

Find the return statement (lines 516-527):
```typescript
  return {
    messages,
    send,
    loadMore,
    connectionStatus,
    isLoading,
    hasMore,
    partnerName,
    requestResync,
    isResyncing,
  }
```

Replace with:
```typescript
  return {
    messages,
    send,
    loadMore,
    connectionStatus,
    isLoading,
    hasMore,
    partnerName,
    requestResync,
    isResyncing,
    isOffline,
  }
```

- [ ] **Step 3: Verify types**

```bash
cd /Users/partiu/workspace/amore-couples/apps/web && pnpm check-types 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
cd /Users/partiu/workspace/amore-couples
git add apps/web/src/hooks/use-chat-websocket.ts apps/web/src/hooks/use-dashboard-events.ts
git commit -m "feat(pwa): add offline awareness to chat websocket and dashboard SSE hooks"
```

---

### Task 10: Final build + type check verification

**Files:** None (verification only)

- [ ] **Step 1: Run type check**

```bash
cd /Users/partiu/workspace/amore-couples/apps/web && pnpm check-types 2>&1 | tail -30
```

If there are type errors, fix them before proceeding.

- [ ] **Step 2: Run full build**

```bash
cd /Users/partiu/workspace/amore-couples
pnpm --filter @amore-couples/web build 2>&1 | tail -30
```

- [ ] **Step 3: Verify all new files exist**

```bash
echo "=== New hooks ==="
ls -la /Users/partiu/workspace/amore-couples/apps/web/src/hooks/use-standalone.ts
ls -la /Users/partiu/workspace/amore-couples/apps/web/src/hooks/use-install-prompt.ts
ls -la /Users/partiu/workspace/amore-couples/apps/web/src/hooks/use-online-status.ts

echo "=== New components ==="
ls -la /Users/partiu/workspace/amore-couples/apps/web/src/routes/_authenticated/-components/install-banner.tsx
ls -la /Users/partiu/workspace/amore-couples/apps/web/src/routes/_authenticated/-components/offline-indicator.tsx

echo "=== Public assets ==="
ls -la /Users/partiu/workspace/amore-couples/apps/web/public/

echo "=== PWA build output ==="
find /Users/partiu/workspace/amore-couples/apps/web/.output -name "sw.js" -o -name "manifest.webmanifest" 2>/dev/null || \
find /Users/partiu/workspace/amore-couples/apps/web/dist -name "sw.js" -o -name "manifest.webmanifest" 2>/dev/null || \
echo "Check build output directory manually"
```

- [ ] **Step 4: If everything passes, no commit needed. If fixes were required, commit them.**

```bash
cd /Users/partiu/workspace/amore-couples
git add -A apps/web/
git commit -m "fix(pwa): resolve build and type errors from PWA implementation"
```

---

## Summary of all files created/modified

### New files
| File | Purpose |
|------|---------|
| `apps/web/public/offline.html` | Self-contained offline fallback page |
| `apps/web/public/pwa-icon-192x192.png` | PWA icon 192x192 (placeholder) |
| `apps/web/public/pwa-icon-512x512.png` | PWA icon 512x512 (placeholder) |
| `apps/web/public/apple-touch-icon-180x180.png` | Apple touch icon (placeholder) |
| `apps/web/public/favicon-32x32.png` | Favicon (placeholder) |
| `apps/web/scripts/generate-pwa-icons.mjs` | Script to regenerate placeholder icons |
| `apps/web/src/hooks/use-standalone.ts` | Detect standalone/installed PWA mode |
| `apps/web/src/hooks/use-install-prompt.ts` | Capture and trigger PWA install prompt |
| `apps/web/src/hooks/use-online-status.ts` | Track browser online/offline state |
| `apps/web/src/routes/_authenticated/-components/install-banner.tsx` | Install prompt banner |
| `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx` | Offline status bar |

### Modified files
| File | Changes |
|------|---------|
| `apps/web/package.json` | Added `vite-plugin-pwa` devDependency |
| `apps/web/vite.config.ts` | Added VitePWA plugin with manifest + workbox config |
| `apps/web/src/routes/__root.tsx` | PWA meta tags, manifest link, SW registration |
| `apps/web/src/styles.css` | Safe-area utilities, standalone overscroll suppression |
| `apps/web/src/routes/_authenticated.tsx` | OfflineIndicator, adjusted padding for safe areas |
| `apps/web/src/routes/_authenticated/-components/nav.tsx` | Safe-area padding, larger touch targets |
| `apps/web/src/routes/_authenticated/dashboard.tsx` | InstallBanner component |
| `apps/web/src/hooks/use-chat-websocket.ts` | Added `isOffline` state + online/offline listeners |
| `apps/web/src/hooks/use-dashboard-events.ts` | Offline-aware SSE with pause/resume |

### Post-launch TODO
- Replace placeholder PNG icons with real Amore brand assets (coral heart logo)
- Test on physical iOS device (Safari requires HTTPS for SW)
- Test on physical Android device (Chrome install prompt flow)
- Consider adding `screenshots` to manifest for richer install UI
