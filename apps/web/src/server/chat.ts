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

// ── Shared Schema ───────────────────────────────────────

const chatMessageSchema = z.object({
  sender: z.string(),
  text: z.string(),
  timestamp: z.string(),
  fromMe: z.boolean(),
})

/**
 * Generate AI reply suggestions based on recent messages.
 */
export const getChatAISuggestions = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(chatMessageSchema).min(1).max(50),
    }),
  )
  .handler(async ({ data }) => {
    const { couple, partnerId } = await requireCouple()

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

    const suggestions = await generateReplySuggestions(data.messages, profile)

    return { suggestions }
  })

/**
 * Analyze the live mood of the conversation.
 */
export const getChatAIMood = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(chatMessageSchema).min(1).max(50),
    }),
  )
  .handler(async ({ data }) => {
    const { couple, partnerId } = await requireCouple()

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
    })

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
    }),
  )
  .handler(async ({ data }) => {
    const { couple, partnerId } = await requireCouple()

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

    const result = await reviewMessageTone(data.draft, data.messages, profile)

    return result
  })
