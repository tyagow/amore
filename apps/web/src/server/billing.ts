import { createServerFn } from '@tanstack/react-start'
import { db } from '@amore-couples/db'
import { subscriptions, users } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { optionalCouple, requireAuth } from './require-couple'
import { stripe } from '~/lib/stripe'
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

function getAppUrl() {
  return process.env.WEB_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
}

function requireStripeClient() {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.')
  }
  return stripe
}

function requireStripePriceId() {
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    throw new Error('Stripe is not configured. Set STRIPE_PRICE_ID.')
  }
  return priceId
}

function toDateFromUnix(seconds: number | null | undefined) {
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null
}

export function isPremiumSubscriptionStatus(
  status: string | null | undefined,
): status is Stripe.Subscription.Status {
  return !!status && PREMIUM_STATUSES.has(status as Stripe.Subscription.Status)
}

async function getSubscriptionByUserId(userId: string) {
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

function toBillingStatus(subscription: SubscriptionRow | null, plan: Plan): BillingStatus {
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

export const getBillingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, getPlan } = await optionalCouple()
    const [plan, subscription] = await Promise.all([
      getPlan(),
      getSubscriptionByUserId(session.user.id),
    ])

    return toBillingStatus(subscription ?? null, plan)
  },
)

export const createCheckoutSession = createServerFn({ method: 'POST' }).handler(
  async () => {
    const stripeClient = requireStripeClient()
    const priceId = requireStripePriceId()
    const { session, getPlan } = await optionalCouple()

    const [plan, existingSubscription] = await Promise.all([
      getPlan(),
      getSubscriptionByUserId(session.user.id),
    ])

    if (plan === 'premium') {
      throw new Error('Premium is already active for this account.')
    }

    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: existingSubscription?.stripeCustomerId ?? undefined,
      customer_email:
        existingSubscription?.stripeCustomerId ? undefined : session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/dashboard?upgraded=true`,
      cancel_url: `${getAppUrl()}/pricing`,
    })

    if (!checkoutSession.url) {
      throw new Error('Stripe checkout session did not include a redirect URL.')
    }

    return { url: checkoutSession.url }
  },
)

export const createPortalSession = createServerFn({ method: 'POST' }).handler(
  async () => {
    const stripeClient = requireStripeClient()
    const session = await requireAuth()
    const subscription = await getSubscriptionByUserId(session.user.id)

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this account.')
    }

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getAppUrl()}/pricing`,
    })

    return { url: portalSession.url }
  },
)
