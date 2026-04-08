import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { coupleGoals, insights } from '@amore-couples/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { emitCoupleEvent } from '~/lib/events'
import { getClient } from '@amore-couples/ai/client'
import { FAST_MODEL, parseAIResponse } from '@amore-couples/ai/config'
import { notifyGoalCompleted } from '@amore-couples/notifications'

// ── Server Functions ────────────────────────────────────

/**
 * Create a new couple goal. Source defaults to 'user'.
 */
export const createGoal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      dueDate: z.string().optional(),
      source: z.enum(['user', 'ai_suggested']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, couple } = await requireCouple()

    const [inserted] = await db
      .insert(coupleGoals)
      .values({
        coupleId: couple.id,
        title: data.title,
        description: data.description ?? null,
        source: data.source ?? 'user',
        status: 'active',
        suggestedBy: session.user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      })
      .returning()

    emitCoupleEvent(couple.id, {
      type: 'goal_update',
      data: { action: 'created', goalId: inserted.id },
    })

    return { success: true, goal: inserted }
  })

/**
 * Get all active goals for the couple.
 */
export const getActiveGoals = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

    const goals = await db.query.coupleGoals.findMany({
      where: and(
        eq(coupleGoals.coupleId, couple.id),
        eq(coupleGoals.status, 'active'),
      ),
      orderBy: [desc(coupleGoals.createdAt)],
    })

    return goals
  },
)

/**
 * Get completed goals for the couple.
 */
export const getCompletedGoals = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

    const goals = await db.query.coupleGoals.findMany({
      where: and(
        eq(coupleGoals.coupleId, couple.id),
        eq(coupleGoals.status, 'completed'),
      ),
      orderBy: [desc(coupleGoals.createdAt)],
      limit: 20,
    })

    return goals
  },
)

/**
 * Mark a goal as completed.
 */
export const completeGoal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ goalId: z.string() }))
  .handler(async ({ data }) => {
    const { session, couple, partnerId } = await requireCouple()

    const [updated] = await db
      .update(coupleGoals)
      .set({ status: 'completed' })
      .where(
        and(
          eq(coupleGoals.id, data.goalId),
          eq(coupleGoals.coupleId, couple.id),
        ),
      )
      .returning()

    if (!updated) {
      throw new Error('Goal not found')
    }

    emitCoupleEvent(couple.id, {
      type: 'goal_update',
      data: { action: 'completed', goalId: data.goalId },
    })

    // Notify partner about goal completion (non-blocking)
    notifyGoalCompleted(
      partnerId,
      session.user.name ?? 'Your partner',
      updated.title,
      { coupleId: couple.id, sourceId: updated.id },
    ).catch((err) => console.error('[push] goal notification failed:', err))

    return { success: true }
  })

/**
 * Dismiss a goal (mark as dismissed).
 */
export const dismissGoal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ goalId: z.string() }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple()

    const [updated] = await db
      .update(coupleGoals)
      .set({ status: 'dismissed' })
      .where(
        and(
          eq(coupleGoals.id, data.goalId),
          eq(coupleGoals.coupleId, couple.id),
        ),
      )
      .returning()

    if (!updated) {
      throw new Error('Goal not found')
    }

    return { success: true }
  })

// ── AI Goal Suggestions ─────────────────────────────────

interface GoalSuggestion {
  title: string
  description: string
  reason: string
}

/**
 * Ask AI to suggest goals based on recent insights for the couple.
 */
export const getAISuggestedGoals = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

    // Fetch recent insights for context
    const recentInsights = await db.query.insights.findMany({
      where: eq(insights.coupleId, couple.id),
      orderBy: [desc(insights.generatedAt)],
      limit: 5,
    })

    // Fetch existing active goals to avoid duplicates
    const existingGoals = await db.query.coupleGoals.findMany({
      where: and(
        eq(coupleGoals.coupleId, couple.id),
        eq(coupleGoals.status, 'active'),
      ),
    })

    const insightsSummary =
      recentInsights.length > 0
        ? recentInsights
            .map((i) => {
              const content = i.content as Record<string, unknown>
              return `${i.type}: ${content.summary ?? content.text ?? JSON.stringify(content)}`
            })
            .join('\n')
        : 'No recent insights available. Suggest general relationship-strengthening goals.'

    const existingGoalsList =
      existingGoals.length > 0
        ? `\nExisting goals (do not duplicate these):\n${existingGoals.map((g) => `- ${g.title}`).join('\n')}`
        : ''

    const client = getClient()

    const response = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: 1000,
      system: `You are Amore, a warm couple's relationship coach. Based on the couple's recent insights, suggest 3 actionable, specific goals they can work on together. Each goal should be achievable within 1-4 weeks.

Return a JSON array of objects with: title (string, concise), description (string, 1-2 sentences), reason (string, why this matters).
Return ONLY valid JSON, no markdown.`,
      messages: [
        {
          role: 'user',
          content: `Recent relationship insights:\n${insightsSummary}${existingGoalsList}\n\nSuggest 3 couple goals.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '[]'
    return parseAIResponse<GoalSuggestion[]>(text)
  },
)
