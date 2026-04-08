import webpush from 'web-push'
import { db } from '@amore-couples/db'
import { pushSubscriptions, notificationDeliveries } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'

// ── VAPID Configuration ─────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.warn('[notifications] VAPID keys not configured — web push disabled')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidConfigured = true
  return true
}

// ── Types ───────────────────────────────────────────────

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string // deep link on click
  tag?: string // for notification deduplication in browser
}

// ── Send Push to All User Subscriptions ─────────────────

export async function sendWebPush(
  userId: string,
  payload: PushPayload,
  opts?: { coupleId?: string; type?: string; sourceId?: string },
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0 }

  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  })

  if (subs.length === 0) return { sent: 0, failed: 0 }

  let sent = 0
  let failed = 0

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    }

    // Create delivery record
    const [delivery] = await db
      .insert(notificationDeliveries)
      .values({
        userId,
        coupleId: opts?.coupleId ?? null,
        type: opts?.type ?? 'unknown',
        channel: 'web_push',
        payload: payload as unknown as Record<string, unknown>,
        status: 'pending',
        sourceId: opts?.sourceId ?? null,
      })
      .returning()

    try {
      await webpush.sendNotification(pushSub, JSON.stringify(payload))

      // Mark delivered
      await db
        .update(notificationDeliveries)
        .set({ status: 'delivered', deliveredAt: new Date() })
        .where(eq(notificationDeliveries.id, delivery.id))

      // Update lastUsedAt on subscription
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id))

      console.log(JSON.stringify({
        type: 'push_delivery',
        userId,
        status: 'delivered',
        notificationType: opts?.type ?? 'unknown',
        timestamp: new Date().toISOString(),
      }))

      sent++
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      const message = err instanceof Error ? err.message : String(err)
      const expired = statusCode === 410 || statusCode === 404

      // HTTP 410 = subscription expired, delete it
      if (expired) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id))
      }

      await db
        .update(notificationDeliveries)
        .set({ status: 'failed', failureReason: `${statusCode ?? 'unknown'}: ${message}` })
        .where(eq(notificationDeliveries.id, delivery.id))

      console.log(JSON.stringify({
        type: 'push_delivery',
        userId,
        status: expired ? 'expired' : 'failed',
        notificationType: opts?.type ?? 'unknown',
        timestamp: new Date().toISOString(),
      }))

      failed++
    }
  }

  return { sent, failed }
}

export { VAPID_PUBLIC_KEY }
