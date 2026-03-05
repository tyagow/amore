import { z } from 'zod'

export const analysisResultSchema = z.object({
  healthScore: z.number().min(1).max(100),
  sentiments: z.array(z.object({
    index: z.number(),
    score: z.number().min(-1).max(1),
  })),
  patterns: z.object({
    initiationBalance: z.record(z.string(), z.number()),
    avgResponseMinutes: z.record(z.string(), z.number()),
    messageCountBySender: z.record(z.string(), z.number()),
    avgLengthBySender: z.record(z.string(), z.number()),
  }),
  summary: z.string().min(1),
})

export const extractedEntitiesSchema = z.object({
  wishes: z.array(z.object({
    text: z.string(),
    date: z.string(),
    speaker: z.string(),
  })),
  importantDates: z.array(z.object({
    description: z.string(),
    date: z.string(),
  })),
  interests: z.array(z.string()),
  loveLanguages: z.array(z.object({
    language: z.string(),
    confidence: z.number().min(0).max(1),
  })),
})

export const coachingTipsSchema = z.array(z.object({
  category: z.string(),
  tip: z.string(),
  context: z.string(),
}))
