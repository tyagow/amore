import { db } from '@amore-couples/db'
import { users, featureUsage, couples } from '@amore-couples/db/schema'
import { eq, and, gte, sql, or } from 'drizzle-orm'

// ── Plan Limits ─────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    coachMessagesPerDay: 3,
    toneReviewsPerDay: 1,
    manualAnalysisPerWeek: 1,
    replySuggestions: false,
    liveMoodAnalysis: false,
    advancedInsights: false,
    profileEditing: false,
    fullScoreHistory: false,
  },
  premium: {
    coachMessagesPerDay: Infinity,
    toneReviewsPerDay: Infinity,
    manualAnalysisPerWeek: Infinity,
    replySuggestions: true,
    liveMoodAnalysis: true,
    advancedInsights: true,
    profileEditing: true,
    fullScoreHistory: true,
  },
} as const

export type Plan = 'free' | 'premium'
export type Feature = 'coach_message' | 'tone_review' | 'manual_analysis'

// Free insight types (overview tab)
export const FREE_INSIGHT_TYPES = [
  'health_score',
  'communication_pattern',
  'coaching_tip',
] as const

// Premium insight tabs that are gated for free users
export const GATED_TABS = [
  'communication',
  'emotions',
  'discoveries',
  'coaching',
] as const

// ── Plan Resolution ─────────────────────────────────────

/**
 * Resolve the effective plan for a couple. If EITHER partner has
 * plan='premium', both get premium access.
 */
export async function getUserPlan(coupleId: string): Promise<Plan> {
  // 2 queries → 1: fetch couple then check both users' plans in a single query
  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, coupleId),
    columns: { userAId: true, userBId: true },
  })
  if (!couple) return 'free'

  const premiumUser = await db.query.users.findFirst({
    where: and(
      or(eq(users.id, couple.userAId), eq(users.id, couple.userBId)),
      eq(users.plan, 'premium'),
    ),
    columns: { id: true },
  })
  return premiumUser ? 'premium' : 'free'
}

/**
 * For solo users without a couple, just check the user's own plan.
 */
export async function getUserPlanSolo(userId: string): Promise<Plan> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { plan: true },
  })
  return (user?.plan as Plan) ?? 'free'
}

// ── Feature Access Check ────────────────────────────────

interface AccessAllowed {
  allowed: true
}

interface AccessDenied {
  allowed: false
  limit: number
  used: number
  resetAt: string
}

export type FeatureAccessResult = AccessAllowed | AccessDenied

/**
 * Check whether a user can use a feature given their plan and daily/weekly limits.
 */
export async function checkFeatureAccess(
  userId: string,
  plan: Plan,
  feature: Feature,
): Promise<FeatureAccessResult> {
  if (plan === 'premium') {
    return { allowed: true }
  }

  const { limit, windowStart, resetAt } = getFeatureWindow(feature)

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(featureUsage)
    .where(
      and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.feature, feature),
        gte(featureUsage.usedAt, windowStart),
      ),
    )

  const used = result?.count ?? 0

  if (used >= limit) {
    return { allowed: false, limit, used, resetAt }
  }

  return { allowed: true }
}

/**
 * Increment usage counter for a feature.
 */
export async function incrementUsage(
  userId: string,
  feature: Feature,
): Promise<void> {
  await db.insert(featureUsage).values({
    userId,
    feature,
  })
}

// ── Helpers ─────────────────────────────────────────────

function getFeatureWindow(feature: Feature): {
  limit: number
  windowStart: Date
  resetAt: string
} {
  const now = new Date()

  switch (feature) {
    case 'coach_message': {
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000)
      return {
        limit: PLAN_LIMITS.free.coachMessagesPerDay,
        windowStart: todayUtc,
        resetAt: tomorrowUtc.toISOString(),
      }
    }
    case 'tone_review': {
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000)
      return {
        limit: PLAN_LIMITS.free.toneReviewsPerDay,
        windowStart: todayUtc,
        resetAt: tomorrowUtc.toISOString(),
      }
    }
    case 'manual_analysis': {
      // Weekly window: Monday-Sunday UTC
      const day = now.getUTCDay() // 0=Sun, 1=Mon, ...
      const daysSinceMonday = day === 0 ? 6 : day - 1
      const monday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - daysSinceMonday,
      ))
      const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000)
      return {
        limit: PLAN_LIMITS.free.manualAnalysisPerWeek,
        windowStart: monday,
        resetAt: nextMonday.toISOString(),
      }
    }
  }
}

// ── Gated Response Builder ──────────────────────────────

export interface GatedResponse {
  gated: true
  feature: string
  limit?: number
  used?: number
  resetAt?: string
  upgradeUrl: string
}

export function buildGatedResponse(
  feature: string,
  accessResult?: AccessDenied,
): GatedResponse {
  return {
    gated: true,
    feature,
    limit: accessResult?.limit,
    used: accessResult?.used,
    resetAt: accessResult?.resetAt,
    upgradeUrl: '/pricing',
  }
}
