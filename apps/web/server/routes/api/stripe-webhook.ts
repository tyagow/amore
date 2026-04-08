import {
  createError,
  defineEventHandler,
  getRequestHeader,
  readRawBody,
} from 'h3'
import type Stripe from 'stripe'
import { stripe } from '../../../src/lib/stripe'
import {
  isPremiumSubscriptionStatus,
  syncSubscriptionFromStripe,
} from '../../../src/server/billing-core'

function requireStripeClient() {
  if (!stripe) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe is not configured.',
    })
  }
  return stripe
}

function requireWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'STRIPE_WEBHOOK_SECRET is not configured.',
    })
  }
  return secret
}

function toStripeId(
  value:
    | string
    | { id: string }
    | null
    | undefined,
) {
  return typeof value === 'string' ? value : value?.id ?? null
}

function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription | Stripe.Response<Stripe.Subscription>,
) {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number')

  if (periodEnds.length === 0) {
    return null
  }

  return Math.max(...periodEnds)
}

export default defineEventHandler(async (event) => {
  const stripeClient = requireStripeClient()
  const webhookSecret = requireWebhookSecret()
  const signature = getRequestHeader(event, 'stripe-signature')

  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Stripe signature.' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing webhook payload.' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    )
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Invalid Stripe signature.',
    })
  }

  const eventCreatedAt = new Date(stripeEvent.created * 1000)

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null
      const userId = session.client_reference_id ?? session.metadata?.userId ?? null

      if (!subscriptionId || !userId) {
        break
      }

      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
      await syncSubscriptionFromStripe({
        userId,
        stripeCustomerId: toStripeId(session.customer),
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
        targetPlan: 'premium',
        eventCreatedAt,
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      await syncSubscriptionFromStripe({
        userId: subscription.metadata.userId ?? null,
        stripeCustomerId: toStripeId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
        targetPlan: isPremiumSubscriptionStatus(subscription.status)
          ? 'premium'
          : 'free',
        eventCreatedAt,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      await syncSubscriptionFromStripe({
        userId: subscription.metadata.userId ?? null,
        stripeCustomerId: toStripeId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        status: 'canceled',
        currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
        targetPlan: 'free',
        eventCreatedAt,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      await syncSubscriptionFromStripe({
        stripeCustomerId: toStripeId(invoice.customer),
        stripeSubscriptionId:
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : invoice.parent?.subscription_details?.subscription?.id ?? null,
        status: 'past_due',
        currentPeriodEnd: invoice.period_end ?? null,
        eventCreatedAt,
      })
      break
    }

    default:
      break
  }

  return { received: true }
})
