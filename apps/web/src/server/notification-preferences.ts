import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from './require-couple'
import { db } from '@amore-couples/db'
import { notificationPreferences } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get the current user's notification preferences.
 * Creates default preferences if none exist.
 */
export const getNotificationPreferences = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, session.user.id),
    })

    if (!prefs) {
      // Create default preferences
      const [created] = await db
        .insert(notificationPreferences)
        .values({ userId: session.user.id })
        .returning()
      prefs = created
    }

    return prefs
  },
)

/**
 * Update the current user's notification preferences.
 */
export const updateNotificationPreferences = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      moodAlerts: z.boolean().optional(),
      coachNudges: z.boolean().optional(),
      scoreDrops: z.boolean().optional(),
      milestones: z.boolean().optional(),
      goalUpdates: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      quietStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      quietEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      timezone: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAuth()

    // Build the update object with only provided fields
    const updates: Record<string, unknown> = {
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      ),
      updatedAt: new Date(),
    }

    // Upsert: update if exists, insert defaults if not
    const [updated] = await db
      .insert(notificationPreferences)
      .values({ userId: session.user.id, ...updates })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: updates,
      })
      .returning()

    return updated
  })
