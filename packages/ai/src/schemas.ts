import { z } from 'zod'

// The AI sometimes returns a plain number instead of a record — coerce to record
const flexibleRecord = z.union([
  z.record(z.string(), z.number()),
  z.number().transform((n) => ({ _overall: n })),
])

export const analysisResultSchema = z.object({
  healthScore: z.number().min(1).max(100),
  sentiments: z.array(z.object({
    index: z.number(),
    score: z.number().min(-1).max(1),
  })),
  patterns: z.object({
    initiationBalance: flexibleRecord,
    avgResponseMinutes: flexibleRecord,
    messageCountBySender: flexibleRecord,
    avgLengthBySender: flexibleRecord,
  }),
  summary: z.string().min(1),
})

// AI sometimes returns wishes as plain strings instead of objects
const flexibleWish = z.union([
  z.object({ text: z.string(), date: z.string(), speaker: z.string() }),
  z.string().transform((s) => ({ text: s, date: '', speaker: '' })),
])

// AI sometimes adds extra fields like "evidence" to love languages — strip them
const flexibleLoveLanguage = z.object({
  language: z.string(),
  confidence: z.number().min(0).max(1),
}).strip()

export const extractedEntitiesSchema = z.object({
  wishes: z.array(flexibleWish),
  importantDates: z.array(z.object({
    description: z.string(),
    date: z.string(),
  })),
  interests: z.array(z.string()),
  loveLanguages: z.array(flexibleLoveLanguage),
})

export const coachingTipsSchema = z.array(z.object({
  category: z.string(),
  tip: z.string(),
  context: z.string(),
}))
