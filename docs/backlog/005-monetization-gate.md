# TICKET-005: Monetization Gate — Free vs Premium Tier

## Priority: P1 — High

## Problem Statement

The `plan` field exists on the `users` table (`packages/db/src/schema.ts:14`) with `default('free')` but there is no payment integration, no feature gating logic, and no premium tier definition anywhere in the codebase. Every feature — unlimited AI Coach conversations (Sonnet streaming via `streamCoachResponse` in `packages/ai/src/coach-conversation.ts`), unlimited tone review (`reviewMessageTone` in `packages/ai/src/chat.ts`), full analysis pipeline (`runAnalysisPipeline` in `packages/ai/src/orchestrate.ts`), mood detection, advanced insights — is available to all users at zero cost.

**Cost exposure:** Each AI Coach exchange uses Claude Sonnet for streaming responses (`apps/web/server/routes/sse/coach.ts`), intent classification, memory extraction, thread title generation, and starter generation. Tone review also uses Sonnet. A single active couple can generate dozens of Sonnet calls per day with no throttle. Analysis runs automatically every 50 messages with Sonnet for conversation analysis + entity extraction + coaching tips. There is no usage metering.

**Retrofitting risk:** Users are currently using every feature for free. Introducing paywalls on features that were previously unlimited will create friction and churn. Defining the free/premium boundary now — before a wider launch — means users onboard with clear expectations rather than having features taken away.

**Current auth flow:** All server functions use `requireCouple()` (`apps/web/src/server/require-couple.ts`) which returns `{ session, couple, partnerId }`. The `session.user` object includes the `plan` field from the database but nothing reads it. The gating infrastructure needs to be built into this auth flow.

## Goals & Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Free-to-premium conversion | >5% of active couples within 60 days | `users` table `plan` field transitions from 'free' to 'premium' |
| Premium retention (month 2) | >80% of premium users retain | Stripe subscription status active at 60 days |
| Free tier engagement | Free users still active after gate | DAU of free users does not drop >20% after gate launch |
| AI cost per couple (free tier) | <$0.50/month per free couple | Track Anthropic API usage per couple via tagged requests |
| Upgrade funnel completion | >60% of users who click "Upgrade" complete checkout | Stripe checkout session created vs subscription activated |
| Revenue per couple (premium) | >$9/month | Stripe MRR / active premium couples |

## User Stories

**As a free user**, I want to use the dashboard, see my health score, set moods, manage goals, and get basic insights so that I get value from the platform without paying.

**As a free user**, I want to send up to 5 AI Coach messages per day so that I can experience the coaching feature and understand its value before upgrading.

**As a free user**, when I hit the coach message limit, I want to see a clear, non-aggressive upgrade prompt explaining what I get with premium, so that I feel invited rather than blocked.

**As a free user**, I want to trigger manual analysis once per week so that I get periodic relationship health updates without paying.

**As a premium user**, I want unlimited AI Coach conversations, tone review, advanced insights, and unlimited analysis so that I get the full relationship health experience.

**As a premium user**, I want to manage my subscription (cancel, update payment) from within the app so that I have full control.

**As a user considering upgrade**, I want to see a comparison of free vs premium features on a pricing page so that I can make an informed decision.

**As a couple**, if one partner upgrades to premium, the other partner should also get premium access so that the experience is shared.

## Technical Design

### Architecture Overview

```
[Client]                    [Server Functions]              [Stripe]
                            (apps/web/src/server/)
UI components          -->  requireCouple() + checkPlan()   
  upgrade modal             gate checks per feature    -->  Checkout Session
  pricing page              usage tracking                  Customer Portal
  limit indicators     <--  plan status + limits       <--  Webhooks
                                                            (subscription events)

[Nitro Routes]                                         [Database]
apps/web/server/routes/                                packages/db/src/schema.ts
  /api/stripe/webhook   <-- Stripe event delivery  --> users.plan, subscriptions table
  /api/stripe/checkout  --> Create checkout session
  /api/stripe/portal    --> Customer portal URL
```

### Plan Definition (Free vs Premium features)

| Feature | Free Tier | Premium Tier | Gate Location |
|---------|-----------|--------------|---------------|
| Dashboard + health score | Full access | Full access | None |
| Mood setting + partner moods | Full access | Full access | None |
| Goals (create, complete, dismiss) | Full access | Full access | None |
| WhatsApp connection + live chat | Full access | Full access | None |
| AI Coach conversations | 5 messages/day | Unlimited | `apps/web/server/routes/sse/coach.ts` |
| AI Coach starters/nudges | View only (no action) | Full access | `apps/web/src/server/coach.ts` (getCoachStarter) |
| Tone review | 1/day | 3/hour (existing rate limit) | `apps/web/src/server/chat.ts` (getChatAIReview) |
| AI reply suggestions | Disabled | Auto-generated | `apps/web/src/server/chat.ts` (getChatAISuggestions) |
| Live mood analysis | Disabled | Auto-triggered | `apps/web/src/server/chat.ts` (getChatAIMood) |
| Manual analysis trigger | 1/week | Unlimited | `apps/web/src/server/intelligence.ts` (triggerAnalysis) |
| Auto-analysis (50 msg threshold) | Active | Active | None (keep for all — drives health score) |
| Insights — Overview tab | Full access | Full access | None |
| Insights — Communication tab | Locked | Full access | `apps/web/src/routes/_authenticated/-components/insights/` |
| Insights — Emotions tab | Locked | Full access | Same |
| Insights — Discoveries tab | Locked | Full access | Same |
| Insights — Coaching tab | Locked | Full access | Same |
| Mood detection (AI) | Active | Active | None (keep for all — core value) |
| Profile (love languages, interests) | View-only (AI-populated) | Editable | `apps/web/src/server/profile.ts` (updateProfile) |
| Health score history trend | Last 7 days | Full history | `apps/web/src/server/intelligence.ts` |

### Implementation Phases

#### Phase 1: Gating Infrastructure + Plan Utilities

Build the server-side plan checking system and usage tracking without touching any UI or Stripe.

**Files to create:**
- `apps/web/src/server/plan.ts` — Plan checking utilities: `getUserPlan()`, `checkFeatureAccess(feature)`, `getUsageCount(userId, feature, window)`, `incrementUsage(userId, feature)`
- `packages/db/src/schema.ts` — Add `featureUsage` table for tracking daily/weekly limits

**Files to modify:**
- `packages/db/src/schema.ts` — Add `subscriptions` table (stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd), add `featureUsage` table
- `apps/web/src/server/require-couple.ts` — Extend return type to include `plan` field from user: `{ session, couple, partnerId, plan }`

**Plan configuration (in `apps/web/src/server/plan.ts`):**
```typescript
export const PLAN_LIMITS = {
  free: {
    coachMessagesPerDay: 5,
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
```

**Usage tracking schema:**
```sql
feature_usage (
  id uuid PK,
  user_id text FK -> users.id,
  feature varchar(50),    -- 'coach_message', 'tone_review', 'manual_analysis'
  used_at timestamp,
  INDEX (user_id, feature, used_at)
)
```

**Couple plan resolution:** When checking plan, look up BOTH users in the couple. If either has `plan='premium'`, treat both as premium. This is implemented in `getUserPlan()` which accepts the couple object and checks both `userAId` and `userBId`.

#### Phase 2: Server-Side Feature Gates

Apply plan checks to each gated server function and SSE route.

**Files to modify:**

1. **`apps/web/server/routes/sse/coach.ts`** — Before streaming, call `checkFeatureAccess('coach_message')`. If limit reached, send SSE event `{ type: 'limit_reached', feature: 'coach_message', limit: 5, resetAt: '<ISO timestamp>' }` and close stream. On success, call `incrementUsage(userId, 'coach_message')`.

2. **`apps/web/src/server/chat.ts`** — Gate `getChatAIReview` (tone review) with `checkFeatureAccess('tone_review')`. Gate `getChatAISuggestions` and `getChatAIMood` with boolean plan check (`replySuggestions`, `liveMoodAnalysis`). Return `{ gated: true, feature: '...', upgradeUrl: '/pricing' }` when blocked.

3. **`apps/web/src/server/intelligence.ts`** — Gate `triggerAnalysis` with `checkFeatureAccess('manual_analysis')`. Return usage count and reset time in error.

4. **`apps/web/src/server/coach.ts`** — Gate `getCoachStarter` for free users (return starter insight but not action prompts).

5. **`apps/web/src/server/profile.ts`** — Gate `updateProfile` for free users. Allow read via `getProfile`/`getPartnerProfile`.

6. **`apps/web/src/server/insights.ts`** — Add plan field to response so client knows which tabs to lock.

**Error response format (consistent across all gates):**
```typescript
interface GatedResponse {
  gated: true
  feature: string
  limit?: number
  used?: number
  resetAt?: string  // ISO timestamp when limit resets
  upgradeUrl: string
}
```

#### Phase 3: Client-Side UI Gates + Upgrade Prompts

Build the upgrade modals, lock indicators, and pricing page.

**Files to create:**
- `apps/web/src/routes/_authenticated/pricing.tsx` — Pricing page with free vs premium comparison table, CTA to Stripe checkout
- `apps/web/src/routes/_authenticated/-components/upgrade-modal.tsx` — Reusable modal shown when user hits a gate. Props: `feature`, `limit`, `resetAt`, `onDismiss`
- `apps/web/src/routes/_authenticated/-components/plan-badge.tsx` — Small "FREE" / "PREMIUM" badge for nav/profile
- `apps/web/src/hooks/use-plan.ts` — Client hook that exposes `plan`, `isPremium`, `checkLimit(feature)`, `showUpgradeModal(feature)`

**Files to modify:**

1. **`apps/web/src/hooks/use-coach.ts`** — Handle `limit_reached` SSE event from coach stream. When received, show upgrade modal instead of error.

2. **`apps/web/src/hooks/use-chat-ai.ts`** — Check plan before calling `getChatAISuggestions` and `getChatAIMood`. Skip calls entirely for free users. Handle gated response from `getChatAIReview`.

3. **`apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`** — Show remaining daily coach messages for free users (e.g., "3/5 messages today"). Show upgrade CTA when limit reached.

4. **`apps/web/src/routes/_authenticated/-components/chat/`** — Hide or disable tone review button for free users who hit daily limit. Hide AI suggestions panel for free users.

5. **`apps/web/src/routes/_authenticated/-components/insights/`** — Show lock overlay on Communication, Emotions, Discoveries, Coaching tabs for free users with upgrade CTA.

6. **`apps/web/src/routes/_authenticated.tsx`** — Load plan status in the authenticated layout `beforeLoad` and provide via context/provider.

7. **`apps/web/src/routes/_authenticated/-components/`** — Nav component: add plan badge, add "Upgrade" button for free users.

#### Phase 4: Stripe Integration + Webhooks

Wire up Stripe Checkout, Customer Portal, and webhook handlers.

**Files to create:**
- `apps/web/server/routes/api/stripe/webhook.ts` — Nitro route handling Stripe webhook events
- `apps/web/server/routes/api/stripe/checkout.ts` — Create Stripe Checkout session
- `apps/web/server/routes/api/stripe/portal.ts` — Create Stripe Customer Portal session
- `apps/web/src/server/subscription.ts` — Server functions: `createCheckoutSession()`, `getSubscriptionStatus()`, `createPortalSession()`

**Files to modify:**
- `packages/db/src/schema.ts` — Already added `subscriptions` table in Phase 1
- `apps/web/src/routes/_authenticated/pricing.tsx` — Wire up checkout button to `createCheckoutSession()`

**Stripe webhook events to handle:**
- `checkout.session.completed` — Set `users.plan = 'premium'`, create `subscriptions` row
- `customer.subscription.updated` — Update subscription status, handle plan changes
- `customer.subscription.deleted` — Set `users.plan = 'free'`, update subscription status
- `invoice.payment_failed` — Mark subscription as `past_due`, send notification (future: TICKET-001)

**Webhook security:** Verify Stripe signature using `STRIPE_WEBHOOK_SECRET` env var. Raw body parsing required (not JSON-parsed).

**Environment variables to add:**
- `STRIPE_SECRET_KEY` — Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY` — Stripe public key (client-side)
- `STRIPE_WEBHOOK_SECRET` — Webhook endpoint signing secret
- `STRIPE_PRICE_ID` — Price ID for premium plan

**Stripe Customer creation:** On first checkout, create Stripe Customer with `email` from `users.email`. Store `stripeCustomerId` in `subscriptions` table. Reuse on subsequent checkouts.

### Database Schema Changes

**New table: `subscriptions`**
```sql
subscriptions (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id text UNIQUE FK -> users.id ON DELETE CASCADE,
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  status varchar(50) NOT NULL DEFAULT 'inactive',
    -- 'active', 'past_due', 'canceled', 'inactive'
  current_period_end timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**New table: `feature_usage`**
```sql
feature_usage (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id text FK -> users.id ON DELETE CASCADE,
  feature varchar(50) NOT NULL,
  used_at timestamp NOT NULL DEFAULT now(),
  INDEX idx_usage_lookup (user_id, feature, used_at)
)
```

**Modified table: `users`** — No schema change needed. The `plan` varchar(20) field already exists with default 'free'. Premium sets it to 'premium'.

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /api/stripe/checkout` | POST | Session cookie | Create Stripe Checkout session, redirect to Stripe |
| `POST /api/stripe/portal` | POST | Session cookie | Create Customer Portal session URL |
| `POST /api/stripe/webhook` | POST | Stripe signature | Handle Stripe events (no session auth) |
| `getSubscriptionStatus` | Server fn | Session | Return plan, subscription status, period end |

### Integration Points

1. **`requireCouple()` extension** (`apps/web/src/server/require-couple.ts`) — Returns `plan` field so every downstream server function has access without a separate DB query.

2. **Couple plan sharing** — `getUserPlan()` in `apps/web/src/server/plan.ts` checks both partners. If either is premium, both get premium access. This means only one partner needs to subscribe.

3. **SSE coach stream** (`apps/web/server/routes/sse/coach.ts`) — The coach streaming endpoint is the most critical gate because it's the most expensive feature (Sonnet streaming + intent classification + memory extraction per exchange).

4. **Client hooks** — `use-plan.ts` provides plan context to all components. `use-coach.ts` and `use-chat-ai.ts` check plan before making expensive API calls.

5. **Auto-analysis** (`apps/wa-bridge/src/analysis/trigger.ts`) — NOT gated. Auto-analysis at the 50-message threshold runs for all users because health score is core to the free experience. Only manual `triggerAnalysis` is gated.

6. **Future: Push notifications (TICKET-001)** — When push notifications ship, premium users get all notification types. Free users get only critical alerts (mood alert, score drop >15).

## Acceptance Criteria

### Phase 1: Gating Infrastructure + Plan Utilities

- [ ] AC-1.1: `packages/db/src/schema.ts` exports a `subscriptions` table with columns: `id` (uuid PK), `userId` (text FK to users, unique), `stripeCustomerId` (varchar), `stripeSubscriptionId` (varchar), `status` (varchar, default 'inactive'), `currentPeriodEnd` (timestamp), `createdAt`, `updatedAt`.
- [ ] AC-1.2: `packages/db/src/schema.ts` exports a `featureUsage` table with columns: `id` (uuid PK), `userId` (text FK to users), `feature` (varchar), `usedAt` (timestamp), with an index on `(userId, feature, usedAt)`.
- [ ] AC-1.3: `apps/web/src/server/plan.ts` exports a `PLAN_LIMITS` constant with `free` and `premium` keys. `free.coachMessagesPerDay` equals `5`. `premium.coachMessagesPerDay` equals `Infinity`.
- [ ] AC-1.4: `apps/web/src/server/plan.ts` exports `getUserPlan(coupleId)` that queries both users in the couple and returns `'premium'` if either user has `plan='premium'`, otherwise `'free'`.
- [ ] AC-1.5: `apps/web/src/server/plan.ts` exports `checkFeatureAccess(userId, coupleId, feature)` that returns `{ allowed: true }` or `{ allowed: false, limit: number, used: number, resetAt: string }`. For `'coach_message'` with a free user, it counts rows in `featureUsage` where `feature='coach_message'` and `usedAt` is within the current UTC day.
- [ ] AC-1.6: `apps/web/src/server/plan.ts` exports `incrementUsage(userId, feature)` that inserts a row into `featureUsage`.
- [ ] AC-1.7: `apps/web/src/server/require-couple.ts` returns `plan` as a field in its return object (type `'free' | 'premium'`), resolved via `getUserPlan()`.
- [ ] AC-1.8: Running `pnpm db:push` succeeds with the new schema — both tables are created in the database.
- [ ] AC-1.9: `pnpm check-types` passes with zero errors after all Phase 1 changes.

### Phase 2: Server-Side Feature Gates

- [ ] AC-2.1: When a user with `plan='free'` sends their 6th coach message in a UTC day, the SSE endpoint at `apps/web/server/routes/sse/coach.ts` sends a JSON event `{ "type": "limit_reached", "feature": "coach_message", "limit": 5, "resetAt": "<next UTC midnight ISO>" }` and closes the stream without calling `streamCoachResponse`.
- [ ] AC-2.2: When a user with `plan='free'` sends their 1st-5th coach message, the SSE endpoint streams normally AND inserts a row into `featureUsage` with `feature='coach_message'`.
- [ ] AC-2.3: When a user with `plan='premium'` sends any coach message, the SSE endpoint streams normally with no limit check against `featureUsage`.
- [ ] AC-2.4: `getChatAIReview` in `apps/web/src/server/chat.ts` returns `{ gated: true, feature: 'tone_review', limit: 1, used: 1, resetAt: '...', upgradeUrl: '/pricing' }` when a free user has already used 1 tone review today. Premium users are never gated.
- [ ] AC-2.5: `getChatAISuggestions` in `apps/web/src/server/chat.ts` returns `{ gated: true, feature: 'reply_suggestions', upgradeUrl: '/pricing' }` for free users on every call. Premium users get normal suggestions.
- [ ] AC-2.6: `getChatAIMood` in `apps/web/src/server/chat.ts` returns `{ gated: true, feature: 'live_mood', upgradeUrl: '/pricing' }` for free users. Premium users get normal mood analysis.
- [ ] AC-2.7: `triggerAnalysis` in `apps/web/src/server/intelligence.ts` returns a gated response for free users who have already triggered 1 manual analysis in the current UTC week (Monday-Sunday). Returns `{ gated: true, feature: 'manual_analysis', limit: 1, used: 1, resetAt: '<next Monday UTC midnight>' }`.
- [ ] AC-2.8: `updateProfile` in `apps/web/src/server/profile.ts` returns `{ gated: true, feature: 'profile_editing', upgradeUrl: '/pricing' }` for free users. `getProfile` and `getPartnerProfile` remain ungated.
- [ ] AC-2.9: `getInsightsData` in `apps/web/src/server/insights.ts` includes a `gatedTabs: string[]` field in its response. For free users, `gatedTabs` contains `['communication', 'emotions', 'discoveries', 'coaching']`. For premium, it is empty.
- [ ] AC-2.10: Auto-analysis triggered by the 50-message threshold in `apps/wa-bridge/src/analysis/trigger.ts` is NOT gated and runs for all users regardless of plan.
- [ ] AC-2.11: If one partner in a couple has `plan='premium'`, the other partner is treated as premium for ALL gate checks (couple plan sharing).
- [ ] AC-2.12: `pnpm check-types` passes with zero errors after all Phase 2 changes.

### Phase 3: Client-Side UI Gates + Upgrade Prompts

- [ ] AC-3.1: File `apps/web/src/routes/_authenticated/pricing.tsx` exists and renders a comparison table showing all features from the Plan Definition table above, with a "Subscribe" button that calls `createCheckoutSession()`.
- [ ] AC-3.2: File `apps/web/src/routes/_authenticated/-components/upgrade-modal.tsx` exists and accepts props `{ feature: string, limit?: number, resetAt?: string, onDismiss: () => void }`. It renders the feature name, limit info, and a CTA button linking to `/pricing`.
- [ ] AC-3.3: `apps/web/src/hooks/use-plan.ts` exports `usePlan()` returning `{ plan, isPremium, limits, checkLimit }`. It fetches plan data from the authenticated layout context (not a separate API call).
- [ ] AC-3.4: In `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`, when `plan='free'`, a message counter is visible showing "X/5 messages today". When limit is reached, the input area is replaced with an upgrade CTA.
- [ ] AC-3.5: When the coach SSE stream returns a `limit_reached` event, `apps/web/src/hooks/use-coach.ts` triggers the upgrade modal with `feature='coach_message'` instead of displaying an error.
- [ ] AC-3.6: In `apps/web/src/hooks/use-chat-ai.ts`, when `plan='free'`, the hook does NOT call `getChatAISuggestions` or `getChatAIMood` (the functions are never invoked, not called and then blocked).
- [ ] AC-3.7: The tone review button in the chat UI is visible for free users but shows "0/1 remaining" after use. Clicking it after the limit shows the upgrade modal.
- [ ] AC-3.8: Insight tabs (Communication, Emotions, Discoveries, Coaching) in `apps/web/src/routes/_authenticated/-components/insights/` render a lock overlay with upgrade CTA for free users. The Overview tab is always accessible.
- [ ] AC-3.9: The authenticated layout at `apps/web/src/routes/_authenticated.tsx` loads plan status in `beforeLoad` and provides it via React context so child routes can access it without additional queries.
- [ ] AC-3.10: The nav component shows a "FREE" or "PREMIUM" badge and an "Upgrade" button (visible only for free users) that links to `/pricing`.
- [ ] AC-3.11: `pnpm build` succeeds with zero errors after all Phase 3 changes.

### Phase 4: Stripe Integration + Webhooks

- [ ] AC-4.1: `apps/web/server/routes/api/stripe/checkout.ts` creates a Stripe Checkout session in `subscription` mode using the `STRIPE_PRICE_ID` env var and redirects to the Stripe-hosted checkout page. The session includes `client_reference_id` set to the authenticated user's ID.
- [ ] AC-4.2: `apps/web/server/routes/api/stripe/portal.ts` creates a Stripe Customer Portal session using the `stripeCustomerId` from the `subscriptions` table and returns the portal URL.
- [ ] AC-4.3: `apps/web/server/routes/api/stripe/webhook.ts` verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET` env var and raw request body. Invalid signatures return 400.
- [ ] AC-4.4: On `checkout.session.completed` webhook event, the handler: (1) creates/updates a row in `subscriptions` with the Stripe customer ID and subscription ID, (2) sets `users.plan = 'premium'` for the user matching `client_reference_id`, (3) returns 200.
- [ ] AC-4.5: On `customer.subscription.deleted` webhook event, the handler: (1) sets `subscriptions.status = 'canceled'`, (2) sets `users.plan = 'free'` for the user associated with the Stripe customer ID, (3) returns 200.
- [ ] AC-4.6: On `customer.subscription.updated` webhook event, the handler updates `subscriptions.status` and `subscriptions.currentPeriodEnd` from the Stripe subscription object.
- [ ] AC-4.7: On `invoice.payment_failed` webhook event, the handler sets `subscriptions.status = 'past_due'`. The user retains `plan='premium'` (grace period) until Stripe sends `customer.subscription.deleted`.
- [ ] AC-4.8: The pricing page's "Subscribe" button calls `createCheckoutSession()`, which returns a Stripe Checkout URL, and the browser redirects to it.
- [ ] AC-4.9: After successful checkout, Stripe redirects to a success URL (e.g., `/pricing?success=true`) and the pricing page shows "You're on Premium" with a "Manage Subscription" button linking to the Customer Portal.
- [ ] AC-4.10: Environment variables `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` are documented in the project and required by the server at startup (with guard checks that log and fail fast if missing when Stripe routes are hit).
- [ ] AC-4.11: `pnpm build` succeeds and `pnpm check-types` passes with zero errors after all Phase 4 changes.

## Edge Cases & Risks

1. **Race condition on usage counting:** Two coach messages sent simultaneously could both pass the limit check before either increments. Mitigation: Use `SELECT COUNT(*) ... FOR UPDATE` or an atomic insert-and-count query. Acceptable to occasionally allow 6/5 messages rather than block legitimate usage.

2. **Couple plan sharing edge cases:**
   - Partner A upgrades, Partner B gets premium. Partner A cancels — both lose premium. The downgrade must be communicated clearly.
   - Partners in different timezones: usage resets at UTC midnight for both, not local time.
   - A user in two couples (after breakup + new relationship): plan applies to user, not couple. Both couples benefit.

3. **Stripe webhook ordering:** Webhooks can arrive out of order. A `customer.subscription.deleted` could arrive before `checkout.session.completed` during rapid subscribe/unsubscribe. Use `subscriptions.updatedAt` to reject stale events.

4. **Free tier abuse:** A user could create multiple accounts to get more free coach messages. Mitigation: Rate limiting is per-user, not per-device/IP. Acceptable risk at current scale.

5. **Existing users:** All current users have `plan='free'`. They lose access to features they've been using. Mitigation: Consider a 30-day grace period for existing users at launch (set `plan='grace'` with expiry, treated as premium until expiry).

6. **SSE coach stream mid-conversation:** User sends message 5 (within limit), receives streaming response. While streaming, the day rolls over to a new UTC day — the reset should NOT interrupt the current stream. The limit check happens only at stream initiation.

7. **Webhook endpoint security:** The Stripe webhook endpoint at `/api/stripe/webhook` must NOT require session authentication (Stripe calls it server-to-server). But it MUST verify the Stripe signature. The Nitro route must read the raw body before any JSON parsing middleware.

8. **Payment method failure:** When `invoice.payment_failed` fires, keep premium active (Stripe handles retry). Only downgrade on `customer.subscription.deleted` which fires after all retries fail.

## Dependencies

- **Stripe account** — Need a Stripe account with Products/Prices configured. A single Price object for the monthly premium plan.
- **Environment variables** — `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` must be set in Railway and `.env.local`.
- **npm package** — `stripe` package added to `apps/web/package.json`.
- **Railway webhook URL** — Stripe webhook endpoint needs a public URL. Railway provides this via the web service's public domain.
- **No dependency on TICKET-001 (Push Notifications)** — Monetization can ship independently. Future integration: premium users get all notification types, free users get critical only.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Gating Infrastructure | 1 day | Schema + utility functions, no UI changes |
| Phase 2: Server-Side Gates | 1-2 days | Modify 6 server files, consistent error format |
| Phase 3: Client-Side UI | 2-3 days | Pricing page, upgrade modal, modify 5+ components |
| Phase 4: Stripe Integration | 1-2 days | 3 new routes, webhook handling, end-to-end testing |
| **Total** | **5-8 days** | Can ship Phase 1-2 (server gates) independently of Phase 3-4 (UI + payments) |

## Open Questions

1. **Pricing:** What should the premium plan cost? $9.99/month? $14.99/month? Annual discount? This affects the Stripe Price object but not the code architecture.

2. **Free trial:** Should new users get a 7-day or 14-day premium trial to experience the full platform before hitting limits? This would require a `trialEnd` timestamp on the user or subscription.

3. **Grace period for existing users:** Current users have been using all features for free. How long should the grace period be? 30 days? 60 days? Should they get a permanent discount?

4. **Coach message limit:** Is 5 messages/day the right free limit? Too low kills engagement; too high reduces conversion pressure. Needs A/B testing after launch.

5. **Couple billing:** Should there be a "couple plan" where one payment covers both partners (current design), or should each partner subscribe independently? Current design (couple sharing) is simpler and more relationship-friendly.

6. **Annual billing:** Support annual billing at launch or add later? Stripe supports it natively but it adds a second Price object and UI complexity.
