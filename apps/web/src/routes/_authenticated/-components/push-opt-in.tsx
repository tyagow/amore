import { useState, useEffect } from 'react'
import { subscribePush, getSubscriptionStatus } from '~/server/push'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function PushOptIn() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)

    // Check if already subscribed
    if (Notification.permission === 'granted') {
      getSubscriptionStatus().then((status) => {
        setSubscribed(status.subscribed)
      }).catch(() => {})
    }

    // Check if previously dismissed
    if (localStorage.getItem('amore:push-dismissed')) {
      setDismissed(true)
    }
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        if (!VAPID_PUBLIC_KEY) {
          console.error('[push] VITE_VAPID_PUBLIC_KEY not set')
          setLoading(false)
          return
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      const json = subscription.toJSON()
      await subscribePush({
        data: {
          endpoint: subscription.endpoint,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
          userAgent: navigator.userAgent,
        },
      })

      setSubscribed(true)
    } catch (err) {
      console.error('[push] subscription failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('amore:push-dismissed', '1')
  }

  // Don't show if: unsupported, already subscribed, already denied, or dismissed
  if (permission === 'unsupported' || subscribed || permission === 'denied' || dismissed) {
    return null
  }

  return (
    <div className="bg-white border border-warm-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-warm-900 mb-1">
            Stay in the loop
          </h3>
          <p className="text-sm text-warm-500 leading-relaxed mb-3">
            Get notified when your partner shares a mood or completes a goal — even when the app is closed.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-warm-500 text-sm rounded-lg font-medium hover:bg-warm-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
