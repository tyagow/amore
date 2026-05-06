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

const normalizeConfidence = (value: unknown, fallback = 0.5) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(1, Math.max(0, numeric))
}

const normalizeLoveLanguageItem = (value: unknown): Array<{ language: string; confidence: number }> => {
  if (typeof value === 'string') {
    const language = value.trim()
    return language ? [{ language, confidence: 0.5 }] : []
  }

  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>

  if (typeof record.language === 'string') {
    const language = record.language.trim()
    return language
      ? [{ language, confidence: normalizeConfidence(record.confidence) }]
      : []
  }

  const ranked = [record.primary, record.secondary, record.tertiary]
    .filter((language): language is string => typeof language === 'string' && language.trim().length > 0)
    .map((language, index) => ({
      language: language.trim(),
      confidence: normalizeConfidence(record.confidence, index === 0 ? 0.8 : 0.6),
    }))
  if (ranked.length > 0) return ranked

  return Object.entries(record)
    .filter(([language]) => language !== 'confidence')
    .flatMap(([language, confidence]) => {
      if (!language.trim()) return []
      if (typeof confidence === 'number' || typeof confidence === 'string') {
        return [{ language, confidence: normalizeConfidence(confidence) }]
      }
      return []
    })
}

const flexibleLoveLanguages = z.any().transform((value) => {
  if (Array.isArray(value)) return value.flatMap(normalizeLoveLanguageItem)
  return normalizeLoveLanguageItem(value)
})

export const extractedEntitiesSchema = z.object({
  wishes: z.array(flexibleWish),
  importantDates: z.array(z.object({
    description: z.string(),
    date: z.string(),
  })),
  interests: z.array(coerceString),
  loveLanguages: flexibleLoveLanguages.pipe(z.array(z.object({
    language: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }).strip())),
})

export const coachingTipsSchema = z.array(z.object({
  category: z.string(),
  tip: z.string(),
  context: z.string(),
}))
