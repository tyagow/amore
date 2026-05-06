import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { userRelationshipProfiles, users } from '@amore-couples/db/schema'
import { eq, and } from 'drizzle-orm'
import { PLAN_LIMITS, buildGatedResponse } from './plan'

// ── Types ───────────────────────────────────────────────

export interface ProfileData {
  loveLanguages: {
    primary: string
    secondary?: string
    source: 'ai' | 'manual'
  } | null
  communicationStyle: {
    type: string
    description: string
    source: 'ai' | 'manual'
  } | null
  interests: {
    items: string[]
    source: 'ai' | 'manual'
  } | null
}

export interface ExtractedProfileData {
  loveLanguages?: { primary: string; secondary?: string }
  communicationStyle?: { type: string; description: string }
  interests?: { items: string[] }
}

// ── Server Functions ────────────────────────────────────

/**
 * Upserts user_relationship_profiles with AI-extracted data.
 * Called after AI analysis completes. Preserves manual overrides
 * by only writing fields that are currently AI-sourced or null.
 */
export const writeProfileFromAnalysis = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      extractedData: z.object({
        loveLanguages: z.object({
          primary: z.string(),
          secondary: z.string().optional(),
        }).optional(),
        communicationStyle: z.object({
          type: z.string(),
          description: z.string(),
        }).optional(),
        interests: z.object({
          items: z.array(z.string()),
        }).optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const { couple, session } = await requireCouple()
    const coupleId = couple.id
    const userId = session.user.id
    const { extractedData } = data

    // Check for existing profile to preserve manual overrides
    const existing = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.coupleId, coupleId),
        eq(userRelationshipProfiles.userId, userId),
      ),
    })

    const loveLanguages =
      existing?.loveLanguages &&
      (existing.loveLanguages as ProfileData['loveLanguages'])?.source === 'manual'
        ? existing.loveLanguages
        : extractedData.loveLanguages
          ? { ...extractedData.loveLanguages, source: 'ai' as const }
          : existing?.loveLanguages ?? null

    const communicationStyle =
      existing?.communicationStyle &&
      (existing.communicationStyle as ProfileData['communicationStyle'])?.source === 'manual'
        ? existing.communicationStyle
        : extractedData.communicationStyle
          ? { ...extractedData.communicationStyle, source: 'ai' as const }
          : existing?.communicationStyle ?? null

    const interests =
      existing?.interests &&
      (existing.interests as ProfileData['interests'])?.source === 'manual'
        ? existing.interests
        : extractedData.interests
          ? { ...extractedData.interests, source: 'ai' as const }
          : existing?.interests ?? null

    const [upserted] = await db
      .insert(userRelationshipProfiles)
      .values({
        coupleId,
        userId,
        loveLanguages,
        communicationStyle,
        interests,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userRelationshipProfiles.coupleId,
          userRelationshipProfiles.userId,
        ],
        set: {
          loveLanguages,
          communicationStyle,
          interests,
          updatedAt: new Date(),
        },
      })
      .returning()

    return { success: true, id: upserted.id }
  })

/** Typed profile row with jsonb fields cast to known shapes. */
export interface ProfileRow {
  id: string
  coupleId: string
  userId: string
  loveLanguages: ProfileData['loveLanguages']
  communicationStyle: ProfileData['communicationStyle']
  interests: ProfileData['interests']
  updatedAt: Date
}

function castProfile(row: {
  id: string
  coupleId: string
  userId: string
  loveLanguages: unknown
  communicationStyle: unknown
  interests: unknown
  updatedAt: Date
}): ProfileRow {
  return {
    ...row,
    loveLanguages: normalizeLoveLanguages(row.loveLanguages),
    communicationStyle: normalizeCommunicationStyle(row.communicationStyle),
    interests: normalizeInterests(row.interests),
  }
}

export function normalizeLoveLanguages(value: unknown): ProfileData['loveLanguages'] {
  const source = readSource(value)

  if (typeof value === 'string') {
    const primary = value.trim()
    return primary ? { primary, source } : null
  }

  if (Array.isArray(value)) {
    const languages = value
      .flatMap((item) => {
        if (typeof item === 'string') return [{ language: item, confidence: 0 }]
        if (!item || typeof item !== 'object') return []
        const record = item as Record<string, unknown>
        const language = readString(record.language)
        if (!language) return []
        const confidence =
          typeof record.confidence === 'number' && Number.isFinite(record.confidence)
            ? record.confidence
            : 0
        return [{ language, confidence }]
      })
      .sort((a, b) => b.confidence - a.confidence)
      .map((item) => item.language)

    return languages[0]
      ? { primary: languages[0], secondary: languages[1], source }
      : null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const primary = readString(record.primary) || readString(record.language)
  const secondary = readString(record.secondary)

  return primary ? { primary, secondary, source } : null
}

export function normalizeCommunicationStyle(value: unknown): ProfileData['communicationStyle'] {
  const source = readSource(value)

  if (typeof value === 'string') {
    const type = value.trim()
    return type ? { type, description: '', source } : null
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const type = readString(record.type) || readString(record.style)
  const description = readString(record.description) || readString(record.summary) || ''

  return type ? { type, description, source } : null
}

export function normalizeInterests(value: unknown): ProfileData['interests'] {
  const source = readSource(value)
  const items = collectInterestItems(value)

  return items.length > 0 ? { items, source } : null
}

function collectInterestItems(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return uniqueLabels(value.flatMap(collectInterestItems))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('{')) {
      try {
        return collectInterestItems(JSON.parse(trimmed) as unknown)
      } catch {
        return [trimmed]
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value !== 'object') return [String(value).trim()].filter(Boolean)

  const record = value as Record<string, unknown>

  if (Array.isArray(record.items)) {
    return collectInterestItems(record.items)
  }

  const label =
    readString(record.topic) ||
    readString(record.title) ||
    readString(record.name) ||
    readString(record.label) ||
    readString(record.text)
  if (label) return [label]

  return uniqueLabels(
    Object.entries(record)
      .filter(([key]) => key !== 'source' && key !== 'confidence' && key !== 'evidence')
      .flatMap(([, item]) => collectInterestItems(item)),
  )
}

function readSource(value: unknown): 'ai' | 'manual' {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const source = (value as Record<string, unknown>).source
    if (source === 'manual') return 'manual'
  }
  return 'ai'
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueLabels(items: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const label = item.trim()
    if (!label || seen.has(label.toLowerCase())) continue
    seen.add(label.toLowerCase())
    result.push(label)
  }

  return result
}

/**
 * Get the current user's relationship profile.
 */
export const getProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple } = await requireCouple()

    const profile = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.coupleId, couple.id),
        eq(userRelationshipProfiles.userId, session.user.id),
      ),
    })

    return profile ? castProfile(profile) : null
  },
)

/**
 * Get the partner's relationship profile (read-only).
 */
export const getPartnerProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple, partnerId } = await requireCouple()

    const [profile, partner] = await Promise.all([
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.coupleId, couple.id),
          eq(userRelationshipProfiles.userId, partnerId),
        ),
      }),
      db.query.users.findFirst({
        where: eq(users.id, partnerId),
        columns: { name: true },
      }),
    ])

    return {
      profile: profile ? castProfile(profile) : null,
      partnerName: partner?.name ?? 'Your partner',
    }
  },
)

/**
 * Manual profile editing — user can override AI-extracted values.
 * Marks overridden fields with source: 'manual'.
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      loveLanguages: z.object({
        primary: z.string().min(1).max(100),
        secondary: z.string().max(100).optional(),
      }).optional(),
      communicationStyle: z.object({
        type: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
      }).optional(),
      interests: z.object({
        items: z.array(z.string().max(100)).max(50),
      }).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, couple, getPlan } = await requireCouple()
    const plan = await getPlan()

    // Gate: profile editing is premium-only
    if (!PLAN_LIMITS[plan].profileEditing) {
      return buildGatedResponse('profile_editing')
    }

    // Get existing profile to merge
    const existing = await db.query.userRelationshipProfiles.findFirst({
      where: and(
        eq(userRelationshipProfiles.coupleId, couple.id),
        eq(userRelationshipProfiles.userId, session.user.id),
      ),
    })

    const loveLanguages = data.loveLanguages
      ? { ...data.loveLanguages, source: 'manual' as const }
      : existing?.loveLanguages ?? null

    const communicationStyle = data.communicationStyle
      ? { ...data.communicationStyle, source: 'manual' as const }
      : existing?.communicationStyle ?? null

    const interests = data.interests
      ? { ...data.interests, source: 'manual' as const }
      : existing?.interests ?? null

    const [upserted] = await db
      .insert(userRelationshipProfiles)
      .values({
        coupleId: couple.id,
        userId: session.user.id,
        loveLanguages,
        communicationStyle,
        interests,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userRelationshipProfiles.coupleId,
          userRelationshipProfiles.userId,
        ],
        set: {
          loveLanguages,
          communicationStyle,
          interests,
          updatedAt: new Date(),
        },
      })
      .returning()

    return { success: true, id: upserted.id }
  })
