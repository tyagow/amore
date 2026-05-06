# TICKET-001: Push Notifications & Re-engagement System

## Priority: P0 — Critical

## Problem Statement

The Amore Couples platform generates high-value intelligence continuously — mood shift detections, coach nudges (score drops, conflict alerts, milestones), coaching tips, health score changes, goal deadlines, and partner mood alerts — but has **zero outbound delivery channels**. Every signal fires into the void unless the user happens to have the browser tab open.

The current real-time infrastructure (`/sse/updates`, `/sse/user-events`, `/sse/coach`, `/ws/chat`) is purely session-bound: SSE uses in-memory EventEmitter (`apps/web/src/lib/events.ts`) which only reaches connected browser tabs. When a partner sets their mood to "struggling" with visibility `alert`, the `emitCoupleEvent()` call in `apps/web/src/server/mood.ts:44` goes nowhere if the other partner is not on the dashboard. When the wa-bridge writes coach nudges to `coach_nudges` in `apps/wa-bridge/src/analysis/run.ts:128-135`, no one is notified — the user discovers them only when they next open the app and the `getCoachNudges` server function is called.

**User impact:** The platform's core value proposition — proactive relationship health intelligence — is invisible to users who are not actively using the app. AI-detected mood shifts (`source: 'ai_detected'` in `mood_states`) silently expire after 24 hours. Coaching tips generated from partner mood alerts (`apps/web/src/server/coaching.ts`) are never seen. Score drops of 10+ points (`detectNudgeTriggers` in `packages/ai/src/orchestrate.ts:39`) produce nudges that sit unread in the database.

**Business impact:** Without outbound notifications, retention depends entirely on users forming a habit of checking the dashboard daily. There is no re-engagement mechanism. The expensive AI analysis pipeline (Sonnet calls for analysis + extraction + coaching) produces intelligence that goes unconsumed.

## Goals & Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Notification delivery rate | >95% of triggered notifications reach the user's device | Track `notification_deliveries` table delivery status |
| Time-to-awareness for mood alerts | <5 minutes from partner mood set to notification received | Compare `mood_states.created_at` to `notification_deliveries.delivered_at` |
| Daily active return rate | 2x current within 30 days of launch | DAU/MAU ratio via auth session creation timestamps |
| Notification opt-in rate | >70% of active users enable push | `push_subscriptions` table count vs active users |
| Coach nudge engagement | >30% of nudge notifications result in coach session | Track nudge notification click -> coach thread creation within 10min |

## User Stories

**As a partner**, I want to receive a push notification when my partner sets their mood to "low" or "struggling" with visibility=alert, so that I can respond with empathy even when I'm not looking at the app.

**As a user**, I want to be notified when the AI detects a mood shift in my partner's messages, so that I'm aware of how they're feeling without having to check.

**As a couple**, we want to receive a notification when our relationship health score drops significantly, so that we can proactively address issues before they escalate.

**As a user**, I want to get a push notification when a new coach nudge is generated (conflict alert, score drop, milestone), so that I can start a coaching conversation at the right moment.

**As a user**, I want to receive a notification when my partner completes a shared goal, so that I can celebrate the achievement together.

**As a user**, I want to control which notifications I receive and how (push, email, or both), so that I'm not overwhelmed but don't miss critical alerts.

**As a new user**, I want to receive a notification when my partner accepts my connection request, so that I know to continue the onboarding flow.

**As a couple**, we want a weekly relationship digest email summarizing our health score trend, mood patterns, and coaching insights, so that we have a regular touchpoint with the platform even when we forget to check.

## Technical Design

### Architecture Overview

```
[Trigger Sources]                    [Notification Service]              [Delivery Channels]
                                     (new package)
wa-bridge: analysis complete    -->                                  --> Web Push (browser)
wa-bridge: mood detection       -->  packages/notifications/         --> Mobile Push (future: Expo)
web: mood set (alert)           -->    src/dispatch.ts               --> Email (Resend)
web: goal completed             -->    src/channels/web-push.ts
web: connection accepted        -->    src/channels/email.ts
cron: weekly digest             -->    src/templates/
                                     src/preferences.ts
```

The notification system is a **new monorepo package** (`packages/notifications`) that:
1. Receives notification requests from existing trigger points
2. Checks user preferences and deduplication rules
3. Dispatches to the appropriate channel(s)
4. Records delivery status for metrics

This package is consumed by both `apps/web` (for user-initiated triggers like mood alerts, goal completion) and `apps/wa-bridge` (for background triggers like analysis nudges, mood detection).

### Implementation Phases

#### Phase 1: Web Push Infrastructure + Mood Alerts (M)

The highest-impact, lowest-complexity starting point: browser push notifications for mood alerts, which are already the most urgent notification type.

**What to build:**

1. **Service Worker for push** — `apps/web/public/sw.js`
   - Register service worker in the app entry point
   - Handle `push` events, display notifications with the Notification API
   - Handle `notificationclick` to deep-link back into the app (e.g., `/dashboard` or `/chat`)

2. **Push subscription management** — `apps/web/src/server/push.ts`
   - `subscribePush` server function: receive PushSubscription from browser, store in DB
   - `unsubscribePush` server function: remove subscription
   - `getSubscriptionStatus` server function: check if current device is subscribed
   - Use the Web Push protocol (RFC 8030) via the `web-push` npm package

3. **Notification dispatch core** — `packages/notifications/src/dispatch.ts`
   - `sendNotification(userId, notification)` — main entry point
   - Looks up user's push subscriptions from DB
   - Sends via `web-push` library
   - Records delivery in `notification_deliveries` table
   - Handles expired/invalid subscriptions (HTTP 410 -> delete subscription)

4. **Wire mood alerts** — modify `apps/web/src/server/mood.ts`
   - After the existing `emitCoupleEvent()` call at line 44, add: `sendNotification(partnerId, { type: 'mood_alert', ... })`
   - The SSE path continues working for open tabs; push notification reaches closed tabs/other devices

5. **UI: Push opt-in prompt** — `apps/web/src/routes/_authenticated/-components/PushOptIn.tsx`
   - Shown on dashboard after first login (not during onboarding to avoid friction)
   - Requests `Notification.permission`, creates PushSubscription, posts to `subscribePush`
   - Respects browser permission state; shows re-prompt guidance if denied

**Key files to create:**
- `packages/notifications/src/dispatch.ts`
- `packages/notifications/src/channels/web-push.ts`
- `packages/notifications/package.json`
- `apps/web/public/sw.js`
- `apps/web/src/server/push.ts`
- `apps/web/src/routes/_authenticated/-components/PushOptIn.tsx`

**Key files to modify:**
- `apps/web/src/server/mood.ts` — add push dispatch after `emitCoupleEvent`
- `apps/web/src/routes/_authenticated/dashboard.tsx` — render PushOptIn component
- `apps/web/package.json` — add `web-push` dependency
- `packages/db/src/schema.ts` — add `push_subscriptions` and `notification_deliveries` tables

**Database changes:**
- `push_subscriptions` table (see Schema section below)
- `notification_deliveries` table (see Schema section below)

**Environment variables:**
- `VAPID_PUBLIC_KEY` — VAPID public key for web push
- `VAPID_PRIVATE_KEY` — VAPID private key for web push
- `VAPID_SUBJECT` — mailto: or URL for VAPID identification

#### Phase 2: All Notification Triggers + Preferences (M)

Wire every existing trigger point to the notification system and add user preference controls.

**What to build:**

1. **Notification preferences** — `packages/notifications/src/preferences.ts`
   - Per-user, per-notification-type enable/disable
   - Per-channel enable/disable (push, email)
   - Quiet hours (don't send push between 22:00-07:00 user local time)
   - Default: all enabled except weekly digest email

2. **Preferences UI** — `apps/web/src/routes/_authenticated/settings.tsx` (new route)
   - Toggle each notification type on/off
   - Set quiet hours
   - Manage push subscriptions (see all devices, remove old ones)

3. **Wire remaining triggers:**

   | Trigger | Source File | Integration Point |
   |---------|------------|-------------------|
   | Coach nudge created | `apps/wa-bridge/src/analysis/run.ts:128` | After `tx.insert(coachNudges)`, call `sendNotification` for both users |
   | AI mood detection | `apps/wa-bridge/src/analysis/trigger.ts:109` | After `db.insert(moodStates)`, notify partner if mood is low/struggling |
   | Analysis complete | `apps/wa-bridge/src/analysis/run.ts:170` | Notify both users with health score summary |
   | Goal completed | `apps/web/src/server/goals.ts` (completeGoal) | Notify partner when a goal is marked complete |
   | Connection accepted | `apps/web/src/server/connections.ts` (acceptConnectionRequest) | Notify the original requester |
   | Score milestone | `apps/wa-bridge/src/analysis/run.ts:128` | Already detected by `detectNudgeTriggers` — add `milestone` push |

4. **Deduplication** — `packages/notifications/src/dedup.ts`
   - Don't send duplicate notifications for the same event within a time window
   - Rate limiting: max 10 push notifications per user per hour
   - Coalesce: if 3 mood detections fire within 5 minutes, send one summary

5. **wa-bridge integration** — The bridge runs on Railway and shares the DB. The `packages/notifications` package can be imported directly since wa-bridge uses tsx and workspace packages export raw .ts.

**Key files to create:**
- `packages/notifications/src/preferences.ts`
- `packages/notifications/src/dedup.ts`
- `apps/web/src/server/notification-preferences.ts`
- `apps/web/src/routes/_authenticated/settings.tsx`
- `apps/web/src/routes/_authenticated/-components/NotificationSettings.tsx`

**Key files to modify:**
- `apps/wa-bridge/src/analysis/run.ts` — add notification dispatch after nudge insert and analysis complete
- `apps/wa-bridge/src/analysis/trigger.ts` — add notification after AI mood detection insert
- `apps/web/src/server/goals.ts` — add notification on goal complete
- `apps/web/src/server/connections.ts` — add notification on connection accepted
- `packages/db/src/schema.ts` — add `notification_preferences` table

#### Phase 3: Email Channel + Weekly Digest (M)

Add email as a second delivery channel, starting with transactional emails and the weekly relationship digest.

**What to build:**

1. **Email channel** — `packages/notifications/src/channels/email.ts`
   - Use Resend (or AWS SES) as the email provider
   - React Email templates for consistent design
   - Transactional emails: mood alert, score drop, connection request

2. **Weekly digest job** — `packages/notifications/src/digest.ts`
   - Aggregates the past 7 days: health score trend (from `health_score_history`), mood summary (from `mood_states`), top coaching insights (from `insights`), goal progress (from `couple_goals`)
   - Generates a personalized email per user
   - Triggered via Railway cron job or pg_cron

3. **Email templates** — `packages/notifications/src/templates/`
   - `mood-alert.tsx` — React Email template
   - `score-drop.tsx`
   - `weekly-digest.tsx`
   - `connection-accepted.tsx`

4. **Unsubscribe** — One-click unsubscribe link in every email (CAN-SPAM compliance)
   - Token-based unsubscribe endpoint: `GET /api/unsubscribe/:token`
   - Updates notification preferences in DB

**Key files to create:**
- `packages/notifications/src/channels/email.ts`
- `packages/notifications/src/digest.ts`
- `packages/notifications/src/templates/*.tsx`
- `apps/web/server/routes/api/unsubscribe/[token].ts`

**Environment variables:**
- `RESEND_API_KEY` — Email sending API key
- `APP_URL` — Base URL for deep links in emails (e.g., `https://app.amore.com`)

#### Phase 4: Mobile Push via PWA / Future Native (S)

Extend web push to work as a PWA on mobile, or prepare for native app push via Expo/FCM/APNs.

**What to build:**
- PWA manifest (`apps/web/public/manifest.json`) with push notification support
- Firebase Cloud Messaging (FCM) integration for Android PWA
- APNs integration for iOS Safari (requires different subscription flow)
- Device registration tracking in `push_subscriptions` table (already has `user_agent` field)

This phase is smaller because most infrastructure is built in Phases 1-3. The main work is testing across mobile browsers and handling platform-specific quirks (iOS Safari requires user gesture for permission, FCM needs a separate sender ID).

### Database Schema Changes

Add to `packages/db/src/schema.ts`:

```typescript
// ── Push Subscriptions ──────────────────────────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),       // PushSubscription.keys.p256dh
  auth: text('auth').notNull(),            // PushSubscription.keys.auth
  userAgent: text('user_agent'),           // for device identification
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),   // updated on each successful delivery
}, (table) => [
  index('push_subscriptions_user_idx').on(table.userId),
])

// ── Notification Preferences ────────────────────────────

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  // Per-type toggles (default all true)
  moodAlerts: boolean('mood_alerts').notNull().default(true),
  coachNudges: boolean('coach_nudges').notNull().default(true),
  scoreDrops: boolean('score_drops').notNull().default(true),
  milestones: boolean('milestones').notNull().default(true),
  goalUpdates: boolean('goal_updates').notNull().default(true),
  weeklyDigest: boolean('weekly_digest').notNull().default(false),
  // Per-channel toggles
  pushEnabled: boolean('push_enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  // Quiet hours (stored as HH:MM in user's local timezone)
  quietStart: varchar('quiet_start', { length: 5 }),  // e.g., "22:00"
  quietEnd: varchar('quiet_end', { length: 5 }),       // e.g., "07:00"
  timezone: varchar('timezone', { length: 50 }),       // e.g., "America/Sao_Paulo"
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Notification Deliveries (audit log) ─────────────────

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId: uuid('couple_id').references(() => couples.id),
  type: varchar('type', { length: 50 }).notNull(),     // 'mood_alert', 'coach_nudge', 'score_drop', etc.
  channel: varchar('channel', { length: 20 }).notNull(), // 'web_push', 'email'
  payload: jsonb('payload').notNull(),                   // notification content
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, delivered, failed, clicked
  sourceId: text('source_id'),                          // ID of the triggering record (mood_state.id, nudge.id, etc.)
  deliveredAt: timestamp('delivered_at'),
  clickedAt: timestamp('clicked_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('notification_deliveries_user_idx').on(table.userId),
  index('notification_deliveries_type_idx').on(table.type),
  index('notification_deliveries_created_idx').on(table.createdAt),
])
```

### API Endpoints

**New Server Functions** (`apps/web/src/server/push.ts`):

| Function | Method | Description |
|----------|--------|-------------|
| `subscribePush` | POST | Store browser PushSubscription (endpoint, keys) |
| `unsubscribePush` | POST | Remove push subscription by endpoint |
| `getSubscriptionStatus` | GET | Check if current browser is subscribed |

**New Server Functions** (`apps/web/src/server/notification-preferences.ts`):

| Function | Method | Description |
|----------|--------|-------------|
| `getNotificationPreferences` | GET | Get user's notification preferences (create defaults if none) |
| `updateNotificationPreferences` | POST | Update preferences |

**New Nitro Route:**

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/unsubscribe/:token` | GET | One-click email unsubscribe (token = signed userId + preference key) |

### Integration Points

**Existing trigger points that need modification:**

1. **`apps/web/src/server/mood.ts:44`** — `emitCoupleEvent` for mood alerts
   - Add: `sendNotification(partnerId, { type: 'mood_alert', ... })` after the SSE emit
   - The `partnerId` is available from `requireCouple()` (already computed at line 24)

2. **`apps/wa-bridge/src/analysis/run.ts:127-135`** — nudge insertion after analysis
   - Add: for each nudge, `sendNotification` to both `couple.userAId` and `couple.userBId`
   - The `couple` variable with both user IDs is already fetched at line 13-19

3. **`apps/wa-bridge/src/analysis/trigger.ts:109`** — AI mood detection insert
   - Add: if `result.mood` is `low` or `struggling`, notify the partner
   - Need to look up the partner ID from the `couples` table using `coupleId`

4. **`apps/web/src/lib/events.ts`** — in-memory EventEmitter
   - No change needed. SSE continues working for live sessions. Push notifications are additive.

5. **`apps/web/src/server/connections.ts`** — `acceptConnectionRequest`
   - Add: `sendNotification(request.fromUserId, { type: 'connection_accepted', ... })`

6. **`apps/web/src/server/goals.ts`** — `completeGoal`
   - Add: `sendNotification(partnerId, { type: 'goal_completed', ... })`

**Package dependency graph:**
```
packages/notifications
  ├── depends on: packages/db (for subscription/delivery/preferences tables)
  ├── depends on: web-push (npm, for VAPID + push protocol)
  ├── depends on: resend (npm, for email — Phase 3)
  └── consumed by: apps/web, apps/wa-bridge
```

Both `apps/web` and `apps/wa-bridge` already import workspace packages via `workspace:*` references. The wa-bridge uses tsx at runtime and workspace packages export raw .ts, so no build step is needed.

## Notification Types & Triggers

| Type | Trigger | Source | Urgency | Channels | Message Template |
|------|---------|--------|---------|----------|-----------------|
| `mood_alert` | Partner sets mood with `visibility: 'alert'` | `mood.ts:setMood` | High | Push, Email | "{partner} is feeling {mood}. {note}" |
| `mood_detection` | AI detects low/struggling mood shift | `trigger.ts:checkAndTriggerMoodDetection` | Medium | Push | "We noticed {partner} might be feeling {mood}. Check in?" |
| `score_drop` | Health score drops >10 points | `orchestrate.ts:detectNudgeTriggers` | High | Push, Email | "Your relationship health dropped {n} points to {score}" |
| `conflict_alert` | Conflict pattern detected in analysis | `orchestrate.ts:detectNudgeTriggers` | High | Push | "Tension detected in recent conversations. Want help?" |
| `milestone` | Health score crosses 80+ | `orchestrate.ts:detectNudgeTriggers` | Low | Push | "Your relationship health hit {score}! Keep it going" |
| `goal_completed` | Partner marks shared goal complete | `goals.ts:completeGoal` | Low | Push | "{partner} completed: {goal_title}" |
| `coaching_tip` | New coaching tips from mood alert | `coaching.ts:generateMoodCoachingTips` | Medium | Push | "New coaching insight: {first_tip_summary}" |
| `connection_accepted` | Partner accepts connection request | `connections.ts:acceptConnectionRequest` | Medium | Push, Email | "{partner} accepted your connection! Set up WhatsApp" |
| `weekly_digest` | Cron (Sunday 10:00 AM local) | `digest.ts` | Low | Email only | Weekly summary with score trend, moods, highlights |
| `analysis_complete` | First analysis finishes (onboarding) | `run.ts:runHistoricalAnalysis` | Medium | Push | "Your relationship analysis is ready! Health score: {score}" |

## Edge Cases & Risks

1. **Notification fatigue** — If the analysis pipeline runs frequently (every 50 messages for active couples), score_drop and conflict_alert nudges could pile up. Mitigation: deduplication with a 6-hour cooldown per notification type per couple. Rate limit to 10 push notifications per user per hour.

2. **Stale push subscriptions** — Browsers revoke push subscriptions silently. The web-push library returns HTTP 410 (Gone) for expired endpoints. Handle by deleting the subscription from `push_subscriptions` on 410 response.

3. **Both partners get notified of shared events** — For score_drop and conflict_alert, both partners should receive the notification. For mood_alert, only the non-alerting partner. The dispatch logic must know the notification's target audience.

4. **Quiet hours across timezones** — A couple in different timezones needs per-user quiet hours. Store timezone in `notification_preferences.timezone` and check against it before dispatching.

5. **wa-bridge has no HTTP server context** — The bridge runs background analysis; there is no session/request context. The `sendNotification` function must accept a bare `userId` (not depend on `requireCouple()`). This is why it lives in `packages/notifications` — a shared package with no web framework dependency.

6. **Service worker lifecycle** — Service workers can be evicted by the browser. The PushOptIn component should check `navigator.serviceWorker.ready` on each app load and re-register if needed.

7. **iOS Safari limitations** — Web Push on iOS requires the site to be added to Home Screen (PWA). Phase 4 addresses this. Phase 1 targets desktop browsers and Android Chrome.

8. **Email deliverability** — Using a new domain for transactional email requires SPF/DKIM/DMARC setup. Use Resend's managed sending domain initially, migrate to custom domain later.

9. **Partner mood privacy** — AI-detected moods (`source: 'ai_detected'`) are currently stored with `visibility: 'silent'`. The notification for these should be carefully worded to avoid revealing exact message content. Use the existing `result.reason` from `detectMoodShift` which is already a summarized, privacy-safe description.

10. **Duplicate notifications from SSE + Push** — If a user has the app open AND push enabled, they could get both an SSE event (updating the UI) and a push notification. Mitigation: the service worker should check `clients.matchAll()` — if an app window is focused, suppress the push notification display.

## Dependencies

**External services:**
- `web-push` npm package (VAPID key generation and push message encryption) — no external service needed, uses the standard Web Push protocol
- Resend (Phase 3) — email delivery service, free tier covers early usage
- VAPID keys — generate once with `web-push generate-vapid-keys`, store in Railway env vars

**Internal prerequisites:**
- None. All trigger points already exist in the codebase. This is purely additive.

**Infrastructure:**
- Railway cron service (Phase 3 weekly digest) — or implement as a Nitro server route triggered by external cron (Railway cron, pg_cron, or even a simple `setInterval` in the web server since it runs as a long-lived Node process)

## Estimated Scope

| Phase | Description | Size | Effort |
|-------|-------------|------|--------|
| Phase 1 | Web Push + Mood Alerts | M | ~3-4 days |
| Phase 2 | All Triggers + Preferences UI | M | ~3-4 days |
| Phase 3 | Email Channel + Weekly Digest | M | ~3-4 days |
| Phase 4 | Mobile PWA Push | S | ~2 days |
| **Total** | | | **~11-14 days** |

Phase 1 alone delivers the highest-impact notification (mood alerts to partner) and proves out the entire push infrastructure. It should ship first and independently.

## Acceptance Criteria

### Phase 1: Web Push Infrastructure + Mood Alerts

- [ ] **AC-1.1**: A service worker file exists at `apps/web/public/sw.js` that handles `push` and `notificationclick` events
- [ ] **AC-1.2**: When a user visits the dashboard for the first time, a push opt-in prompt component is rendered asking for notification permission
- [ ] **AC-1.3**: When a user grants notification permission, a `PushSubscription` is created and stored in the `push_subscriptions` database table with fields: `userId`, `endpoint`, `p256dh`, `auth`, `userAgent`
- [ ] **AC-1.4**: When Partner A sets their mood to "low" or "struggling" with `visibility: 'alert'`, Partner B receives a browser push notification within 30 seconds containing Partner A's name and mood level
- [ ] **AC-1.5**: When a push subscription returns HTTP 410 (Gone), it is automatically deleted from the `push_subscriptions` table
- [ ] **AC-1.6**: The `notification_deliveries` table records every push attempt with fields: `userId`, `type`, `channel`, `status` (pending/delivered/failed), `deliveredAt`, `failureReason`
- [ ] **AC-1.7**: If the user has the app tab focused when a push notification arrives, the service worker suppresses the notification display (no duplicate with SSE)
- [ ] **AC-1.8**: Clicking a mood alert push notification opens the app at `/dashboard`
- [ ] **AC-1.9**: Environment variables `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` are required; the app fails to start with a clear error if they are missing
- [ ] **AC-1.10**: The `packages/notifications` package exists in the monorepo, is listed in `pnpm-workspace.yaml`, and exports a `sendNotification(userId, notification)` function

### Phase 2: All Notification Triggers + Preferences

- [ ] **AC-2.1**: When a coach nudge (score_drop, conflict_alert, or milestone) is inserted by wa-bridge analysis, both partners receive a push notification within 60 seconds
- [ ] **AC-2.2**: When AI mood detection detects a mood of "low" or "struggling" with confidence >= 0.6, the partner receives a push notification
- [ ] **AC-2.3**: When Partner A completes a shared goal, Partner B receives a push notification containing the goal title
- [ ] **AC-2.4**: When a connection request is accepted, the original requester receives a push notification
- [ ] **AC-2.5**: When a user's first analysis completes (onboarding), they receive a push notification with their health score
- [ ] **AC-2.6**: A `/settings` route exists with a notification preferences UI where users can toggle on/off each notification type: mood alerts, coach nudges, score drops, milestones, goal updates, weekly digest
- [ ] **AC-2.7**: When a user disables "mood_alerts" in preferences and their partner sets mood to alert, NO push notification is sent to that user
- [ ] **AC-2.8**: Quiet hours are configurable per user (start time, end time, timezone). No push notifications are sent during quiet hours; they are silently dropped (not queued)
- [ ] **AC-2.9**: A deduplication mechanism prevents the same notification type from being sent to the same user more than once per 6-hour window (except mood_alert which has no cooldown)
- [ ] **AC-2.10**: No user receives more than 10 push notifications per hour. Excess notifications are dropped and logged in `notification_deliveries` with `status: 'rate_limited'`

### Phase 3: Email Channel + Weekly Digest

- [ ] **AC-3.1**: When a mood alert or score drop notification is triggered and the user has `emailEnabled: true`, an email is sent via Resend in addition to push
- [ ] **AC-3.2**: Every email contains a one-click unsubscribe link. Clicking it disables the specific notification type for that user without requiring login
- [ ] **AC-3.3**: The weekly digest email is sent every Sunday at 10:00 AM in the user's configured timezone
- [ ] **AC-3.4**: The weekly digest includes: health score trend (current vs 7 days ago), mood summary (count per level), top coaching insight, goal progress (completed/active count)
- [ ] **AC-3.5**: Users with `weeklyDigest: false` in preferences do NOT receive the digest email
- [ ] **AC-3.6**: Email templates render correctly in Gmail, Apple Mail, and Outlook (tested via Resend preview or Litmus)
- [ ] **AC-3.7**: The `RESEND_API_KEY` environment variable is required for email sending; if missing, email channel is silently disabled and push-only mode continues working

### Phase 4: Mobile PWA Push

- [ ] **AC-4.1**: A `manifest.json` exists at `apps/web/public/manifest.json` with required PWA fields (name, icons, start_url, display: standalone)
- [ ] **AC-4.2**: On Android Chrome, the user can install the app to home screen and receive push notifications when the browser is closed
- [ ] **AC-4.3**: On iOS Safari 16.4+, the user can add the app to home screen and receive push notifications (with the iOS-specific subscription flow)
- [ ] **AC-4.4**: The `push_subscriptions` table's `userAgent` field correctly identifies the device type (desktop/android/ios) for each subscription

## Open Questions

1. **Email provider choice** — Resend vs AWS SES vs Postmark? Resend has the best DX (React Email templates, simple API) but SES is cheaper at scale. Decision point: Phase 3.

2. **Should AI mood detections notify the partner?** — Currently `visibility: 'silent'`. Notifying the partner about an AI-inferred mood is more invasive than notifying about a manually-set mood. Options: (a) only notify if confidence > 0.8, (b) notify but frame as "check in on your partner" without revealing the detected mood, (c) don't notify partner — only notify the user themselves to confirm/dismiss. Needs product decision.

3. **Weekly digest: per-user or per-couple?** — Each partner gets a personalized view? Or one shared digest? Personalized is better (different tone, different action items based on their role in patterns) but 2x the email sends.

4. **Notification click deep-linking** — Should clicking a mood_alert notification go to `/dashboard` (see the mood badge) or `/chat` (start a conversation)? Should coach_nudge go directly to the coach sidebar? Need to define deep link targets per notification type.

5. **Push subscription key management** — VAPID keys must be consistent across deploys. Store in Railway env vars (not generated at runtime). Who generates the initial keypair?

6. **wa-bridge package dependency** — Adding `packages/notifications` as a dependency of `apps/wa-bridge` is straightforward (same pattern as `packages/ai`), but the `web-push` npm package will be pulled into the bridge's node_modules. This is fine (it's a small package) but worth noting — the bridge only needs the dispatch function, not the subscription management.

7. **Offline queue for wa-bridge notifications** — If the push endpoint is temporarily unreachable, should we retry? The `notification_deliveries` table with `status: 'pending'` enables a retry mechanism, but we need to decide: retry immediately (3 attempts with backoff, like `packages/ai/src/config.ts` `withRetry`), or batch-retry every 5 minutes via a sweep job?
