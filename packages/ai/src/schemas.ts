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

// Coerce any value to a string (handles objects, arrays, primitives)
const coerceString = z.any().transform((v) =>
  typeof v === 'string' ? v : JSON.stringify(v),
)

// AI returns wishes in many formats: strings, objects with varying fields
const flexibleWish = z.any().transform((v) => {
  if (typeof v === 'string') return { text: v, date: '', speaker: '' }
  if (v && typeof v === 'object') {
    return {
      text: String(v.text ?? v.wish ?? v.description ?? JSON.stringify(v)),
      date: String(v.date ?? ''),
      speaker: String(v.speaker ?? ''),
    }
  }
  return { text: String(v), date: '', speaker: '' }
})

export const extractedEntitiesSchema = z.object({
  wishes: z.array(flexibleWish),
  importantDates: z.array(z.object({
    description: z.string(),
    date: z.string(),
  })),
  interests: z.array(coerceString),
  loveLanguages: z.array(z.object({
    language: z.string(),
    confidence: z.number().min(0).max(1),
  }).strip()),
})

export const coachingTipsSchema = z.array(z.object({
  category: z.string(),
  tip: z.string(),
  context: z.string(),
}))
