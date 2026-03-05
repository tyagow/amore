import { getClient } from './client'
import { AI_MODEL, MAX_EXTRACT_MESSAGES, parseValidatedResponse, withRetry } from './config'
import { extractedEntitiesSchema } from './schemas'
import type { Message } from '@amore-couples/types'

export interface ExtractedEntities {
  wishes: Array<{ text: string; date: string; speaker: string }>
  importantDates: Array<{ description: string; date: string }>
  interests: string[]
  loveLanguages: Array<{ language: string; confidence: number }>
}

export async function extractEntities(
  messages: Message[],
): Promise<ExtractedEntities> {
  const client = getClient()

  const recentMessages = messages.slice(-MAX_EXTRACT_MESSAGES)
  const chatText = recentMessages
    .filter(m => !m.isMedia && m.text)
    .map(m => `[${m.timestamp.toISOString()}] ${m.senderId}: ${m.text}`)
    .join('\n')

  return withRetry(async () => {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: `Extract couple-relevant entities from this conversation. Return JSON with:
- wishes: things either person mentioned wanting (gifts, experiences, items)
- importantDates: dates mentioned (birthdays, anniversaries, events)
- interests: hobbies and topics they discuss enthusiastically
- loveLanguages: detected love languages with confidence (0-1)

Love languages: words_of_affirmation, quality_time, receiving_gifts, acts_of_service, physical_touch
Return ONLY valid JSON, no markdown.`,
      messages: [
        { role: 'user', content: chatText },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    return parseValidatedResponse(text, extractedEntitiesSchema)
  })
}
