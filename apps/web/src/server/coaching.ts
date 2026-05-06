import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import {
  moodStates,
  insights,
  messages,
  users,
  userRelationshipProfiles,
} from '@amore-couples/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'
import { generateMoodCoaching, type CoachingTip } from '@amore-couples/ai'

// ── Server Functions ────────────────────────────────────
const localeSchema = z.enum(['en', 'pt-BR']).default('en')

/**
 * Generate AI coaching tips when a partner sets their mood to an alert level.
 * Fetches context (profiles, recent messages) and stores the result as an insight.
 */
export const generateMoodCoachingTips = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ moodStateId: z.string(), locale: localeSchema }))
  .handler(async ({ data }) => {
    const { session, couple, partnerId } = await requireCouple()

    // Fetch the mood state that triggered the alert
    const moodState = await db.query.moodStates.findFirst({
      where: and(
        eq(moodStates.id, data.moodStateId),
        eq(moodStates.coupleId, couple.id),
      ),
    })

    if (!moodState) {
      throw new Error('Mood state not found')
    }

    // The alert partner is the one who set the mood
    const alertUserId = moodState.userId
    const recipientUserId =
      alertUserId === session.user.id ? partnerId : session.user.id

    // Fetch both users' names
    const [alertUser, recipientUser] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, alertUserId),
        columns: { name: true },
      }),
      db.query.users.findFirst({
        where: eq(users.id, recipientUserId),
        columns: { name: true },
      }),
    ])

    // Fetch relationship profiles for context
    const profiles = await db.query.userRelationshipProfiles.findMany({
      where: eq(userRelationshipProfiles.coupleId, couple.id),
    })

    // Fetch recent messages for conversation context
    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.coupleId, couple.id),
      orderBy: [desc(messages.timestamp)],
      limit: 20,
    })

    const messageSummaries = recentMessages
      .reverse()
      .filter((m) => m.text)
      .map((m) => m.text!)

    // Generate coaching tips via AI
    const tips = await generateMoodCoaching(
      {
        moodLevel: moodState.mood,
        moodNote: moodState.note,
        alertPartnerName: alertUser?.name ?? 'Your partner',
        recipientName: recipientUser?.name ?? 'You',
        profiles: profiles.map((p) => ({
          loveLanguages: p.loveLanguages,
          communicationStyle: p.communicationStyle,
        })),
        recentMessages: messageSummaries,
      },
      data.locale,
    )

    // Store as an insight with type 'coaching_tip'
    const [inserted] = await db
      .insert(insights)
      .values({
        coupleId: couple.id,
        type: 'coaching_tip',
        content: {
          tips,
          moodStateId: moodState.id,
          alertPartnerName: alertUser?.name ?? 'Your partner',
          moodLevel: moodState.mood,
          moodNote: moodState.note,
        },
        severity: moodState.mood === 'struggling' ? 'high' : 'medium',
      })
      .returning()

    return { success: true, insightId: inserted.id, tips }
  })

/**
 * Get active coaching_tip insights for the couple from the last 24 hours.
 */
export const getActiveCoaching = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const coaching = await db.query.insights.findMany({
      where: and(
        eq(insights.coupleId, couple.id),
        eq(insights.type, 'coaching_tip'),
        gte(insights.generatedAt, twentyFourHoursAgo),
      ),
      orderBy: [desc(insights.generatedAt)],
      limit: 3,
    })

    return coaching.map((c) => ({
      ...c,
      content: c.content as {
        tips: CoachingTip[]
        alertPartnerName: string
        moodLevel: string
        moodNote: string | null
        moodStateId: string
      },
    }))
  },
)
