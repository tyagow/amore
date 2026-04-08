import { createServerFn } from '@tanstack/react-start'
import { optionalCouple, requireAuth } from './require-couple'
import { stripe } from '~/lib/stripe'
import {
  getSubscriptionByUserId,
  toBillingStatus,
  type BillingStatus,
} from './billing-core'

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
