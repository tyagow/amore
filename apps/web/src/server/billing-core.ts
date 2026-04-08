import { db } from '@amore-couples/db'
import { subscriptions, users } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import type { Plan } from './plan'

const PREMIUM_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
])

type SubscriptionRow = typeof subscriptions.$inferSelect

export interface BillingStatus {
  plan: Plan
  premiumSource: 'self' | 'partner' | 'none'
  canManageSubscription: boolean
  subscription: {
    status: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    currentPeriodEnd: string | null
  } | null
}

function toDateFromUnix(seconds: number | null | undefined) {
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null
}

export function isPremiumSubscriptionStatus(
  status: string | null | undefined,
): status is Stripe.Subscription.Status {
  return !!status && PREMIUM_STATUSES.has(status as Stripe.Subscription.Status)
}

export async function getSubscriptionByUserId(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
}

export async function findSubscriptionByStripeReference(args: {
  stripeSubscriptionId?: string | null
  stripeCustomerId?: string | null
}) {
  const { stripeSubscriptionId, stripeCustomerId } = args

  if (stripeSubscriptionId) {
    const bySubscriptionId = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
    })
    if (bySubscriptionId) return bySubscriptionId
  }

  if (stripeCustomerId) {
    return db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
    })
  }

  return null
}

export async function updateUserPlan(userId: string, plan: Plan) {
  await db
    .update(users)
    .set({
      plan,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}

export async function syncSubscriptionFromStripe(args: {
  userId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  status: string
  currentPeriodEnd?: number | null
  targetPlan?: Plan
  eventCreatedAt?: Date
}) {
  const existing =
    await findSubscriptionByStripeReference({
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
    }) ??
    (args.userId ? await getSubscriptionByUserId(args.userId) : null)

  if (
    existing?.updatedAt &&
    args.eventCreatedAt &&
    existing.updatedAt.getTime() >= args.eventCreatedAt.getTime()
  ) {
    return { applied: false as const, reason: 'stale' as const, subscription: existing }
  }

  const targetUserId = args.userId ?? existing?.userId
  if (!targetUserId) {
    return { applied: false as const, reason: 'missing-user' as const, subscription: existing }
  }

  const [subscription] = await db
    .insert(subscriptions)
    .values({
      userId: targetUserId,
      stripeCustomerId: args.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
      stripeSubscriptionId:
        args.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
      status: args.status,
      currentPeriodEnd:
        toDateFromUnix(args.currentPeriodEnd) ?? existing?.currentPeriodEnd ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: args.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
        stripeSubscriptionId:
          args.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
        status: args.status,
        currentPeriodEnd:
          toDateFromUnix(args.currentPeriodEnd) ?? existing?.currentPeriodEnd ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()

  if (args.targetPlan) {
    await updateUserPlan(targetUserId, args.targetPlan)
  }

  return { applied: true as const, subscription }
}

export function toBillingStatus(
  subscription: SubscriptionRow | null,
  plan: Plan,
): BillingStatus {
  const premiumSource =
    plan === 'premium'
      ? isPremiumSubscriptionStatus(subscription?.status) ? 'self' : 'partner'
      : 'none'

  return {
    plan,
    premiumSource,
    canManageSubscription: Boolean(subscription?.stripeCustomerId),
    subscription: subscription
      ? {
          status: subscription.status,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
  }
}
