import { z } from 'zod'
import { getClient } from './client'
import { AI_MODEL, FAST_MODEL, parseValidatedResponse, withRetry } from './config'
import { getAILocaleInstruction, type AILocale } from './locale'

export interface ChatMessage {
  sender: string
  text: string | null
  timestamp: Date | string
  fromMe: boolean
}

function formatConversation(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.text)
    .map((m) => {
      const date = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
      const hh = String(date.getHours()).padStart(2, '0')
      const mm = String(date.getMinutes()).padStart(2, '0')
      return `[${hh}:${mm}] ${m.sender}: ${m.text}`
    })
    .join('\n')
}

function formatPartnerProfile(profile?: {
  loveLanguages?: Array<{ language: string; confidence: number }> | null
  communicationStyle?: Record<string, Record<string, number>> | null
} | null): string {
  if (!profile) return ''

  const parts: string[] = []

  if (profile.loveLanguages?.length) {
    const langs = profile.loveLanguages
      .sort((a, b) => b.confidence - a.confidence)
      .map((l) => `${l.language} (${Math.round(l.confidence * 100)}%)`)
      .join(', ')
    parts.push(`Love languages: ${langs}`)
  }

  if (profile.communicationStyle) {
    const styles = Object.entries(profile.communicationStyle)
      .map(([category, values]) => {
        const topTraits = Object.entries(values)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([trait, score]) => `${trait} (${Math.round(score * 100)}%)`)
          .join(', ')
        return `${category}: ${topTraits}`
      })
      .join('; ')
    parts.push(`Communication style: ${styles}`)
  }

  return parts.length ? `\nPartner profile:\n${parts.join('\n')}` : ''
}

const replySuggestionsSchema = z.array(z.string()).min(1).max(4)

export async function generateReplySuggestions(
  messages: ChatMessage[],
  partnerProfile?: {
    loveLanguages?: Array<{ language: string; confidence: number }> | null
    communicationStyle?: Record<string, Record<string, number>> | null
  } | null,
  locale: AILocale = 'en',
): Promise<string[]> {
  const recent = messages.slice(-15)
  const conversation = formatConversation(recent)
  const profileContext = formatPartnerProfile(partnerProfile)

  return withRetry(async () => {
    const response = await getClient().messages.create({
      model: FAST_MODEL,
      max_tokens: 300,
      system: `You are a couple's communication assistant. Generate 2-3 short reply suggestions that match the conversation's tone and the partner's communication style. Output a JSON array of strings. Each suggestion should be natural, warm, and contextually appropriate. Do not include any text outside the JSON array.${profileContext}${getAILocaleInstruction(locale)}`,
      messages: [
        {
          role: 'user',
          content: `Here is the recent conversation:\n\n${conversation}\n\nGenerate 2-3 reply suggestions as a JSON array of strings.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    return parseValidatedResponse(text, replySuggestionsSchema)
  }, 1)
}

const liveMoodSchema = z.object({
  mood: z.string(),
  coaching: z.array(z.string()),
  tensionFlag: z.boolean(),
})

export async function analyzeLiveMood(
  messages: ChatMessage[],
  context: {
    loveLanguages?: Array<{ language: string; confidence: number }> | null
    recentInsights?: string[] | null
  },
  locale: AILocale = 'en',
): Promise<{ mood: string; coaching: string[]; tensionFlag: boolean }> {
  const recent = messages.slice(-20)
  const conversation = formatConversation(recent)

  let contextBlock = ''
  if (context.loveLanguages?.length) {
    const langs = context.loveLanguages
      .sort((a, b) => b.confidence - a.confidence)
      .map((l) => `${l.language} (${Math.round(l.confidence * 100)}%)`)
      .join(', ')
    contextBlock += `\nPartner's love languages: ${langs}`
  }
  if (context.recentInsights?.length) {
    contextBlock += `\nRecent couple insights:\n${context.recentInsights.map((i) => `- ${i}`).join('\n')}`
  }

  return withRetry(async () => {
    const response = await getClient().messages.create({
      model: FAST_MODEL,
      max_tokens: 500,
      system: `You are a couple's mood analyst. Analyze the emotional tone of this conversation and provide coaching tips. Output JSON with exactly these fields:
- "mood": an emoji followed by a short label (e.g. "Warm & Connected", "Tense & Distant")
- "coaching": an array of 1-2 short, actionable coaching tips for improving the conversation
- "tensionFlag": true if you detect tension, conflict, or emotional distance; false otherwise
Do not include any text outside the JSON object.${getAILocaleInstruction(locale)}`,
      messages: [
        {
          role: 'user',
          content: `Here is the recent conversation:\n\n${conversation}${contextBlock}\n\nAnalyze the mood and provide coaching.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    return parseValidatedResponse(text, liveMoodSchema)
  }, 1)
}

const messageToneSchema = z.object({
  tone: z.string(),
  suggestions: z.array(z.string()),
  revised: z.string(),
})

export async function reviewMessageTone(
  draft: string,
  recentMessages: ChatMessage[],
  partnerProfile?: {
    loveLanguages?: Array<{ language: string; confidence: number }> | null
    communicationStyle?: Record<string, Record<string, number>> | null
  } | null,
  locale: AILocale = 'en',
): Promise<{ tone: string; suggestions: string[]; revised: string }> {
  const recent = recentMessages.slice(-10)
  const conversation = formatConversation(recent)
  const profileContext = formatPartnerProfile(partnerProfile)

  return withRetry(async () => {
    const response = await getClient().messages.create({
      model: AI_MODEL,
      max_tokens: 800,
      system: `You are a couple's communication coach. Review the user's draft message for tone in the context of their recent conversation and their partner's profile. Output JSON with exactly these fields:
- "tone": a short label describing the tone of the draft (e.g. "Defensive", "Warm & supportive", "Passive-aggressive")
- "suggestions": an array of specific tips to improve the message's tone and effectiveness
- "revised": an improved version of the draft that applies your suggestions while preserving the original intent
Do not include any text outside the JSON object.${profileContext}${getAILocaleInstruction(locale)}`,
      messages: [
        {
          role: 'user',
          content: `Recent conversation for context:\n\n${conversation}\n\nDraft message to review:\n"${draft}"\n\nReview the tone and suggest improvements.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    return parseValidatedResponse(text, messageToneSchema)
  }, 2)
}
