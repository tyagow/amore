import { z } from 'zod'
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages'
import { getClient } from './client'
import {
  AI_MODEL,
  FAST_MODEL,
  parseValidatedResponse,
  withRetry,
} from './config'

export interface CoachContext {
  healthScore: number | null
  summary: string | null
  recentInsights: Array<{
    type: string
    content: unknown
    generatedAt: Date | string
  }>
  goals: Array<{
    title: string
    status: string
    description: string | null
  }>
  patterns: {
    initiationBalance?: Record<string, number> | null
    avgResponseMinutes?: Record<string, number> | null
    messageCountBySender?: Record<string, number> | null
  } | null
  sentimentTrend: Array<{ date: string; avg: number }>
  loveLanguages: {
    mine: Array<{ language: string; confidence: number }> | null
    partner: Array<{ language: string; confidence: number }> | null
  }
  recentMessages: Array<{
    sender: string
    text: string
    timestamp: Date | string
  }>
  moodStates: Array<{
    userId: string
    mood: string
    note: string | null
  }>
  coachMemory: Array<{
    category: string
    content: string
  }>
}

export interface ThreadMessage {
  role: 'user' | 'assistant'
  content: string
}

export type CoachIntent =
  | 'communication'
  | 'conflict'
  | 'goals'
  | 'emotions'
  | 'partner'
  | 'general'

export interface ExtractedMemory {
  category: 'takeaway' | 'commitment' | 'theme' | 'preference'
  content: string
}

const coachIntentSchema = z.enum([
  'communication',
  'conflict',
  'goals',
  'emotions',
  'partner',
  'general',
])

const extractedMemorySchema = z.array(z.object({
  category: z.enum(['takeaway', 'commitment', 'theme', 'preference']),
  content: z.string().min(1).max(500),
}))

export async function classifyIntent(message: string): Promise<CoachIntent> {
  const client = getClient()

  return withRetry(async () => {
    const response = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: 20,
      system: `Classify the user's relationship coaching message into exactly one category.

Categories:
- communication: message patterns, initiation, responsiveness, how they talk
- conflict: tension, fights, disagreements, low sentiment, hurt feelings
- goals: relationship goals, commitments, plans, progress
- emotions: feelings, emotional needs, mood, love languages, sentiment
- partner: partner-specific questions, recent conversations, what the partner may need
- general: greetings, vague questions, meta questions, anything else

Return only the category as plain text.`,
      messages: [
        { role: 'user', content: message },
      ],
    })

    const text =
      response.content[0]?.type === 'text'
        ? JSON.stringify(response.content[0].text.trim().toLowerCase())
        : JSON.stringify('general')

    return parseValidatedResponse(text, coachIntentSchema)
  })
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function buildSystemPrompt(
  context: Partial<CoachContext>,
  currentPage?: string,
): string {
  const parts: string[] = [
    `You are Amore's relationship coach. You are direct, grounded, and useful.

Rules:
- Use the couple's real data when it is relevant. Do not invent facts.
- Give concrete recommendations, not generic encouragement.
- Stay balanced. Do not take sides between partners.
- Ask questions only when missing information blocks a good answer.
- Keep most responses to 2-4 short paragraphs unless the user clearly needs more depth.
- If the available data is thin or missing, say that plainly.`,
  ]

  if (currentPage) {
    const pageCopy: Record<string, string> = {
      dashboard: 'The user opened you from the dashboard.',
      insights: 'The user is reviewing relationship insights right now.',
      goals: 'The user is looking at relationship goals.',
      chat: 'The user is in the WhatsApp chat view.',
      profile: 'The user is on the profile page.',
      whatsapp: 'The user is on the WhatsApp connection page.',
      connect: 'The user is on the couple connection page.',
      setup: 'The user is in setup.',
    }
    if (pageCopy[currentPage]) {
      parts.push(pageCopy[currentPage])
    }
  }

  if (context.healthScore != null) {
    parts.push(`Relationship health score: ${context.healthScore}/100`)
  }
  if (context.summary) {
    parts.push(`Latest relationship summary: ${context.summary}`)
  }
  if (context.patterns) {
    parts.push(`Communication patterns: ${formatJson(context.patterns)}`)
  }
  if (context.goals?.length) {
    parts.push(
      `Active goals:\n${context.goals
        .map((goal) => `- ${goal.title} (${goal.status}): ${goal.description ?? 'No description'}`)
        .join('\n')}`,
    )
  }
  if (context.sentimentTrend?.length) {
    parts.push(
      `Recent sentiment trend: ${context.sentimentTrend
        .slice(-7)
        .map((row) => `${row.date}: ${row.avg.toFixed(2)}`)
        .join(', ')}`,
    )
  }
  if (context.loveLanguages?.mine?.length || context.loveLanguages?.partner?.length) {
    parts.push(
      `Love languages: ${formatJson(context.loveLanguages)}`,
    )
  }
  if (context.recentMessages?.length) {
    parts.push(
      `Recent messages:\n${context.recentMessages
        .slice(-10)
        .map((message) => `[${message.sender}] ${message.text}`)
        .join('\n')}`,
    )
  }
  if (context.moodStates?.length) {
    parts.push(
      `Recent mood states: ${context.moodStates
        .map((mood) => `${mood.userId}: ${mood.mood}${mood.note ? ` (${mood.note})` : ''}`)
        .join(', ')}`,
    )
  }
  if (context.coachMemory?.length) {
    parts.push(
      `Relevant prior coaching memory:\n${context.coachMemory
        .map((memory) => `- [${memory.category}] ${memory.content}`)
        .join('\n')}`,
    )
  }
  if (context.recentInsights?.length) {
    parts.push(
      `Recent insights:\n${context.recentInsights
        .slice(0, 5)
        .map((insight) => `- [${insight.type}] ${formatJson(insight.content)}`)
        .join('\n')}`,
    )
  }

  return parts.join('\n\n')
}

async function* iterateTextDeltas(
  stream: AsyncIterable<MessageStreamEvent>,
): AsyncIterable<string> {
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta'
      && event.delta?.type === 'text_delta'
      && typeof event.delta.text === 'string'
    ) {
      yield event.delta.text
    }
  }
}

export async function streamCoachResponse(
  threadHistory: ThreadMessage[],
  newMessage: string,
  context: Partial<CoachContext>,
  currentPage?: string,
): Promise<AsyncIterable<string>> {
  const client = getClient()
  const system = buildSystemPrompt(context, currentPage)

  const stream = client.messages.stream({
    model: AI_MODEL,
    max_tokens: 1500,
    system,
    messages: [
      ...threadHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user', content: newMessage },
    ],
  })

  return iterateTextDeltas(stream)
}

export async function extractCoachMemory(
  userMessage: string,
  assistantResponse: string,
): Promise<ExtractedMemory[]> {
  const client = getClient()

  try {
    return await withRetry(async () => {
      const response = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 500,
        system: `Extract notable memory from this relationship coaching exchange.

Return a JSON array of objects with:
- category: one of takeaway, commitment, theme, preference
- content: one concise sentence

Only include items that are likely to matter in future coaching. Return [] if there is nothing durable.`,
        messages: [
          {
            role: 'user',
            content: `User message: ${userMessage}\n\nCoach response: ${assistantResponse}`,
          },
        ],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
      return parseValidatedResponse(text, extractedMemorySchema)
    })
  } catch {
    return []
  }
}

export async function generateThreadTitle(firstMessage: string): Promise<string> {
  const client = getClient()

  try {
    return await withRetry(async () => {
      const response = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 30,
        system: 'Generate a short coaching thread title in 3 to 6 words. Return plain text only.',
        messages: [
          { role: 'user', content: firstMessage },
        ],
      })

      const text =
        response.content[0]?.type === 'text'
          ? response.content[0].text.trim().replace(/^["']|["']$/g, '')
          : 'Coaching session'

      return text.slice(0, 100) || 'Coaching session'
    })
  } catch {
    return 'Coaching session'
  }
}

const coachStarterSchema = z.object({
  insight: z.string().min(1).max(500),
  suggestions: z.array(z.string().min(1).max(100)).min(2).max(4),
})

export interface CoachStarter {
  insight: string
  suggestions: string[]
}

export async function generateCoachStarter(
  recentMessages: Array<{ sender: string; text: string }>,
): Promise<CoachStarter> {
  const client = getClient()

  const formatted = recentMessages
    .map((m) => `[${m.sender}] ${m.text}`)
    .join('\n')

  try {
    return await withRetry(async () => {
      const response = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 250,
        system: `You are a relationship coach reviewing a couple's recent WhatsApp messages.

Return a JSON object with:
- "insight": A brief observation (1-2 sentences) about the conversation tone, topic, or dynamic. Be specific to what you see, not generic.
- "suggestions": 3-4 short action prompts (5-10 words each) the user could tap to start a coaching conversation. Make them specific to the message content.

Examples of good suggestions: "Ask about her work stress", "Respond to the weekend plan", "Check in on how she's feeling", "Discuss the budget conversation"

Return ONLY valid JSON, no markdown.`,
        messages: [
          { role: 'user', content: `Recent messages:\n${formatted}` },
        ],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
      return parseValidatedResponse(text, coachStarterSchema)
    })
  } catch {
    return {
      insight: "I can see your recent conversation. Ask me anything about how it's going or what to say next.",
      suggestions: [
        'Help me reply thoughtfully',
        'How is our communication today?',
        'Suggest something nice to say',
      ],
    }
  }
}
