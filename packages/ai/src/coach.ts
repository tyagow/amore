import { getClient } from './client'
import { AI_MODEL, parseValidatedResponse, withRetry } from './config'
import { coachingTipsSchema } from './schemas'
import type { User } from '@amore-couples/types'

export interface CoachingTip {
  category: string
  tip: string
  context: string
}

export async function generateCoachingTips(
  conversationSummary: string,
  healthScore: number,
  userA?: Pick<User, 'name'> | null,
  userB?: Pick<User, 'name'> | null,
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
Return ONLY valid JSON, no markdown.`,
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
