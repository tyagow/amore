# TICKET-003: Daily Engagement Hook — Habit Loop System

## Priority: P1 — High

## Problem Statement

The app has no daily ritual that brings users back. The MoodSelector (`apps/web/src/routes/_authenticated/-components/mood-selector.tsx`) exists but is entirely passive — it renders inline on the dashboard at line 206 of `apps/web/src/routes/_authenticated/dashboard.tsx` alongside other cards, with no temporal urgency or prompt. Users must remember to open the app, scroll to it, and manually engage. There is no morning insight, no evening check-in prompt, no weekly recap.

The platform generates rich intelligence — health scores (`health_score_history`), sentiment trends (`sentimentByDay` in `apps/web/src/server/dashboard.ts`), communication patterns (`insights` table with type `communication_pattern`), entity extractions (`couple_entities`), coach memory (`coach_memory`), and mood history (`mood_states`) — but none of it is surfaced proactively in a cadenced, habit-forming pattern. The `getCoachStarter` function in `apps/web/src/server/coach.ts` and `generateCoachStarter` in `packages/ai/src/coach-conversation.ts` generate one-off conversation starters, but these are buried in the CoachSidebar, not delivered as daily engagement touchpoints.

Successful consumer relationship apps (Paired, Lasting, Relish) and habit-forming apps (Duolingo, Headspace) use a trigger-action-reward loop: a time-based trigger surfaces a quick action (question, check-in), the user completes it in <30 seconds, and they receive an immediate micro-reward (insight, streak, partner comparison). Amore has the analytical backbone to generate compelling rewards but lacks the trigger and action layers.

The current event system (`apps/web/src/lib/events.ts`) is session-bound — `emitCoupleEvent()` only reaches connected browser tabs via in-memory EventEmitter. Even if daily content were generated, there is no delivery mechanism beyond "user happens to be on the dashboard." This ticket builds the content generation and in-app surfacing layer; push notification delivery (TICKET-001) is a parallel workstream that will integrate with the engagement hook outputs.

## Goals & Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily check-in completion rate | >40% of active couples complete at least one check-in per day within 30 days | Count rows in `daily_checkins` where both `completedAt IS NOT NULL` / total active couples per day |
| Dashboard return rate | 2x daily opens within 60 days | Count distinct `session` creation timestamps per user per day (Better Auth `sessions` table) |
| Time-to-first-action | <15 seconds from dashboard load to check-in tap | Client-side analytics: time from route `beforeLoad` to first check-in interaction |
| Streak retention (7-day) | >25% of users who start a streak reach 7 consecutive days | Query `engagement_streaks` table for `currentStreak >= 7` |
| Mood check-in uplift | 3x current daily mood submissions | Compare `mood_states` insertion rate per day before/after launch |
| Weekly recap open rate | >50% of users view the weekly recap when surfaced | Track `weekly_recap_viewed` events |

## User Stories

**As a user**, I want to see a personalized daily check-in card when I open the dashboard each morning, so I have a reason to open the app every day and a quick way to reflect on my relationship.

**As a user**, I want to answer a quick daily question (mood, gratitude, or relationship temperature) in under 30 seconds, so the daily habit feels lightweight, not burdensome.

**As a user**, I want to see an immediate micro-insight after completing my check-in (e.g., "You and your partner have both been feeling good this week" or "Your communication frequency is up 20% this month"), so I feel rewarded for checking in.

**As a user**, I want to see how my partner answered the same daily question (if they have), so I feel connected and motivated to keep the streak going.

**As a user**, I want to maintain a check-in streak with my partner and see our streak count, so we both feel invested in the daily ritual.

**As a couple**, we want a weekly relationship recap every Sunday summarizing our week (health score trend, mood patterns, highlights, coach insights), so we have a shared reflection point.

**As a user**, I want the daily question to vary and feel relevant to my relationship context (not generic), so the check-in never feels stale.

## Technical Design

### Architecture Overview

The system has three layers:

1. **Content Generation Layer** (`packages/ai/src/daily-engagement.ts`) — AI functions that generate daily questions, micro-insights, and weekly recaps using existing couple context (health score, sentiment trends, entities, mood history, coach memory).

2. **Scheduling & Storage Layer** (`apps/web/src/server/engagement.ts` + new DB tables) — Server functions that generate/cache daily content per couple, store check-in responses, manage streaks, and generate weekly recaps. Content is pre-generated at first dashboard load of the day (lazy generation, not cron).

3. **Presentation Layer** (`apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`, `weekly-recap-card.tsx`) — Dashboard cards that surface the daily check-in above other content and show the weekly recap.

### Implementation Phases

#### Phase 1: Daily Check-in Infrastructure + Basic Mood Check-in Card

Build the database schema, server functions, and a daily check-in card on the dashboard that replaces the current always-visible MoodSelector with a time-aware check-in prompt. The card shows at the top of the dashboard when the user hasn't completed today's check-in, and collapses to a "completed" state with a micro-insight afterward.

**Database tables:**
- `daily_checkins` — stores each day's check-in response per user per couple
- `engagement_streaks` — tracks current and longest streaks per user per couple

**Server functions (in `apps/web/src/server/engagement.ts`):**
- `getDailyCheckin()` — returns today's check-in status (completed or not), partner's status, streak info
- `submitDailyCheckin()` — records the check-in, updates streak, returns micro-insight
- `getStreakInfo()` — returns current streak count, longest streak, partner's streak

**Component: `daily-checkin-card.tsx`**
- Renders above all other dashboard cards when check-in is incomplete
- Quick mood selection (reuses the 5-level mood scale from existing `MoodSelector`)
- After submission: shows confirmation with streak count and partner's check-in status (if available)
- Collapsed state when already completed: shows streak badge and "Checked in today" indicator

**Dashboard integration:**
- Modify `apps/web/src/routes/_authenticated/dashboard.tsx` to load check-in status in the route loader (alongside existing `getIntelligence()` call)
- Render `DailyCheckinCard` above `CoupleHero` when check-in is pending
- The existing `MoodSelector` remains but moves below the fold — the daily check-in card becomes the primary mood entry point

#### Phase 2: AI-Generated Daily Questions + Micro-Insights

Replace the static mood-only check-in with rotating AI-generated daily questions and post-completion micro-insights. Questions are contextual — informed by recent sentiment trends, upcoming dates from `couple_entities`, active goals from `couple_goals`, and coach memory.

**AI functions (in `packages/ai/src/daily-engagement.ts`):**
- `generateDailyQuestion()` — takes couple context (health score, recent insights, entities, mood history, goals) and returns a question with type tag (`mood`, `gratitude`, `temperature`, `reflection`, `goal_progress`). Uses `claude-haiku-4-5-20251001` (fast model) for low latency and cost.
- `generateMicroInsight()` — takes the user's check-in response + couple context and returns a 1-2 sentence personalized insight. Uses Haiku.

**Question types and rotation:**
- `mood` — "How are you feeling about your relationship right now?" (same 5-level scale)
- `gratitude` — "What's one thing your partner did recently that you appreciated?" (free text, 280 char max)
- `temperature` — "Rate your connection with [partner name] today" (1-10 slider)
- `reflection` — Contextual question based on recent data (e.g., "Your health score improved 8 points this week. What do you think changed?")
- `goal_progress` — "How's progress on '[active goal title]'?" (on track / needs attention / stalled)

**Content caching:**
- Daily question is generated once per couple per day and stored in `daily_content` table
- Generated lazily on first `getDailyCheckin()` call of the day
- Micro-insight is generated on check-in submission (real-time, ~1-2s with Haiku)

**Partner comparison:**
- After both partners complete the day's check-in, each sees a comparison card: "You both rated your connection 8/10 today" or "You said grateful, [partner] said good — sounds like a solid day"
- Comparison only shown when both have answered; no spoilers before partner completes

#### Phase 3: Streaks, Weekly Recap, and SSE Integration

Build the streak system with visual rewards, the weekly relationship recap, and real-time updates via SSE so partner check-in completions appear instantly.

**Streak system:**
- Streak increments when user completes a check-in on consecutive calendar days (couple's timezone, defaulting to UTC)
- Streak milestones at 3, 7, 14, 30, 60, 100 days — each milestone triggers a coach nudge (`coach_nudges` table) with a celebratory message
- Streak resets if a day is missed; "freeze" mechanic deferred to future iteration
- Streak badge renders in `CoupleHero` component next to the health score ring
- Couple streak (both partners checked in on same day) tracked separately from individual streak

**Weekly recap:**
- Generated every Sunday (or on first Monday login if user missed Sunday)
- Content: health score trend (from `health_score_history`), mood pattern summary, message volume change, top insight of the week, active goal status, coach interaction count
- AI-generated 3-sentence narrative summary using `packages/ai/src/daily-engagement.ts:generateWeeklyRecap()`
- Stored in `weekly_recaps` table, surfaced as a dismissible card on dashboard
- Uses Sonnet model for richer narrative quality

**SSE integration:**
- Add `checkin_update` to `CoupleEventType` in `apps/web/src/lib/events.ts`
- When a user submits a check-in, `emitCoupleEvent()` fires so the partner's dashboard updates in real-time (if they're connected)
- `useDashboardEvents` hook in the client already handles couple events — extend it to refresh check-in state on `checkin_update`

### Database Schema Changes

Add to `packages/db/src/schema.ts`:

```typescript
// ── Daily Check-ins ────────────────────────────────────
export const dailyCheckins = pgTable('daily_checkins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  date: timestamp('date').notNull(), // truncated to day (midnight UTC)
  questionType: varchar('question_type', { length: 30 }).notNull(), // mood, gratitude, temperature, reflection, goal_progress
  questionText: text('question_text').notNull(),
  responseValue: varchar('response_value', { length: 30 }), // for scale responses (mood level, 1-10)
  responseText: text('response_text'), // for free-text responses (gratitude, reflection)
  microInsight: text('micro_insight'), // AI-generated insight shown after submission
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('daily_checkins_couple_idx').on(table.coupleId),
  index('daily_checkins_date_idx').on(table.date),
  uniqueIndex('daily_checkins_user_date_unique').on(table.coupleId, table.userId, table.date),
])

// ── Engagement Streaks ─────────────────────────────────
export const engagementStreaks = pgTable('engagement_streaks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastCheckinDate: timestamp('last_checkin_date'), // truncated to day
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('engagement_streaks_user_unique').on(table.coupleId, table.userId),
])

// ── Daily Content (cached AI-generated questions) ──────
export const dailyContent = pgTable('daily_content', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  questionType: varchar('question_type', { length: 30 }).notNull(),
  questionText: text('question_text').notNull(),
  context: jsonb('context'), // snapshot of data used to generate the question
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('daily_content_couple_date_unique').on(table.coupleId, table.date),
])

// ── Weekly Recaps ──────────────────────────────────────
export const weeklyRecaps = pgTable('weekly_recaps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  weekStart: timestamp('week_start').notNull(), // Monday 00:00 UTC
  weekEnd: timestamp('week_end').notNull(), // Sunday 23:59 UTC
  content: jsonb('content').notNull(), // { narrative, healthScoreTrend, moodSummary, topInsight, goalStatus, messageVolumeChange, coachInteractions }
  viewed: boolean('viewed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('weekly_recaps_couple_week_unique').on(table.coupleId, table.weekStart),
])
```

### API Endpoints

All as TanStack Start server functions in `apps/web/src/server/engagement.ts`:

| Function | Method | Input | Output | Description |
|----------|--------|-------|--------|-------------|
| `getDailyCheckin` | GET | — | `{ checkin: DailyCheckin \| null, partnerCheckin: { completed: boolean, responseValue?: string } \| null, streak: StreakInfo, question: DailyQuestion }` | Returns today's check-in state. Generates daily question on first call of the day (lazy). |
| `submitDailyCheckin` | POST | `{ questionType, responseValue?, responseText? }` | `{ checkin: DailyCheckin, microInsight: string, streak: StreakInfo, partnerCheckin?: PartnerSummary }` | Records check-in, generates micro-insight via AI, updates streak, emits SSE event. Also creates a `mood_states` row if `questionType === 'mood'` (preserves compatibility with existing mood system). |
| `getStreakInfo` | GET | — | `{ currentStreak, longestStreak, lastCheckinDate, coupleStreak: number }` | Returns streak data for current user + couple streak (consecutive days where both checked in). |
| `getWeeklyRecap` | GET | — | `{ recap: WeeklyRecap \| null, hasUnviewed: boolean }` | Returns latest weekly recap. Generates if it's Monday+ and no recap exists for the previous week. |
| `markRecapViewed` | POST | `{ recapId }` | `{ success: boolean }` | Marks weekly recap as viewed. |

### Integration Points

**Existing mood system (`apps/web/src/server/mood.ts`):**
When `submitDailyCheckin()` receives a `mood` type check-in, it calls `setMood()` internally (or directly inserts into `mood_states`) with `source: 'daily_checkin'` and `visibility: 'visible'`. This means the daily check-in mood flows into all existing mood-dependent features: `CoupleHero` mood badges, `PatternCards` mood overlays, `MoodDetectionModal` comparisons, and `getDashboardData()` aggregations.

**Existing coach system (`apps/web/src/server/coach.ts`, `packages/ai/src/coach-conversation.ts`):**
- Streak milestones (3, 7, 14, 30, 60, 100 days) insert rows into `coach_nudges` via the existing `detectNudgeTriggers` pattern in `packages/ai/src/orchestrate.ts`
- `generateCoachStarter()` in `packages/ai/src/coach-conversation.ts` should include daily check-in data in its context (e.g., "Your partner said they're grateful for your patience today — want to build on that?")
- Weekly recap data becomes available to `streamCoachResponse()` via the `CoachContext` interface

**Dashboard loader (`apps/web/src/routes/_authenticated/dashboard.tsx`):**
- Add `getDailyCheckin()` to the `Promise.all()` call on line 26-31
- Add `getWeeklyRecap()` to the same parallel fetch
- Pass results to new `DailyCheckinCard` and `WeeklyRecapCard` components

**SSE events (`apps/web/src/lib/events.ts`):**
- Add `'checkin_update'` and `'weekly_recap'` to the `CoupleEventType` union on line 6
- `submitDailyCheckin()` calls `emitCoupleEvent(coupleId, { type: 'checkin_update', data: { userId, questionType } })`
- Client `useDashboardEvents` hook triggers `router.invalidate()` on `checkin_update` — same pattern used by `mood_update` today

**Existing analysis pipeline (`packages/ai/src/orchestrate.ts`):**
- `detectNudgeTriggers()` already fires nudges for score drops and milestones — extend to include streak milestone nudges
- Weekly recap generation reuses `analyzeConversation` output format for consistency

## Acceptance Criteria

### Phase 1: Daily Check-in Infrastructure + Basic Mood Check-in Card

- [ ] AC-1.1: Table `daily_checkins` exists in `packages/db/src/schema.ts` with columns: `id`, `coupleId`, `userId`, `date`, `questionType`, `questionText`, `responseValue`, `responseText`, `microInsight`, `completedAt`, `createdAt`. A unique index exists on `(coupleId, userId, date)`.
- [ ] AC-1.2: Table `engagement_streaks` exists in `packages/db/src/schema.ts` with columns: `id`, `coupleId`, `userId`, `currentStreak`, `longestStreak`, `lastCheckinDate`, `updatedAt`. A unique index exists on `(coupleId, userId)`.
- [ ] AC-1.3: Server function `getDailyCheckin` in `apps/web/src/server/engagement.ts` returns an object containing `checkin` (today's check-in or null), `partnerCheckin` (partner's completion status), and `streak` (current and longest streak counts). It calls `requireCouple()` for auth.
- [ ] AC-1.4: Server function `submitDailyCheckin` in `apps/web/src/server/engagement.ts` inserts a row into `daily_checkins` with `completedAt` set to current time, updates the `engagement_streaks` row (incrementing `currentStreak` if last check-in was yesterday, resetting to 1 if gap > 1 day, updating `longestStreak` if current exceeds it), and returns the inserted check-in with streak info.
- [ ] AC-1.5: When `submitDailyCheckin` is called with `questionType: 'mood'`, a corresponding `mood_states` row is inserted with `source: 'daily_checkin'` and `visibility: 'visible'`.
- [ ] AC-1.6: Calling `submitDailyCheckin` twice on the same day for the same user and couple returns an error or is idempotent (does not create a duplicate row), enforced by the unique index.
- [ ] AC-1.7: Component `DailyCheckinCard` exists at `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`. When the user has not completed today's check-in, it renders a card with the 5-level mood selector and a submit button.
- [ ] AC-1.8: In `apps/web/src/routes/_authenticated/dashboard.tsx`, the `DailyCheckinCard` renders above `CoupleHero` when the check-in is incomplete. When the check-in is complete, it renders in a collapsed state showing the streak count.
- [ ] AC-1.9: The dashboard route loader (`Route` in `dashboard.tsx`) calls `getDailyCheckin()` in its `loader` function alongside the existing `getIntelligence()` call and passes the result to `CouplesDashboard`.
- [ ] AC-1.10: After submitting a check-in via the `DailyCheckinCard`, the card transitions to a "completed" state showing a confirmation message and the current streak count, without a full page reload (optimistic or invalidation-based update).

### Phase 2: AI-Generated Daily Questions + Micro-Insights

- [ ] AC-2.1: File `packages/ai/src/daily-engagement.ts` exports a `generateDailyQuestion` function that accepts couple context (health score, recent insights, entities, mood history, goals) and returns `{ questionType, questionText }`. It uses the `FAST_MODEL` (`claude-haiku-4-5-20251001`).
- [ ] AC-2.2: `generateDailyQuestion` produces five distinct question types: `mood`, `gratitude`, `temperature`, `reflection`, `goal_progress`. The question type is chosen based on rotation (not the same type two consecutive days for the same couple) and contextual relevance.
- [ ] AC-2.3: File `packages/ai/src/daily-engagement.ts` exports a `generateMicroInsight` function that accepts the user's check-in response + couple context and returns a string of 1-2 sentences. It uses `FAST_MODEL`.
- [ ] AC-2.4: Table `daily_content` exists in `packages/db/src/schema.ts` with a unique index on `(coupleId, date)`. `getDailyCheckin()` checks for an existing `daily_content` row before calling `generateDailyQuestion()`, and caches the result on first call.
- [ ] AC-2.5: `submitDailyCheckin()` calls `generateMicroInsight()` and stores the result in the `daily_checkins.microInsight` column. The micro-insight is returned to the client in the response payload.
- [ ] AC-2.6: The `DailyCheckinCard` renders the AI-generated question text from `daily_content` instead of a static "How are you feeling?" prompt. For `temperature` type, it renders a 1-10 slider. For `gratitude` and `reflection` types, it renders a text input (max 280 characters). For `mood` and `goal_progress` types, it renders the appropriate option selector.
- [ ] AC-2.7: After check-in submission, the card displays the micro-insight text. If the partner has also completed the check-in, a comparison summary is shown (e.g., both partners' mood levels or both gratitude responses).
- [ ] AC-2.8: The partner comparison is only shown after BOTH partners have completed the day's check-in. Before the partner completes theirs, the UI shows "Waiting for [partner name]..." with no spoilers about the partner's response.

### Phase 3: Streaks, Weekly Recap, and SSE Integration

- [ ] AC-3.1: `CoupleEventType` in `apps/web/src/lib/events.ts` includes `'checkin_update'`. When `submitDailyCheckin()` succeeds, it calls `emitCoupleEvent(coupleId, { type: 'checkin_update', data: { userId } })`.
- [ ] AC-3.2: The client-side dashboard re-fetches check-in data when a `checkin_update` SSE event is received (partner's check-in completion shows up without manual refresh).
- [ ] AC-3.3: Streak milestones at 3, 7, 14, 30, 60, and 100 days trigger insertion of a row in `coach_nudges` with `trigger: 'streak_milestone'` and an appropriate celebratory message.
- [ ] AC-3.4: The streak badge is visible in the `CoupleHero` component (`apps/web/src/routes/_authenticated/-components/couple-hero.tsx`) when `currentStreak >= 2`, displaying the streak count with a flame or equivalent visual indicator.
- [ ] AC-3.5: A couple streak is calculated as the number of consecutive days where BOTH partners completed a check-in. This is returned by `getStreakInfo()` as `coupleStreak`.
- [ ] AC-3.6: Table `weekly_recaps` exists in `packages/db/src/schema.ts` with columns: `id`, `coupleId`, `weekStart`, `weekEnd`, `content` (JSONB), `viewed`, `createdAt`. Unique index on `(coupleId, weekStart)`.
- [ ] AC-3.7: `packages/ai/src/daily-engagement.ts` exports a `generateWeeklyRecap` function that accepts weekly data (health score history, mood patterns, message stats, top insights, goal status) and returns a JSONB-compatible object with a `narrative` field (3-sentence AI summary) plus structured data. Uses `AI_MODEL` (Sonnet).
- [ ] AC-3.8: Server function `getWeeklyRecap` in `apps/web/src/server/engagement.ts` lazily generates the previous week's recap on first call after Sunday midnight (or Monday login). It queries `health_score_history`, `mood_states`, `insights`, `couple_goals`, and `messages` for the week window.
- [ ] AC-3.9: Component `WeeklyRecapCard` exists at `apps/web/src/routes/_authenticated/-components/weekly-recap-card.tsx`. It renders a dismissible card showing the narrative summary, health score trend (reusing the sparkline pattern from `SentimentSparkline` in `apps/web/src/routes/_authenticated/-components/sentiment-sparkline.tsx`), and key metrics.
- [ ] AC-3.10: After a user clicks "dismiss" or "mark as read" on the weekly recap card, `markRecapViewed()` is called and the card collapses or disappears on next render.

## Edge Cases & Risks

**Timezone handling:** Daily check-in "day" boundaries must be consistent. Phase 1 uses UTC truncation. If users in different timezones check in at "midnight" their local time, one might be on a different UTC day. Mitigation: use a single timezone per couple (configurable later, default UTC). Document this limitation.

**Single-user couples:** If only one partner is active, the partner comparison and couple streak features gracefully degrade — show "Invite [partner] to check in together" instead of comparison data. The individual streak still works.

**AI generation latency:** `generateDailyQuestion()` via Haiku should complete in <2 seconds. If it times out, fall back to a static question from a predefined pool (hardcoded in `daily-engagement.ts`). The `withRetry` wrapper from `packages/ai/src/config.ts` handles transient failures.

**Stale daily content:** If the `daily_content` row is generated at 00:01 UTC but the user opens the app at 23:59 UTC, the question is stale but still valid for that calendar day. No issue.

**Duplicate submissions:** The unique index on `(coupleId, userId, date)` in `daily_checkins` prevents duplicates at the DB level. The server function should catch the unique constraint violation and return the existing check-in.

**Streak reset fairness:** A missed day resets the streak to 0. Users may find this punishing. Phase 3 scope does not include "streak freeze" (e.g., one free miss per week) — this is deferred to a future iteration to keep scope tight.

**Weekly recap generation cost:** The recap uses Sonnet, which is ~10x the cost of Haiku. With one recap per couple per week, cost is negligible (estimated <$0.01/couple/week). The recap is generated lazily (on demand), not batch-processed.

**Existing MoodSelector coexistence:** The `MoodSelector` component at `apps/web/src/routes/_authenticated/-components/mood-selector.tsx` remains functional for ad-hoc mood logging outside the daily check-in cadence. The daily check-in card handles the primary mood entry; the standalone MoodSelector moves lower on the dashboard.

## Dependencies

- **No hard blockers.** This feature uses only existing infrastructure (Drizzle, TanStack server functions, SSE, Anthropic API).
- **TICKET-001 (Push Notifications)** is a soft dependency for out-of-app engagement triggers. Without push, the daily check-in only surfaces when the user opens the app. Push will add a morning notification linking to the check-in. The two can be built in parallel — this ticket produces the check-in content; TICKET-001 produces the delivery channel.
- **Schema migration** requires `pnpm db:push` after table additions. No data migration needed (new tables only).

## Estimated Scope

| Phase | Effort | Key Files |
|-------|--------|-----------|
| Phase 1 | 3-4 days | `packages/db/src/schema.ts`, `apps/web/src/server/engagement.ts`, `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`, `apps/web/src/routes/_authenticated/dashboard.tsx` |
| Phase 2 | 3-4 days | `packages/ai/src/daily-engagement.ts`, `apps/web/src/server/engagement.ts` (extend), `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx` (extend) |
| Phase 3 | 4-5 days | `apps/web/src/lib/events.ts`, `apps/web/src/routes/_authenticated/-components/couple-hero.tsx`, `apps/web/src/routes/_authenticated/-components/weekly-recap-card.tsx`, `packages/ai/src/daily-engagement.ts` (extend), `packages/ai/src/orchestrate.ts` |
| **Total** | **10-13 days** | |

## Open Questions

1. **Timezone strategy:** Should daily boundaries use UTC or attempt to detect the user's local timezone? UTC is simpler but means "morning" check-in prompts may not align with actual morning for all users. Recommendation: start with UTC, add timezone preference to user profile later.

2. **Question frequency calibration:** Should every couple get a new AI-generated question daily, or should there be a curated pool of ~50 questions that rotate, with AI-generated questions mixed in periodically? Pure AI generation costs ~$0.002/couple/day (Haiku); a pool approach costs nothing but feels less personalized.

3. **Streak visibility to partner:** Should each partner see the other's individual streak, or only the couple streak? Showing individual streaks could create pressure or guilt if one partner is less consistent.

4. **Weekly recap day:** Sunday evening or Monday morning? Sunday is more natural for reflection; Monday catches users who don't open the app on weekends. Recommendation: generate Sunday night, surface on next login (whether Sunday or Monday).

5. **Check-in window:** Is there a cutoff time after which a check-in no longer counts for the current day's streak? (e.g., checking in at 11:59 PM feels less meaningful than a morning check-in.) Recommendation: any time during the calendar day counts — simplicity over strictness.
