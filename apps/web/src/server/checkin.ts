import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { dailyCheckins, engagementStreaks, moodStates } from '@amore-couples/db/schema'
import { eq, and } from 'drizzle-orm'
import { emitCoupleEvent } from '~/lib/events'
import { getDailyQuestion } from '@amore-couples/ai/daily-questions'

// ── Helpers ────────────────────────────────────────────

/** Get today's date as YYYY-MM-DD in UTC */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Check if two date strings are consecutive days */
function isConsecutiveDay(prev: string, current: string): boolean {
  const prevDate = new Date(prev + 'T00:00:00Z')
  const currentDate = new Date(current + 'T00:00:00Z')
  const diffMs = currentDate.getTime() - prevDate.getTime()
  return diffMs === 24 * 60 * 60 * 1000
}

// ── Server Functions ────────────────────────────────────

/**
 * Get today's check-in status for the current user.
 * Returns the check-in (or null), partner's check-in status, streak info, and today's question.
 */
export const getDailyCheckin = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { session, couple, partnerId } = await requireCouple()
    const today = todayUTC()
    const question = getDailyQuestion(today)

    // Fetch user's check-in, partner's check-in, and streak in parallel
    const [checkin, partnerCheckin, streak] = await Promise.all([
      db.query.dailyCheckins.findFirst({
        where: and(
          eq(dailyCheckins.coupleId, couple.id),
          eq(dailyCheckins.userId, session.user.id),
          eq(dailyCheckins.date, today),
        ),
      }),
      db.query.dailyCheckins.findFirst({
        where: and(
          eq(dailyCheckins.coupleId, couple.id),
          eq(dailyCheckins.userId, partnerId),
          eq(dailyCheckins.date, today),
        ),
      }),
      db.query.engagementStreaks.findFirst({
        where: eq(engagementStreaks.userId, session.user.id),
      }),
    ])

    return {
      checkin: checkin ?? null,
      partnerCheckedIn: !!partnerCheckin,
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        lastCheckinDate: streak?.lastCheckinDate ?? null,
      },
      question,
    }
  })

/**
 * Submit today's daily check-in. Creates the check-in, updates streak, and creates a mood_state entry.
 */
export const submitDailyCheckin = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      mood: z.enum(['great', 'good', 'neutral', 'low', 'struggling']),
      note: z.string().optional(),
      answer: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, couple } = await requireCouple()
    const today = todayUTC()
    const question = getDailyQuestion(today)

    // Insert the check-in (unique index prevents duplicates)
    let checkin
    try {
      const [inserted] = await db
        .insert(dailyCheckins)
        .values({
          coupleId: couple.id,
          userId: session.user.id,
          mood: data.mood,
          note: data.note?.trim() || null,
          question,
          answer: data.answer?.trim() || null,
          date: today,
        })
        .returning()
      checkin = inserted
    } catch (err: unknown) {
      // Check for unique constraint violation (already checked in today)
      if (err instanceof Error && err.message.includes('unique')) {
        const existing = await db.query.dailyCheckins.findFirst({
          where: and(
            eq(dailyCheckins.coupleId, couple.id),
            eq(dailyCheckins.userId, session.user.id),
            eq(dailyCheckins.date, today),
          ),
        })
        if (existing) {
          return { checkin: existing, streak: await getStreakForUser(session.user.id), alreadyExists: true }
        }
      }
      throw err
    }

    // Update streak
    const streak = await updateStreak(session.user.id, today)

    // Create corresponding mood_state with source: 'daily_checkin'
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await db.insert(moodStates).values({
      coupleId: couple.id,
      userId: session.user.id,
      mood: data.mood,
      source: 'daily_checkin',
      visibility: 'visible',
      note: data.note?.trim() || null,
      expiresAt,
    })

    // Emit SSE event so partner sees the update
    emitCoupleEvent(couple.id, {
      type: 'checkin_update',
      data: {
        userId: session.user.id,
        mood: data.mood,
      },
    })

    return { checkin, streak, alreadyExists: false }
  })

/**
 * Get streak info for the current user.
 */
export const getStreakInfo = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { session } = await requireCouple()
    return getStreakForUser(session.user.id)
  })

// ── Internal helpers ────────────────────────────────────

async function getStreakForUser(userId: string) {
  const streak = await db.query.engagementStreaks.findFirst({
    where: eq(engagementStreaks.userId, userId),
  })
  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastCheckinDate: streak?.lastCheckinDate ?? null,
  }
}

async function updateStreak(userId: string, today: string) {
  const existing = await db.query.engagementStreaks.findFirst({
    where: eq(engagementStreaks.userId, userId),
  })

  let currentStreak: number
  let longestStreak: number

  if (!existing) {
    // First ever check-in
    currentStreak = 1
    longestStreak = 1
    await db.insert(engagementStreaks).values({
      userId,
      currentStreak,
      longestStreak,
      lastCheckinDate: today,
    })
  } else if (existing.lastCheckinDate === today) {
    // Already checked in today (shouldn't happen due to unique constraint, but safe)
    return {
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      lastCheckinDate: existing.lastCheckinDate,
    }
  } else if (existing.lastCheckinDate && isConsecutiveDay(existing.lastCheckinDate, today)) {
    // Consecutive day — increment streak
    currentStreak = existing.currentStreak + 1
    longestStreak = Math.max(existing.longestStreak, currentStreak)
    await db
      .update(engagementStreaks)
      .set({
        currentStreak,
        longestStreak,
        lastCheckinDate: today,
        updatedAt: new Date(),
      })
      .where(eq(engagementStreaks.userId, userId))
  } else {
    // Gap in days — reset streak to 1
    currentStreak = 1
    longestStreak = existing.longestStreak
    await db
      .update(engagementStreaks)
      .set({
        currentStreak,
        longestStreak,
        lastCheckinDate: today,
        updatedAt: new Date(),
      })
      .where(eq(engagementStreaks.userId, userId))
  }

  return { currentStreak, longestStreak, lastCheckinDate: today }
}
