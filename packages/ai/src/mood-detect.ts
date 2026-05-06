import { getClient } from './client'
import { FAST_MODEL, parseAIResponse } from './config'
import { getAILocaleInstruction, localized, type AILocale } from './locale'

export interface MoodDetectionResult {
  moodShiftDetected: boolean
  mood: 'great' | 'good' | 'neutral' | 'low' | 'struggling'
  confidence: number
  reason: string
}

export async function detectMoodShift(
  messages: { sender: string; text: string; timestamp: Date }[],
  userId: string,
  userName: string,
  locale: AILocale = 'en',
): Promise<MoodDetectionResult> {
  const recent = messages.slice(-20)
  const userMessages = recent.filter(m => m.sender === userName || m.sender === userId)

  if (userMessages.length < 3) {
    return {
      moodShiftDetected: false,
      mood: 'neutral',
      confidence: 0,
      reason: localized(locale, 'Not enough messages', 'Mensagens insuficientes'),
    }
  }

  const response = await getClient().messages.create({
    model: FAST_MODEL,
    max_tokens: 300,
    system: `You are an empathetic mood analyst. Analyze the user's recent messages for emotional state shifts. Respond with JSON only.${getAILocaleInstruction(locale)}`,
    messages: [{
      role: 'user',
      content: `Analyze these recent messages from ${userName} for mood shifts:\n\n${userMessages.map(m => `[${m.timestamp.toISOString()}] ${m.text}`).join('\n')}\n\nRespond with JSON: { "moodShiftDetected": boolean, "mood": "great"|"good"|"neutral"|"low"|"struggling", "confidence": 0-1, "reason": "brief explanation" }`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseAIResponse<MoodDetectionResult>(text)
}
