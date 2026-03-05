import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { moodStates } from '@amore-couples/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'
import { emitCoupleEvent } from '~/lib/events'

// ── Server Functions ────────────────────────────────────

/**
 * Set the current user's mood. Inserts into mood_states.
 * If visibility is 'alert', emits an SSE event to the partner.
 */
export const setMood = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as {
        mood: 'great' | 'good' | 'neutral' | 'low' | 'struggling'
        visibility: 'silent' | 'visible' | 'alert'
        note?: string
      },
  )
  .handler(async ({ data }) => {
    const { session, couple } = await requireCouple()

    // Mood expires after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const [inserted] = await db
      .insert(moodStates)
      .values({
        coupleId: couple.id,
        userId: session.user.id,
        mood: data.mood,
        visibility: data.visibility,
        note: data.note ?? null,
        source: 'manual',
        expiresAt,
      })
      .returning()

    // Emit SSE event when partner should be alerted
    if (data.visibility === 'alert') {
      emitCoupleEvent(couple.id, {
        type: 'mood_update',
        data: {
          userId: session.user.id,
          mood: data.mood,
          note: data.note ?? null,
        },
      })
    }

    return { success: true, id: inserted.id }
  })

/**
 * Get the most recent non-expired mood for a specific user in a couple.
 */
export const getLatestMood = createServerFn({ method: 'GET' })
  .inputValidator(
    (d: unknown) => d as { userId: string; coupleId: string },
  )
  .handler(async ({ data }) => {
    await requireCouple() // Auth check

    const now = new Date()

    const mood = await db.query.moodStates.findFirst({
      where: and(
        eq(moodStates.userId, data.userId),
        eq(moodStates.coupleId, data.coupleId),
        gte(moodStates.expiresAt, now),
      ),
      orderBy: [desc(moodStates.createdAt)],
    })

    return mood ?? null
  })

/**
 * Get mood timeline for a couple over the last N days.
 */
export const getMoodHistory = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { days?: number })
  .handler(async ({ data }) => {
    const { couple } = await requireCouple()

    const days = data.days ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const history = await db.query.moodStates.findMany({
      where: and(
        eq(moodStates.coupleId, couple.id),
        gte(moodStates.createdAt, since),
      ),
      orderBy: [desc(moodStates.createdAt)],
    })

    return history
  })

/**
 * Get the partner's latest visible or alert mood.
 */
export const getPartnerMood = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple, partnerId } = await requireCouple()

    const now = new Date()

    const moods = await db.query.moodStates.findMany({
      where: and(
        eq(moodStates.userId, partnerId),
        eq(moodStates.coupleId, couple.id),
      ),
      orderBy: [desc(moodStates.createdAt)],
      limit: 5,
    })

    // Find latest non-expired mood with visible or alert visibility
    const partnerMood = moods.find(
      (m) =>
        (m.visibility === 'visible' || m.visibility === 'alert') &&
        (!m.expiresAt || m.expiresAt >= now),
    )

    return partnerMood ?? null
  },
)
