import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import {
  userRelationshipProfiles,
  insights,
} from '@amore-couples/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import {
  generateReplySuggestions,
  analyzeLiveMood,
  reviewMessageTone,
} from '@amore-couples/ai'
import {
  checkFeatureAccess,
  incrementUsage,
  buildGatedResponse,
  PLAN_LIMITS,
} from './plan'

// ── Shared Schema ───────────────────────────────────────

const chatMessageSchema = z.object({
  sender: z.string(),
  text: z.string(),
  timestamp: z.string(),
  fromMe: z.boolean(),
})

const localeSchema = z.enum(['en', 'pt-BR']).default('en')

/**
 * Generate AI reply suggestions based on recent messages.
 */
export const getChatAISuggestions = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(chatMessageSchema).min(1).max(50),
      locale: localeSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { couple, partnerId, getPlan } = await requireCouple()
    const plan = await getPlan()

    // Gate: reply suggestions are premium-only
    if (!PLAN_LIMITS[plan].replySuggestions) {
      return buildGatedResponse('reply_suggestions')
    }

    const partnerProfile = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.userId, partnerId),
        eq(userRelationshipProfiles.coupleId, couple.id),
      ),
    })

    const profile = partnerProfile
      ? {
          loveLanguages: partnerProfile.loveLanguages as
            | Array<{ language: string; confidence: number }>
            | null,
          communicationStyle: partnerProfile.communicationStyle as
            | Record<string, Record<string, number>>
            | null,
        }
      : undefined

    const suggestions = await generateReplySuggestions(data.messages, profile, data.locale)

    return { suggestions }
  })

/**
 * Analyze the live mood of the conversation.
 */
export const getChatAIMood = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(chatMessageSchema).min(1).max(50),
      locale: localeSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { couple, partnerId, getPlan } = await requireCouple()
    const plan = await getPlan()

    // Gate: live mood analysis is premium-only
    if (!PLAN_LIMITS[plan].liveMoodAnalysis) {
      return buildGatedResponse('live_mood')
    }

    // Get partner love languages
    const partnerProfile = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.userId, partnerId),
        eq(userRelationshipProfiles.coupleId, couple.id),
      ),
    })

    // Get recent insight summaries
    const recentInsightRows = await db.query.insights.findMany({
      where: eq(insights.coupleId, couple.id),
      orderBy: [desc(insights.generatedAt)],
      limit: 5,
    })

    const recentInsights = recentInsightRows.map((i) => {
      const content = i.content as Record<string, unknown>
      return (
        (content.summary as string) ??
        (content.text as string) ??
        JSON.stringify(content)
      )
    })

    const loveLanguages = partnerProfile?.loveLanguages as
      | Array<{ language: string; confidence: number }>
      | null

    const result = await analyzeLiveMood(data.messages, {
      loveLanguages,
      recentInsights,
    }, data.locale)

    return result
  })

/**
 * Review a draft message for tone before sending.
 */
export const getChatAIReview = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(chatMessageSchema).min(1).max(50),
      draft: z.string().min(1).max(2000),
      locale: localeSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { session, couple, partnerId, getPlan } = await requireCouple()
    const plan = await getPlan()

    // Gate: tone review has daily limit for free users
    if (plan === 'free') {
      const access = await checkFeatureAccess(session.user.id, plan, 'tone_review')
      if (!access.allowed) {
        return buildGatedResponse('tone_review', access)
      }
    }

    const partnerProfile = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.userId, partnerId),
        eq(userRelationshipProfiles.coupleId, couple.id),
      ),
    })

    const profile = partnerProfile
      ? {
          loveLanguages: partnerProfile.loveLanguages as
            | Array<{ language: string; confidence: number }>
            | null,
          communicationStyle: partnerProfile.communicationStyle as
            | Record<string, Record<string, number>>
            | null,
        }
      : undefined

    const result = await reviewMessageTone(data.draft, data.messages, profile, data.locale)

    // Track usage for free users
    if (plan === 'free') {
      await incrementUsage(session.user.id, 'tone_review')
    }

    return result
  })
