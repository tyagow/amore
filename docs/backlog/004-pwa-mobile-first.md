# TICKET-004: PWA / Mobile-First Experience

## Priority: P1 — High

## Problem Statement

Amore Couples is a relationship health platform — couples communicate on their phones, but the app only exists as a browser tab. There is no PWA manifest (`apps/web/public/` is empty), no service worker, no install prompt, no offline support, and no `apple-touch-icon` or `theme-color` meta tag in `apps/web/src/routes/__root.tsx`. The viewport meta tag exists but there is no `apple-mobile-web-app-capable` or `apple-mobile-web-app-status-bar-style` configuration.

A relationship app that does not live on the home screen is fighting an uphill battle for daily engagement. Users must open a browser, type a URL, and wait for a full page load — every single time. On mobile Safari and Chrome, there is no visual distinction from any other website.

The mobile bottom nav (`apps/web/src/routes/_authenticated/-components/nav.tsx:29`) and coach FAB (`apps/web/src/routes/_authenticated.tsx:129-141`) already exist, but they have no safe-area awareness beyond a single instance in the coach sidebar input (`coach-sidebar.tsx:437`). The fixed bottom nav does not account for `env(safe-area-inset-bottom)`, meaning it clips behind the home indicator on notched iPhones when installed as a PWA.

PWA also unlocks Web Push API — a hard dependency for TICKET-001 (Push Notifications). Without a registered service worker, `PushManager.subscribe()` is unavailable. PWA + push + daily check-in compound — each feature is weaker without the others.

Current state summary:
- No `manifest.json` or `manifest.webmanifest` anywhere in the codebase
- No service worker registration
- No offline fallback page
- No install prompt UX
- No `apple-touch-icon`, `theme-color`, or Apple PWA meta tags in `__root.tsx`
- No icons in `apps/web/public/` (directory is empty)
- `apps/web/vite.config.ts` has no PWA plugin (`vite-plugin-pwa` or equivalent)
- Safe-area insets used in exactly one place (`coach-sidebar.tsx:437`) — nowhere else

## Goals & Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Lighthouse PWA score | >= 90 with all required checks passing | Run Lighthouse audit on deployed production URL |
| Install prompt conversion | >= 20% of mobile users install within first week | Track `beforeinstallprompt` event fires vs. accepted installs |
| Offline shell availability | App shell loads within 2s on offline revisit | Lighthouse "current page responds with 200 when offline" check |
| Time to interactive (mobile) | < 3s on 4G throttled connection | Lighthouse Performance audit on mobile preset |
| iOS home screen experience | Full-screen app with correct status bar and splash | Manual QA: add to home screen on iOS Safari, verify no browser chrome |
| Service worker registration | 100% of page loads register SW within 3s | `navigator.serviceWorker.controller` check in production |

## User Stories

**As a user on my phone**, I want to install Amore to my home screen so I can open it like a native app without navigating through a browser.

**As a user opening the app on the subway**, I want to see the app shell and my last-loaded dashboard data, even if I have no signal, so the experience does not feel broken.

**As a user on an iPhone with a notch**, I want the bottom nav and coach button to sit above the home indicator, not behind it, so I can tap every button without accidentally swiping home.

**As a user who returns to the app daily**, I want it to load instantly from cache, so I do not wait for a full network round-trip every time.

**As a partner receiving a push notification (TICKET-001)**, I need a service worker registered so that Web Push can deliver notifications even when the app tab is closed.

**As a user on a small screen**, I want every page to be fully usable without horizontal scrolling or overlapping elements, so I do not miss any content.

## Technical Design

### Architecture Overview

```
[Vite Build]
    |
    +-- vite-plugin-pwa (Workbox)
    |     +-- generates service worker (sw.js)
    |     +-- generates manifest.webmanifest
    |     +-- precaches app shell (HTML, CSS, JS, fonts)
    |
    +-- apps/web/public/
          +-- icons/ (192x192, 512x512, maskable, apple-touch-icon)
          +-- offline.html (fallback page)

[Runtime]
    Browser --> service worker --> cache-first for app shell
                              --> network-first for API calls (/api/*, server functions)
                              --> stale-while-revalidate for fonts + images
                              --> offline.html fallback for navigation failures

[Install Flow]
    beforeinstallprompt event --> deferred --> shown after 2nd authenticated visit
    iOS: manual "Add to Home Screen" (no prompt API) --> detected via display-mode: standalone
```

### Implementation Phases

#### Phase 1: PWA Foundation (Manifest, Icons, Meta Tags, Service Worker)

**Goal:** Pass Lighthouse PWA audit. App is installable on Android and iOS.

1. **Install `vite-plugin-pwa`** as a dev dependency in `apps/web/package.json`.

2. **Configure `vite-plugin-pwa`** in `apps/web/vite.config.ts`:
   - `registerType: 'autoUpdate'` — SW auto-updates without user prompt
   - `includeAssets: ['icons/*.png', 'offline.html']`
   - `manifest` object with:
     - `name: 'Amore Couples'`
     - `short_name: 'Amore'`
     - `description: 'Relationship health & coaching for couples'`
     - `theme_color: '#C96B4F'` (coral-500 from `apps/web/src/styles.css:25`)
     - `background_color: '#FAF8F5'` (warm-50 from `apps/web/src/styles.css:10`)
     - `display: 'standalone'`
     - `orientation: 'portrait'`
     - `start_url: '/dashboard'`
     - `scope: '/'`
     - `icons` array: 192x192, 512x512, maskable variants
   - `workbox.navigateFallback: '/offline.html'`
   - `workbox.navigateFallbackDenylist: [/^\/api\//, /^\/sse\//, /^\/ws\//]` — exclude API, SSE, and WebSocket routes
   - `workbox.runtimeCaching` rules:
     - Google Fonts: `CacheFirst`, max 30 entries, 365 day expiry
     - API routes (`/api/*`): `NetworkFirst`, max 50 entries, 24h expiry
     - Server function calls: `NetworkOnly` (no caching for mutations)

3. **Create icon assets** in `apps/web/public/icons/`:
   - `icon-192x192.png` — standard Android icon
   - `icon-512x512.png` — splash screen icon
   - `icon-maskable-192x192.png` — Android adaptive icon (safe zone padded)
   - `icon-maskable-512x512.png` — Android adaptive splash
   - `apple-touch-icon.png` — 180x180 iOS home screen icon

4. **Create `apps/web/public/offline.html`** — minimal branded offline page:
   - Uses inline styles (no external CSS dependencies)
   - Shows "You're offline" message with Amore branding (coral accent)
   - "Try again" button that calls `window.location.reload()`

5. **Update `apps/web/src/routes/__root.tsx`** — add to the `head()` function's `meta` array:
   - `{ name: 'theme-color', content: '#C96B4F' }`
   - `{ name: 'apple-mobile-web-app-capable', content: 'yes' }`
   - `{ name: 'apple-mobile-web-app-status-bar-style', content: 'default' }`
   - Add to `links` array:
     - `{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }`
     - `{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/icon-32x32.png' }`
   - Also add these same meta tags + links to the `RootErrorComponent` `<head>` (lines 7-11)

6. **Register the service worker** — `vite-plugin-pwa` auto-injects the registration script via its virtual module. Import `registerSW` from `virtual:pwa-register` in a client-side entry point or in `__root.tsx`'s `RootDocument` component. Verify the `<script>` tag appears in the built HTML.

7. **Update `apps/web/Dockerfile`** — no changes needed. The built `.output` directory will include the generated `sw.js` and `manifest.webmanifest` files. Verify they are present in the build output.

**Files to create:**
- `apps/web/public/icons/icon-192x192.png`
- `apps/web/public/icons/icon-512x512.png`
- `apps/web/public/icons/icon-maskable-192x192.png`
- `apps/web/public/icons/icon-maskable-512x512.png`
- `apps/web/public/icons/apple-touch-icon.png`
- `apps/web/public/icons/icon-32x32.png`
- `apps/web/public/offline.html`

**Files to modify:**
- `apps/web/package.json` — add `vite-plugin-pwa` dev dependency
- `apps/web/vite.config.ts` — add VitePWA plugin configuration
- `apps/web/src/routes/__root.tsx` — add meta tags, links, SW registration

#### Phase 2: Safe-Area & Mobile UX Polish

**Goal:** The app feels native on notched iPhones and modern Android devices when installed as a standalone PWA.

1. **Add `viewport-fit=cover`** to the viewport meta tag in `apps/web/src/routes/__root.tsx`:
   - Change: `{ name: 'viewport', content: 'width=device-width, initial-scale=1' }`
   - To: `{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }`
   - Also update the hardcoded `<meta>` in `RootErrorComponent` (line 9)

2. **Fix mobile bottom nav safe-area** in `apps/web/src/routes/_authenticated/-components/nav.tsx`:
   - Line 29: change `<nav className="fixed bottom-0 ...">` inner `<div>` (line 30) padding from `py-2` to `pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2`
   - This ensures the nav sits above the home indicator on notched iPhones

3. **Fix page content bottom padding** in `apps/web/src/routes/_authenticated.tsx`:
   - Line 106: change `pb-20` to `pb-[calc(5rem+env(safe-area-inset-bottom,0px))]` so page content does not hide behind the now-taller nav

4. **Fix coach FAB position** in `apps/web/src/routes/_authenticated.tsx`:
   - Line 131: change `bottom-24` to `bottom-[calc(6rem+env(safe-area-inset-bottom,0px))]` so the floating coach button stays above the safe-area-adjusted nav

5. **Add standalone mode detection hook** — create `apps/web/src/hooks/use-standalone.ts`:
   ```typescript
   export function useIsStandalone(): boolean {
     // Detects PWA standalone mode (Android + iOS)
     return window.matchMedia('(display-mode: standalone)').matches
       || (window.navigator as any).standalone === true
   }
   ```
   This hook enables conditional behavior (e.g., hiding browser-only UI, adjusting layout) when the app is running as an installed PWA.

6. **Suppress mobile browser pull-to-refresh** in standalone mode — add `overscroll-behavior-y: contain` to the `<body>` in `apps/web/src/styles.css` when in standalone display mode:
   ```css
   @media (display-mode: standalone) {
     body { overscroll-behavior-y: contain; }
   }
   ```

7. **Audit touch targets** — ensure all interactive elements in the mobile bottom nav (`nav.tsx`) have a minimum 44x44px touch target. The current nav items use `px-3 py-1` (line 187) which is likely undersized. Increase to `px-3 py-2` minimum.

**Files to create:**
- `apps/web/src/hooks/use-standalone.ts`

**Files to modify:**
- `apps/web/src/routes/__root.tsx` — viewport-fit=cover
- `apps/web/src/routes/_authenticated/-components/nav.tsx` — safe-area padding, touch targets
- `apps/web/src/routes/_authenticated.tsx` — safe-area bottom padding, FAB position
- `apps/web/src/styles.css` — standalone overscroll behavior

#### Phase 3: Install Prompt & Offline UX

**Goal:** Users are prompted to install on their second visit. Offline state is communicated gracefully.

1. **Create install prompt hook** — `apps/web/src/hooks/use-install-prompt.ts`:
   - Capture `beforeinstallprompt` event, defer it
   - Expose `canInstall: boolean`, `promptInstall(): Promise<void>`, `isInstalled: boolean`
   - Store dismissal in `localStorage` with 7-day cooldown
   - Track install outcome (`accepted` / `dismissed`) for metrics

2. **Create `InstallBanner` component** — `apps/web/src/routes/_authenticated/-components/install-banner.tsx`:
   - Shown on the dashboard page after the 2nd authenticated visit (check `localStorage` visit counter)
   - Dismissible — stores dismissal timestamp in localStorage
   - Shows on Android (where `beforeinstallprompt` fires) with a "Install Amore" CTA
   - Shows on iOS (where no prompt API exists) with "Add to Home Screen" instructions (tap Share > Add to Home Screen)
   - Uses `useIsStandalone()` to hide when already installed
   - Positioned below the hero card on the dashboard, above other cards

3. **Add the `InstallBanner`** to `apps/web/src/routes/_authenticated/dashboard.tsx` — render it between the hero section and the main content grid.

4. **Create online/offline status hook** — `apps/web/src/hooks/use-online-status.ts`:
   - Wraps `navigator.onLine` + `online`/`offline` events
   - Returns `{ isOnline: boolean }`

5. **Create `OfflineIndicator` component** — `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx`:
   - Thin bar at the top of the viewport: "You're offline — some features may be unavailable"
   - Uses warm-800 background with white text
   - Appears/disappears with a slide-down animation
   - Rendered in `apps/web/src/routes/_authenticated.tsx` at the top of the layout, above the `<Outlet />`

6. **Enhance `useChatWebSocket`** (`apps/web/src/hooks/use-chat-websocket.ts`) — when offline, show a visible "offline" state instead of silently retrying. The hook already has reconnection logic; add an `isOffline` flag that the chat UI can display.

7. **Enhance `useDashboardEvents`** (`apps/web/src/hooks/use-dashboard-events.ts`) — when offline, pause SSE reconnection attempts and resume when back online. Prevents battery drain from rapid reconnect loops on mobile.

**Files to create:**
- `apps/web/src/hooks/use-install-prompt.ts`
- `apps/web/src/hooks/use-online-status.ts`
- `apps/web/src/routes/_authenticated/-components/install-banner.tsx`
- `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx`

**Files to modify:**
- `apps/web/src/routes/_authenticated/dashboard.tsx` — add InstallBanner
- `apps/web/src/routes/_authenticated.tsx` — add OfflineIndicator
- `apps/web/src/hooks/use-chat-websocket.ts` — offline-aware state
- `apps/web/src/hooks/use-dashboard-events.ts` — offline-aware SSE pause

### Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/public/icons/*` | Create | PWA icons (6 files) |
| `apps/web/public/offline.html` | Create | Offline fallback page |
| `apps/web/src/hooks/use-standalone.ts` | Create | Detect PWA standalone mode |
| `apps/web/src/hooks/use-install-prompt.ts` | Create | Manage install prompt lifecycle |
| `apps/web/src/hooks/use-online-status.ts` | Create | Online/offline detection |
| `apps/web/src/routes/_authenticated/-components/install-banner.tsx` | Create | Install CTA component |
| `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx` | Create | Offline status bar |
| `apps/web/package.json` | Modify | Add vite-plugin-pwa |
| `apps/web/vite.config.ts` | Modify | VitePWA plugin config |
| `apps/web/src/routes/__root.tsx` | Modify | Meta tags, links, viewport-fit, SW registration |
| `apps/web/src/routes/_authenticated.tsx` | Modify | Safe-area padding, OfflineIndicator |
| `apps/web/src/routes/_authenticated/-components/nav.tsx` | Modify | Safe-area, touch targets |
| `apps/web/src/styles.css` | Modify | Standalone overscroll behavior |
| `apps/web/src/hooks/use-chat-websocket.ts` | Modify | Offline-aware state |
| `apps/web/src/hooks/use-dashboard-events.ts` | Modify | Offline-aware SSE |
| `apps/web/src/routes/_authenticated/dashboard.tsx` | Modify | Render InstallBanner |

### Integration Points

- **TICKET-001 (Push Notifications):** The service worker registered in Phase 1 is a hard prerequisite for `PushManager.subscribe()`. TICKET-001's push subscription flow should check `navigator.serviceWorker.ready` before attempting subscription. The SW created here should be extended in TICKET-001 to handle `push` and `notificationclick` events.
- **SSE endpoints** (`/sse/updates`, `/sse/user-events`, `/sse/coach`): Must be excluded from service worker caching via `navigateFallbackDenylist` — SSE requires live connections.
- **WebSocket chat** (`/ws/chat`): Must be excluded from SW interception. Workbox does not intercept WebSocket by default, but the explicit denylist ensures it.
- **Server functions** (TanStack Start RPC): These go through `/_server` paths. Configure as `NetworkOnly` in Workbox to prevent stale mutation responses.
- **Google Fonts** (loaded in `styles.css:1`): Cache with `CacheFirst` strategy for offline font availability.
- **Nitro static asset serving**: The `apps/web/server/` directory serves API routes. The `public/` directory contents are served as static files by Nitro/Vite. Verify `manifest.webmanifest` and `sw.js` are accessible at root paths after build.

## Acceptance Criteria

### Phase 1: PWA Foundation
- [ ] AC-1.1: File `apps/web/public/icons/icon-192x192.png` exists and is a valid PNG image with dimensions 192x192 pixels
- [ ] AC-1.2: File `apps/web/public/icons/icon-512x512.png` exists and is a valid PNG image with dimensions 512x512 pixels
- [ ] AC-1.3: File `apps/web/public/icons/apple-touch-icon.png` exists and is a valid PNG image with dimensions 180x180 pixels
- [ ] AC-1.4: File `apps/web/public/offline.html` exists and contains a "Try again" button that calls `window.location.reload()`
- [ ] AC-1.5: `apps/web/package.json` lists `vite-plugin-pwa` in `devDependencies`
- [ ] AC-1.6: `apps/web/vite.config.ts` imports and configures `VitePWA` with `registerType: 'autoUpdate'`
- [ ] AC-1.7: The manifest configuration in `vite.config.ts` includes `name: 'Amore Couples'`, `short_name: 'Amore'`, `theme_color: '#C96B4F'`, `background_color: '#FAF8F5'`, `display: 'standalone'`, and `start_url: '/dashboard'`
- [ ] AC-1.8: The Workbox `navigateFallbackDenylist` in `vite.config.ts` includes patterns that exclude `/api/`, `/sse/`, and `/ws/` paths
- [ ] AC-1.9: `apps/web/src/routes/__root.tsx` `head()` meta array includes `{ name: 'theme-color', content: '#C96B4F' }`
- [ ] AC-1.10: `apps/web/src/routes/__root.tsx` `head()` links array includes an `apple-touch-icon` entry pointing to `/icons/apple-touch-icon.png`
- [ ] AC-1.11: Running `pnpm --filter @amore-couples/web build` completes without errors and produces `sw.js` in the build output directory
- [ ] AC-1.12: Running Lighthouse PWA audit on the deployed app returns a score of 90 or higher with all "Installable" checks passing
- [ ] AC-1.13: The deployed app serves `/manifest.webmanifest` (or `/manifest.json`) with HTTP 200 and correct `Content-Type: application/manifest+json`
- [ ] AC-1.14: `apps/web/src/routes/__root.tsx` includes meta tags `apple-mobile-web-app-capable` with value `yes` and `apple-mobile-web-app-status-bar-style` with value `default`

### Phase 2: Safe-Area & Mobile UX Polish
- [ ] AC-2.1: The viewport meta tag in `apps/web/src/routes/__root.tsx` contains `viewport-fit=cover`
- [ ] AC-2.2: The mobile bottom nav in `apps/web/src/routes/_authenticated/-components/nav.tsx` uses `env(safe-area-inset-bottom)` in its padding
- [ ] AC-2.3: The page content wrapper in `apps/web/src/routes/_authenticated.tsx` accounts for `env(safe-area-inset-bottom)` in its bottom padding
- [ ] AC-2.4: The coach FAB button in `apps/web/src/routes/_authenticated.tsx` positions itself using `env(safe-area-inset-bottom)` so it sits above the adjusted nav
- [ ] AC-2.5: File `apps/web/src/hooks/use-standalone.ts` exists and exports a `useIsStandalone` function that checks both `display-mode: standalone` media query and `navigator.standalone`
- [ ] AC-2.6: `apps/web/src/styles.css` contains a `@media (display-mode: standalone)` rule that sets `overscroll-behavior-y: contain` on body
- [ ] AC-2.7: All mobile nav items in `nav.tsx` have a minimum touch target of 44x44 CSS pixels (padding adjusted from `py-1` to at least `py-2`)
- [ ] AC-2.8: On an iPhone with a notch (or simulator), the bottom nav and coach FAB do not overlap with the home indicator when the app is added to the home screen

### Phase 3: Install Prompt & Offline UX
- [ ] AC-3.1: File `apps/web/src/hooks/use-install-prompt.ts` exists and exports `canInstall`, `promptInstall`, and `isInstalled`
- [ ] AC-3.2: File `apps/web/src/hooks/use-online-status.ts` exists and exports `isOnline` state that updates on `online`/`offline` browser events
- [ ] AC-3.3: File `apps/web/src/routes/_authenticated/-components/install-banner.tsx` exists and renders differently for Android (prompt button) vs iOS (manual instructions)
- [ ] AC-3.4: The `InstallBanner` does not render when `useIsStandalone()` returns true (app already installed)
- [ ] AC-3.5: The `InstallBanner` does not render on the user's first visit — only on the 2nd or later authenticated visit (tracked via localStorage)
- [ ] AC-3.6: Dismissing the `InstallBanner` stores a timestamp in localStorage and the banner does not reappear for 7 days
- [ ] AC-3.7: File `apps/web/src/routes/_authenticated/-components/offline-indicator.tsx` exists and renders a visible bar when `isOnline` is false
- [ ] AC-3.8: The `OfflineIndicator` is rendered in `apps/web/src/routes/_authenticated.tsx` layout, above the `<Outlet />`
- [ ] AC-3.9: `apps/web/src/hooks/use-chat-websocket.ts` exposes an `isOffline` state that is true when `navigator.onLine` is false
- [ ] AC-3.10: `apps/web/src/hooks/use-dashboard-events.ts` pauses SSE reconnection when offline and resumes on the `online` event
- [ ] AC-3.11: With airplane mode enabled after initial load, navigating to the dashboard shows the cached app shell (not a browser error page) and the offline indicator bar is visible

## Edge Cases & Risks

1. **TanStack Start SSR + Service Worker conflict:** TanStack Start uses Nitro for SSR. The service worker must not cache SSR HTML responses for authenticated routes — those contain user-specific data. The `navigateFallback` should only serve `offline.html` for failed navigations, not cached HTML from other users' sessions. Workbox's `navigateFallbackDenylist` must cover `/_server` (TanStack server function RPC path).

2. **vite-plugin-pwa compatibility with Nitro:** The plugin generates `sw.js` and injects registration code. Verify the generated SW is included in Nitro's `.output/public/` directory during `vite build`. If not, a custom copy step in the build pipeline may be needed.

3. **iOS PWA limitations:**
   - No `beforeinstallprompt` event — must show manual "Add to Home Screen" instructions
   - Push notifications require iOS 16.4+ and the app to be added to home screen
   - No badge API on iOS
   - Background sync is not supported
   - Service worker cache is evicted after ~7 days of non-use on iOS Safari

4. **Cache invalidation on deploy:** `registerType: 'autoUpdate'` means the SW checks for updates on every navigation. If the new SW has breaking changes (e.g., new API contract), users on the old cached version may see errors until the SW updates. Consider a "new version available" toast in a future iteration.

5. **Offline data freshness:** The offline shell shows cached data. Stale dashboard data (old health score, expired moods) could be misleading. The `OfflineIndicator` mitigates this by clearly communicating offline state, but consider adding "last updated" timestamps to key cards.

6. **Service worker scope and Nitro routes:** The SW defaults to `/` scope. Ensure it does not intercept Nitro server routes (`/api/*`, `/sse/*`, `/ws/*`). The `navigateFallbackDenylist` handles this, but any new server route paths added later must also be excluded.

7. **Multiple tabs:** If a user has the app open in both a browser tab and as an installed PWA, both register the same service worker. Push notifications (TICKET-001) will need to handle deduplication to avoid double-delivery.

8. **Google Fonts offline:** The Google Fonts import in `apps/web/src/styles.css:1` loads via external URL. The CacheFirst strategy caches font files, but the CSS `@import` itself may fail offline on first load. Consider self-hosting the fonts (DM Sans + Instrument Serif) in `public/fonts/` for guaranteed offline availability.

## Dependencies

- **TICKET-001 (Push Notifications):** This ticket creates the service worker that TICKET-001 requires. Implement this first. TICKET-001 extends the SW with push event handlers.
- **`vite-plugin-pwa` package:** New dev dependency. Well-maintained (1M+ weekly downloads), wraps Workbox. Compatible with Vite 7.x (verify latest version supports Vite 7.3.1 from `apps/web/package.json:40`).
- **Icon assets:** Need a designer to produce the Amore logo at required sizes (192, 512, 180, 32) with maskable-safe padding. Can use a placeholder initially and swap later.
- **iOS testing device:** Safe-area and standalone mode testing requires a physical iPhone or Xcode simulator with a notched device profile.

## Estimated Scope

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: PWA Foundation | 1-2 days | Medium — vite-plugin-pwa + Nitro integration may need debugging |
| Phase 2: Safe-Area & Mobile UX | 0.5-1 day | Low — CSS changes, but requires device testing |
| Phase 3: Install Prompt & Offline | 1-2 days | Low-Medium — mostly new components, offline testing is tedious |
| **Total** | **3-5 days** | |

## Open Questions

1. **Self-host fonts?** Google Fonts via `@import` URL may fail on first offline load. Self-hosting DM Sans and Instrument Serif in `public/fonts/` guarantees offline availability but increases bundle size (~200KB). Worth the trade-off?

2. **SW update strategy:** `autoUpdate` silently updates in the background. Should we add a "New version available — tap to refresh" prompt instead, to avoid mid-session disruptions? (Probably not needed until the app has heavy offline usage patterns.)

3. **Cache strategy for dashboard data:** Should server function responses (health score, moods, goals) be cached in the SW for offline viewing? This adds complexity (stale data risk, cache invalidation) but significantly improves the offline experience. Could start with `NetworkFirst` for read-only endpoints only.

4. **Maskable icon safe zone:** The maskable icon variant needs the logo centered within the inner 80% safe zone. Does the current Amore logo work at that constraint, or does it need a rework?

5. **Analytics for PWA installs:** How should we track install conversions? The `appinstalled` event fires on successful install, but we need a backend endpoint to persist this. Add to this ticket or defer to a separate analytics ticket?
