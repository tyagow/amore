# TICKET-009: Stripe Integration (Freemium Activation)

## Priority: P1 — High

## Problem Statement

TICKET-005 implemented the gating infrastructure (Phases 1-3): plan limits, server-side feature gates, client-side UI with upgrade modals, and a pricing page. However, Phase 4 (Stripe integration) was deliberately skipped. The current state is:

- Free users see upgrade CTAs and limit counters ("3/3 coach messages today")
- The pricing page exists at `/pricing` with a feature comparison table
- The "Subscribe" button on the pricing page has NO backend — clicking it does nothing (or shows a placeholder)
- The `subscriptions` table exists in the schema with `stripeCustomerId`, `stripeSubscriptionId`, `status`, `currentPeriodEnd` columns — all empty
- `users.plan` is `'free'` for all users with no way to change it except direct DB update
- The `PLAN_LIMITS.free.coachMessagesPerDay` is set to 3 in `apps/web/src/server/plan.ts`

**Business impact:** The entire monetization funnel is broken at the payment step. Users who WANT to upgrade cannot. The upgrade CTAs drive users to a dead end, which is worse than having no CTAs at all.

**What's already built (from TICKET-005):**
- `apps/web/src/server/plan.ts` — `PLAN_LIMITS`, `getUserPlan()`, `checkFeatureAccess()`, `incrementUsage()`, `buildGatedResponse()`
- `apps/web/src/server/require-couple.ts` — Returns `getPlan()` function
- Server-side gates on coach SSE, tone review, reply suggestions, live mood, manual analysis, profile editing, insights tabs
- Client-side upgrade modal, plan badge, pricing page shell, coach message counter

**What needs to be built:**
- Stripe Checkout session creation
- Stripe Customer Portal session creation
- Stripe webhook handler for subscription lifecycle events
- Wiring the pricing page "Subscribe" button to Stripe Checkout
- Updating `users.plan` based on Stripe events

## Technical Design

### Phase 1: Stripe Setup & Package Installation

1. **Install Stripe SDK:**
   ```bash
   cd apps/web && pnpm add stripe
   ```

2. **Create Stripe product and price** (via Stripe Dashboard or CLI):
   - Product: "Amore Premium"
   - Price: $X.XX/month recurring (exact price TBD, use $9.99 as default)
   - Copy the `price_id` (e.g., `price_1xxx...`)

3. **Set environment variables** on Railway web service:
   | Variable | Source | Notes |
   |----------|--------|-------|
   | `STRIPE_SECRET_KEY` | Stripe Dashboard > API Keys | `sk_live_...` for prod, `sk_test_...` for test |
   | `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > API Keys | `pk_live_...` / `pk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks (after creating endpoint) | `whsec_...` |
   | `STRIPE_PRICE_ID` | Stripe Dashboard > Products > Price | `price_...` |

4. **Add Stripe client utility** `apps/web/src/lib/stripe.ts`:
   ```typescript
   import Stripe from 'stripe'
   
   const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
   if (!STRIPE_SECRET_KEY) {
     console.warn('[stripe] STRIPE_SECRET_KEY not set — Stripe disabled')
   }
   
   export const stripe = STRIPE_SECRET_KEY
     ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
     : null
   ```

### Phase 2: Checkout & Portal Endpoints

**Create `apps/web/server/routes/api/stripe/checkout.ts`** — Nitro route:
```typescript
import { defineEventHandler, readBody, sendRedirect } from 'h3'
import { stripe } from '~/lib/stripe'
import { auth } from '~/lib/auth'
import { db } from '@amore-couples/db'
import { subscriptions } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  if (!stripe) return { error: 'Stripe not configured' }
  
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) return sendError(event, createError({ statusCode: 401 }))

  // Reuse existing Stripe customer if they have one
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    customer: existingSub?.stripeCustomerId ?? undefined,
    customer_email: existingSub ? undefined : session.user.email,
    client_reference_id: session.user.id,
    success_url: `${process.env.WEB_APP_URL}/pricing?success=true`,
    cancel_url: `${process.env.WEB_APP_URL}/pricing?canceled=true`,
  })

  return { url: checkoutSession.url }
})
```

**Create `apps/web/server/routes/api/stripe/portal.ts`**:
```typescript
export default defineEventHandler(async (event) => {
  // Lookup stripeCustomerId from subscriptions table
  // Create Customer Portal session
  // Return { url: portalSession.url }
})
```

### Phase 3: Webhook Handler

**Create `apps/web/server/routes/api/stripe/webhook.ts`**:

This is the most critical file. It must:
1. Read the RAW request body (not JSON-parsed) for signature verification
2. Verify the Stripe signature using `STRIPE_WEBHOOK_SECRET`
3. Handle subscription lifecycle events
4. Update `users.plan` and `subscriptions` table

**Events to handle:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create `subscriptions` row, set `users.plan = 'premium'` |
| `customer.subscription.updated` | Update `subscriptions.status` and `currentPeriodEnd` |
| `customer.subscription.deleted` | Set `subscriptions.status = 'canceled'`, set `users.plan = 'free'` |
| `invoice.payment_failed` | Set `subscriptions.status = 'past_due'` (keep premium active for grace) |

**Webhook security:**
- Verify Stripe signature on every request
- Use `event.node.req` to get raw body (h3/Nitro)
- Do NOT require session auth (Stripe calls this server-to-server)
- Return 200 quickly (process async if needed)

**Stale event protection:** Use `subscriptions.updatedAt` to reject events older than the last processed event (prevents out-of-order webhook processing).

### Phase 4: Wire Up Client

1. **Pricing page** (`apps/web/src/routes/_authenticated/pricing.tsx`):
   - "Subscribe" button calls `POST /api/stripe/checkout`
   - On success, redirect browser to `checkoutSession.url`
   - After checkout, Stripe redirects to `/pricing?success=true`
   - Show "You're on Premium!" state when `plan === 'premium'`
   - "Manage Subscription" button calls `POST /api/stripe/portal` and redirects

2. **Upgrade modal** — The existing upgrade modal links to `/pricing`. No changes needed.

3. **Post-upgrade reactivity** — After Stripe webhook fires and sets `plan = 'premium'`, the user needs to see the change. Options:
   - Client polls plan status after checkout success redirect
   - SSE event for plan change (add to existing `/sse/user-events`)

### Phase 5: Testing with Stripe Test Mode

1. Use `sk_test_` and `pk_test_` keys during development
2. Create a test webhook endpoint pointing to a public URL (use Railway preview or ngrok)
3. Test the full flow:
   - Click Subscribe → Stripe Checkout → Test card `4242424242424242` → Success redirect
   - Verify `users.plan = 'premium'` in DB
   - Verify `subscriptions` row created
   - Test cancellation via Customer Portal
   - Verify `users.plan = 'free'` after cancellation webhook
4. Test edge cases:
   - Payment failure (test card `4000000000000341`)
   - Webhook replay (send same event twice — should be idempotent)
   - Quick subscribe/unsubscribe (out-of-order webhooks)

## Acceptance Criteria

### Phase 1: Setup
- [ ] AC-1.1: `stripe` package is listed in `apps/web/package.json` dependencies.
- [ ] AC-1.2: `apps/web/src/lib/stripe.ts` exports a `stripe` instance (or null when env var missing). It does NOT throw on startup when `STRIPE_SECRET_KEY` is unset.
- [ ] AC-1.3: Railway web service has `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` environment variables set.

### Phase 2: Checkout & Portal
- [ ] AC-2.1: `POST /api/stripe/checkout` with a valid session cookie returns `{ url: "https://checkout.stripe.com/..." }`.
- [ ] AC-2.2: `POST /api/stripe/checkout` without a session cookie returns HTTP 401.
- [ ] AC-2.3: `POST /api/stripe/portal` with a valid session cookie and existing `stripeCustomerId` returns `{ url: "https://billing.stripe.com/..." }`.
- [ ] AC-2.4: `POST /api/stripe/portal` without a `stripeCustomerId` (user never subscribed) returns an appropriate error.

### Phase 3: Webhook
- [ ] AC-3.1: `POST /api/stripe/webhook` with an invalid signature returns HTTP 400.
- [ ] AC-3.2: `POST /api/stripe/webhook` with a valid `checkout.session.completed` event sets the user's `plan` to `'premium'` and creates a `subscriptions` row with `status = 'active'`.
- [ ] AC-3.3: `POST /api/stripe/webhook` with a valid `customer.subscription.deleted` event sets the user's `plan` to `'free'` and sets `subscriptions.status = 'canceled'`.
- [ ] AC-3.4: `POST /api/stripe/webhook` with a valid `invoice.payment_failed` event sets `subscriptions.status = 'past_due'` but does NOT change `users.plan` (grace period).
- [ ] AC-3.5: Sending the same webhook event twice does not create duplicate `subscriptions` rows (idempotent handling).
- [ ] AC-3.6: The webhook endpoint does NOT require session cookie authentication.

### Phase 4: Client Integration
- [ ] AC-4.1: Clicking "Subscribe" on the pricing page redirects the browser to a Stripe Checkout page.
- [ ] AC-4.2: After successful checkout, the browser is redirected to `/pricing?success=true` and the page shows a premium confirmation message.
- [ ] AC-4.3: When `plan === 'premium'`, the pricing page shows "Manage Subscription" button instead of "Subscribe".
- [ ] AC-4.4: Clicking "Manage Subscription" redirects to the Stripe Customer Portal.

### Phase 5: End-to-End
- [ ] AC-5.1: Full subscribe flow works: pricing page → Stripe Checkout (test card) → success redirect → `users.plan = 'premium'` in DB → coach messages unlimited.
- [ ] AC-5.2: Full cancel flow works: Customer Portal → cancel → webhook → `users.plan = 'free'` → coach messages limited to 3/day.
- [ ] AC-5.3: `pnpm build` and `pnpm check-types` pass with zero errors.

## Dependencies

- **TICKET-005** (Monetization Gate) — Phases 1-3 already implemented. This ticket is Phase 4.
- **TICKET-006** (DB Migration) — `subscriptions` table must exist in prod.
- **TICKET-007** (Railway Deploy) — Env vars must be configured on Railway.
- **Stripe account** — Need a Stripe account with a product/price configured.

## Edge Cases & Risks

1. **Raw body parsing:** Stripe signature verification requires the raw request body. Nitro/h3 may auto-parse JSON bodies. The webhook handler must use `readRawBody(event)` or equivalent to get the unparsed body.

2. **Couple plan sharing:** When user A subscribes, user B gets premium via `getUserPlan()` which checks both users in the couple. When user A cancels, user B loses premium. The cancellation webhook must NOT send a notification to user B (they didn't subscribe). But the plan change should be reflected in their next page load.

3. **Webhook endpoint URL:** After deploying to Railway, register the webhook URL in Stripe Dashboard: `https://web-production-08d3b.up.railway.app/api/stripe/webhook`. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

4. **Test vs Live mode:** Use Stripe test keys in development, live keys in production. The same code handles both — only the env vars differ.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Setup | 30 min | Install package, create Stripe product, set env vars |
| Phase 2: Checkout & Portal | 2 hours | 2 Nitro routes + server function |
| Phase 3: Webhook | 3 hours | Most complex — raw body parsing, event handling, idempotency |
| Phase 4: Client wiring | 1-2 hours | Wire pricing page, add portal button, success state |
| Phase 5: Testing | 1-2 hours | Full flow with test cards |
| **Total** | **7-10 hours** | Can be spread across 2 days |
