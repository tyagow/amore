/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

// ── Workbox Precaching ──────────────────────────────────

precacheAndRoute(self.__WB_MANIFEST)

// ── Runtime Caching ─────────────────────────────────────

// Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

// Google Fonts webfonts
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

// Network-only for API/SSE/server routes
registerRoute(/^\/_server\//, new NetworkOnly())
registerRoute(/^\/api\//, new NetworkOnly())
registerRoute(/^\/sse\//, new NetworkOnly())

// ── Push Notifications ──────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const payload = event.data.json() as {
    title: string
    body: string
    icon?: string
    badge?: string
    url?: string
    tag?: string
  }

  // Suppress notification if app window is focused (avoid duplicate with SSE)
  const promiseChain = self.clients
    .matchAll({ type: 'window', includeUncontrolled: false })
    .then((clients) => {
      const hasFocusedClient = clients.some((client) => client.visibilityState === 'visible')
      if (hasFocusedClient) return // App is open and visible — SSE handles it

      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? '/pwa-icon-192x192.png',
        badge: payload.badge ?? '/favicon-32x32.png',
        tag: payload.tag,
        data: { url: payload.url ?? '/dashboard' },
      })
    })

  event.waitUntil(promiseChain)
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const url = (event.notification.data?.url as string) ?? '/dashboard'

  // Focus existing window or open new one
  const promiseChain = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // No existing window — open a new one
      return self.clients.openWindow(url)
    })

  event.waitUntil(promiseChain)
})
