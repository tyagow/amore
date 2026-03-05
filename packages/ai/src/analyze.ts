import { getClient } from './client'
import { AI_MODEL, MAX_ANALYSIS_MESSAGES, parseValidatedResponse, withRetry } from './config'
import { analysisResultSchema } from './schemas'
import type { Message } from '@amore-couples/types'

export interface AnalysisResult {
  healthScore: number
  sentiments: Array<{ index: number; score: number }>
  patterns: {
    initiationBalance: Record<string, number>
    avgResponseMinutes: Record<string, number>
    messageCountBySender: Record<string, number>
    avgLengthBySender: Record<string, number>
  }
  summary: string
}

export async function analyzeConversation(
  messages: Message[],
  userSenderName: string,
): Promise<AnalysisResult> {
  const client = getClient()

  const recentMessages = messages.slice(-MAX_ANALYSIS_MESSAGES)
  const chatText = recentMessages
    .filter(m => !m.isMedia)
    .map(m => `[${m.timestamp.toISOString()}] ${m.senderId}: ${m.text}`)
    .join('\n')

  return withRetry(async () => {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: `You are Amore's couple analysis engine. Analyze the conversation between two partners and return a JSON object with:
- healthScore (1-100): overall couple health based on communication quality
- sentiments: array of {index, score} where score is -1.0 to 1.0 for the last 20 messages
- patterns: {initiationBalance, avgResponseMinutes, messageCountBySender, avgLengthBySender}
- summary: 2-3 sentence summary of communication health

The user's name is "${userSenderName}". The other person is their partner.
Return ONLY valid JSON, no markdown.`,
      messages: [
        { role: 'user', content: `Analyze this couple's conversation:\n\n${chatText}` },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return parseValidatedResponse(text, analysisResultSchema)
  })
}
