import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from './require-couple'
import { db } from '@amore-couples/db'
import { pushSubscriptions } from '@amore-couples/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Store a browser PushSubscription for the current user.
 */
export const subscribePush = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAuth()

    // Upsert by endpoint (same browser re-subscribing gets updated, not duplicated)
    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.user.id,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent ?? null,
          lastUsedAt: new Date(),
        },
      })

    return { success: true }
  })

/**
 * Remove a push subscription by endpoint.
 */
export const unsubscribePush = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ endpoint: z.string().url() }))
  .handler(async ({ data }) => {
    const session = await requireAuth()

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.endpoint, data.endpoint),
        ),
      )

    return { success: true }
  })

/**
 * Check if the current user has any push subscriptions.
 */
export const getSubscriptionStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    const subs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, session.user.id),
      columns: { id: true, userAgent: true, createdAt: true },
    })

    return {
      subscribed: subs.length > 0,
      subscriptions: subs,
    }
  },
)
