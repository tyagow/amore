import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { insights, messages, moodStates, users } from '@amore-couples/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { detectMoodShift } from '@amore-couples/ai'
import { emitCoupleEvent } from '~/lib/events'

// ── Types ─────────────────────────────────────────────────

interface MoodDetectionContent {
  status: 'pending' | 'confirmed' | 'dismissed'
  userId: string
  mood: string
  confidence: number
  reason: string
}

// ── Server Functions ──────────────────────────────────────

/**
 * Trigger mood detection for a user in a couple.
 * Called by wa-bridge after every ~10 messages.
 * Fetches recent messages, runs AI mood detection, and stores result as an insight.
 */
export const triggerMoodDetection = createServerFn({ method: 'POST' })
  .handler(async () => {
    const { couple, session } = await requireCouple()
    const coupleId = couple.id
    const userId = session.user.id

    // Fetch recent messages for this couple
    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.coupleId, coupleId),
      orderBy: [desc(messages.timestamp)],
      limit: 30,
    })

    if (recentMessages.length < 5) {
      return { detected: false, reason: 'Not enough messages' }
    }

    // Get the user's name for the AI prompt
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true },
    })

    const userName = user?.name ?? 'User'

    // Format messages for the AI detector (reverse to chronological order)
    const formatted = recentMessages.reverse().map((m) => ({
      sender: m.senderId,
      text: m.text ?? '',
      timestamp: m.timestamp,
    }))

    // Run AI mood detection
    const result = await detectMoodShift(formatted, userId, userName)

    if (!result.moodShiftDetected || result.confidence <= 0.7) {
      return { detected: false, reason: 'No significant mood shift detected' }
    }

    // Store as a pending mood_detection insight
    const content: MoodDetectionContent = {
      status: 'pending',
      userId,
      mood: result.mood,
      confidence: result.confidence,
      reason: result.reason,
    }

    const [inserted] = await db
      .insert(insights)
      .values({
        coupleId,
        type: 'mood_detection',
        content,
        severity: result.mood === 'struggling' ? 'high' : result.mood === 'low' ? 'medium' : 'low',
      })
      .returning()

    // Emit SSE event so the dashboard picks it up in real time
    emitCoupleEvent(coupleId, {
      type: 'mood_update',
      data: {
        detectionId: inserted.id,
        userId,
        mood: result.mood,
        reason: result.reason,
      },
    })

    return { detected: true, insightId: inserted.id }
  })

/**
 * Get pending (unresolved) mood detections for the current user.
 */
export const getPendingMoodDetections = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple } = await requireCouple()

    const allDetections = await db.query.insights.findMany({
      where: and(
        eq(insights.coupleId, couple.id),
        eq(insights.type, 'mood_detection'),
      ),
      orderBy: [desc(insights.generatedAt)],
      limit: 10,
    })

    // Filter to pending detections for the current user
    const pending = allDetections.filter((i) => {
      const content = i.content as MoodDetectionContent
      return content.status === 'pending' && content.userId === session.user.id
    })

    return pending.map((i) => ({
      id: i.id,
      generatedAt: i.generatedAt,
      ...(i.content as MoodDetectionContent),
    }))
  },
)

/**
 * Confirm a mood detection — inserts a mood_state with source 'ai_detected'
 * and user-chosen visibility. Marks the insight as resolved.
 */
export const confirmMoodDetection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      detectionId: z.string(),
      visibility: z.enum(['silent', 'visible', 'alert']),
    }),
  )
  .handler(async ({ data }) => {
    const { session, couple } = await requireCouple()

    // Fetch the detection insight
    const insight = await db.query.insights.findFirst({
      where: and(
        eq(insights.id, data.detectionId),
        eq(insights.coupleId, couple.id),
        eq(insights.type, 'mood_detection'),
      ),
    })

    if (!insight) {
      throw new Error('Mood detection not found')
    }

    const content = insight.content as MoodDetectionContent

    if (content.status !== 'pending') {
      throw new Error('Mood detection already resolved')
    }

    if (content.userId !== session.user.id) {
      throw new Error('Not your mood detection')
    }

    // Insert the confirmed mood state
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.insert(moodStates).values({
      coupleId: couple.id,
      userId: session.user.id,
      mood: content.mood,
      source: 'ai_detected',
      visibility: data.visibility,
      note: `AI detected: ${content.reason}`,
      expiresAt,
    })

    // Mark the insight as confirmed
    const updatedContent: MoodDetectionContent = {
      ...content,
      status: 'confirmed',
    }

    await db
      .update(insights)
      .set({ content: updatedContent })
      .where(eq(insights.id, data.detectionId))

    // Emit event if alerting partner
    if (data.visibility === 'alert') {
      emitCoupleEvent(couple.id, {
        type: 'mood_update',
        data: {
          userId: session.user.id,
          mood: content.mood,
          note: `AI detected: ${content.reason}`,
        },
      })
    }

    return { success: true }
  })

/**
 * Dismiss a mood detection — marks the insight as dismissed.
 */
export const dismissMoodDetection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ detectionId: z.string() }),
  )
  .handler(async ({ data }) => {
    const { session, couple } = await requireCouple()

    const insight = await db.query.insights.findFirst({
      where: and(
        eq(insights.id, data.detectionId),
        eq(insights.coupleId, couple.id),
        eq(insights.type, 'mood_detection'),
      ),
    })

    if (!insight) {
      throw new Error('Mood detection not found')
    }

    const content = insight.content as MoodDetectionContent

    if (content.status !== 'pending') {
      throw new Error('Mood detection already resolved')
    }

    if (content.userId !== session.user.id) {
      throw new Error('Not your mood detection')
    }

    const updatedContent: MoodDetectionContent = {
      ...content,
      status: 'dismissed',
    }

    await db
      .update(insights)
      .set({ content: updatedContent })
      .where(eq(insights.id, data.detectionId))

    return { success: true }
  })
