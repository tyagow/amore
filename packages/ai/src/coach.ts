import { getClient } from './client'
import { AI_MODEL, parseValidatedResponse, withRetry } from './config'
import { getAILocaleInstruction, type AILocale } from './locale'
import { coachingTipsSchema } from './schemas'
import type { User } from '@amore-couples/types'

export interface CoachingTip {
  category: string
  tip: string
  context: string
}

export interface MoodCoachingInput {
  /** The mood level set by the partner (e.g. 'low', 'struggling') */
  moodLevel: string
  /** Optional note the partner left with their mood */
  moodNote: string | null
  /** Name of the partner who set the mood alert */
  alertPartnerName: string
  /** Name of the user who will receive the coaching tips */
  recipientName: string
  /** Relationship profile summaries for context */
  profiles: {
    loveLanguages?: unknown
    communicationStyle?: unknown
  }[]
  /** Recent message texts for conversation context */
  recentMessages: string[]
}

/**
 * Generate mood-alert-specific coaching tips.
 * Called when a partner sets their mood to an alert level (low/struggling).
 * Returns 2-3 empathetic, actionable tips for the other partner.
 */
export async function generateMoodCoaching(
  input: MoodCoachingInput,
  locale: AILocale = 'en',
): Promise<CoachingTip[]> {
  const client = getClient()

  const profileContext = input.profiles.length > 0
    ? `\nRelationship profiles:\n${input.profiles.map(p => JSON.stringify(p)).join('\n')}`
    : ''

  const messageContext = input.recentMessages.length > 0
    ? `\nRecent conversation messages:\n${input.recentMessages.slice(-20).join('\n')}`
    : ''

  const moodNoteContext = input.moodNote
    ? `\nThey also left a note: "${input.moodNote}"`
    : ''

  return withRetry(async () => {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: `You are Amore, a warm and empathetic relationship coach. ${input.alertPartnerName} has indicated they are feeling "${input.moodLevel}". Generate 2-3 gentle, actionable coaching tips for ${input.recipientName} on how to best support their partner right now.

Consider:
- The partner's love languages and communication style (if known)
- Recent conversation tone and context
- Empathetic, non-judgmental suggestions
- Concrete actions they can take immediately

Return a JSON array of objects with: category (string — e.g. "Listen", "Comfort", "Space"), tip (string — the actionable suggestion), context (string — why this approach may help).
Return ONLY valid JSON, no markdown.${getAILocaleInstruction(locale)}`,
      messages: [
        {
          role: 'user',
          content: `${input.alertPartnerName} is feeling "${input.moodLevel}".${moodNoteContext}${profileContext}${messageContext}\n\nGenerate 2-3 supportive coaching tips for ${input.recipientName}.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return parseValidatedResponse(text, coachingTipsSchema)
  })
}

export async function generateCoachingTips(
  conversationSummary: string,
  healthScore: number,
  userA?: Pick<User, 'name'> | null,
  userB?: Pick<User, 'name'> | null,
  locale: AILocale = 'en',
): Promise<CoachingTip[]> {
  const client = getClient()

  let profileContext = ''
  if (userA?.name || userB?.name) {
    profileContext = `\nThe couple consists of ${userA?.name ?? 'Partner A'} and ${userB?.name ?? 'Partner B'}.`
  }

  return withRetry(async () => {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: `You are Amore, a warm and sophisticated couple's coach. Based on the conversation analysis, generate 3-5 actionable coaching tips tailored to both partners. Each tip should be specific, actionable, and kind.${profileContext}

Return a JSON array of objects with: category (string), tip (string), context (string explaining why this matters for the couple).
Return ONLY valid JSON, no markdown.${getAILocaleInstruction(locale)}`,
      messages: [
        {
          role: 'user',
          content: `Health score: ${healthScore}/100\n\nAnalysis: ${conversationSummary}\n\nGenerate coaching tips for this couple.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return parseValidatedResponse(text, coachingTipsSchema)
  })
}
