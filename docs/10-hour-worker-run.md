# 10-Hour Worker Run

Start UTC: 2026-05-05T00:43:30Z
Start local: 2026-05-04 21:43:30 -03
Target end UTC: 2026-05-05T10:43:30Z
Target end local: 2026-05-05 07:43:30 -03

## Objective

Keep the worker actively improving Amore Couples for at least 10 hours, focused on making the app genuinely useful for couples rather than only visually polished.

## Success Criteria

- The run lasts at least 10 hours from the start timestamp above.
- Work remains focused on features that help couples communicate, repair, check in, or act on relationship insights.
- Progress is tracked with real evidence: changed files, cmux browser state, screenshots, command output, and validation results.
- The app remains in a runnable state after each meaningful slice.
- Final completion is not claimed until the 10-hour target is reached and a completion audit proves the objective was satisfied.

## Current Surfaces

- Worker terminal: `surface:170`
- App browser: `surface:53`
- Workspace: `workspace:6`
- App URL: `http://localhost:9941/dashboard?upgraded=false`

## Current Product Direction

The app should become a daily relationship assistant. The main loop is:

1. Understand what is happening in the relationship.
2. Pick one useful move for today.
3. Help the user send a better message, start a repair, check in, or create a tiny goal.
4. Make the couple come back because the product helped them do something hard.

## Progress Log

### 2026-05-05T00:43:30Z

Baseline captured. Existing changes already added relationship-help affordances:

- Dashboard daily relationship move.
- Repair guide and draft handoff.
- Practice deck with appreciation, check-in, and repair starters.
- Chat starter buttons.
- Insight action to turn a health signal into a repair message.

Validation before this ledger:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 7 tests.
- `pnpm build`: passed with existing non-blocking `connections.ts` chunking warning.
- `cmux browser --surface surface:53 errors list`: no browser errors.

### 2026-05-05T00:48:00Z

Added guided goal templates on `/goals` so users do not start from a blank form.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/goals`
- Page shows `START TINY` and `Choose one couple practice for this week`.
- Templates shown:
  - `One appreciation message every day`
  - `One phone-free conversation this week`
  - `Repair tension within 24 hours`
- `cmux browser --surface surface:53 errors list`: no browser errors.

Validation:

- `pnpm check-types`: passed.

### 2026-05-05T00:53:00Z

Added coach-context handoff and a repeatable weekly relationship ritual.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`

User-visible behavior verified in cmux:

- Dashboard shows `WEEKLY RITUAL`.
- Dashboard shows `The 15-minute relationship reset`.
- Ritual agenda shows:
  - `Appreciate`
  - `Name the hard thing`
  - `Ask for one need`
  - `Make one promise`
- Dashboard shows `Invite Jaluza`.
- `cmux browser --surface surface:53 errors list`: no browser errors.

Validation:

- `pnpm check-types`: passed.

Implementation note:

- Dashboard coach actions now store a contextual `amore-coach-draft` before opening the coach.
- Coach sidebar consumes `amore-coach-draft` and pre-fills the coach input.

### 2026-05-05T00:58:00Z

Improved daily check-in from mood capture into mood-specific relationship guidance.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- Each mood maps to guidance:
  - `great`: share the good while fresh.
  - `good`: turn good into connection.
  - `neutral`: name neutral without drifting.
  - `low`: ask for care clearly.
  - `struggling`: make support easy to give.
- Each guidance card can draft a message into chat via `amore-chat-draft`.
- Existing checked-in state can invite the partner's check-in through chat.

Validation:

- `pnpm check-types`: passed.
- Dashboard reload in cmux: no browser errors.

### 2026-05-05T00:53:54Z

Added an action plan to the full insights overview so analytics lead directly into a couple-helping action.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/overview-tab.tsx`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- `/insights?tab=overview` now shows `TODAY'S ACTION PLAN`.
- With the current health score of `62`, it recommends `Have the 10-minute repair conversation`.
- The action plan offers three exits:
  - `Draft repair message` to seed chat.
  - `Make it a goal` to seed the goals add form.
  - `Ask coach to help` to open the coach with context.
- `/goals` now consumes `amore-goal-draft` and opens the add form with a one-week practice prefilled.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=overview`
- Page text included:
  - `TODAY'S ACTION PLAN`
  - `Have the 10-minute repair conversation`
  - `Your latest health score is 62`
  - `Draft repair message`
  - `Make it a goal`
  - `Ask coach to help`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:26:40Z

Turned the daily check-in into a concrete tonight plan.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- The daily check-in guidance and the submitted check-in support card now include `Make tonight plan`.
- The draft carries the user's mood, selected support need, one reciprocal offer, and an invitation to choose one easy thing.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 6 tests.
- `pnpm test`: passed, 19 files and 66 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/dashboard?verify=tonight-plan-20260505`.
- Submitted check-in card rendered `Make tonight plan`.
- Clicking it routed to `http://localhost:9941/chat`.
- The textarea was prefilled with `Can we make a tiny plan for tonight based on my check-in?`, included mood `low`, and included the selected warmth/reassurance support ask.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:23:40Z

Added an active-goal progress check-in.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Active goals now include `Check progress` between `Discuss in chat` and `Make easier`.
- The draft asks what has been easier, what is getting in the way, the smallest version that still counts today, and the next step before the due date.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 19 files and 65 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/goals?verify=goal-progress-20260505`.
- The active goal row rendered `Check progress`.
- Clicking it routed to `http://localhost:9941/chat`.
- The textarea was prefilled with `Quick goal check-in: One phone-free conversation this week` and prompts for what is easier, what is getting in the way, and the smallest version that still counts.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:20:10Z

Added a local `Soften` rewrite for rough chat drafts.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/soften-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/soften-draft.test.ts`

Behavior added:

- Chat now has a `Soften` action beside `Pause`, `Review`, and `Send`.
- It rewrites a rough draft into a safer soft start without requiring an AI call.
- It preserves the core concern while dropping the heated full message.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/soften-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 19 files and 64 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=soften-draft-20260505`.
- Filled chat with `You never listen to me. I am tired of repeating everything and feeling invisible.`
- Clicked `Soften`.
- The textarea became a safer start beginning `I want to say this in a way that keeps us on the same team` and named the concern as `I have been feeling unheard`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:02:20Z

Connected the weekly reset promise to an actual goal draft.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.test.ts`
- `apps/web/src/routes/_authenticated/dashboard.tsx`

Behavior added:

- The weekly reset now turns the promise note into a goal title when the user writes a concrete promise.
- The reset card shows `Make promise a goal` alongside `Send reset summary` and `Reset`.
- Clicking it routes to Goals and pre-fills a tiny weekly goal.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 18 files and 61 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled the weekly reset promise with `one phone-free dinner`.
- Clicked `Make promise a goal`.
- URL after navigation: `http://localhost:9941/goals`.
- Goals form values:
  - `#goalTitle`: `This week: one phone-free dinner`
  - `#goalDescription`: `A tiny relationship practice for this week.`
  - `#goalDueDate`: `2026-05-12`
- `cmux browser surface:53 errors list`: no browser errors.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 7 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

Constraint note:

- Used `cmux browser` only for browser verification. Did not use Playwright.

### 2026-05-05T00:55:44Z

Added regression coverage for insight copy so the app keeps translating analytics into readable relationship language.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insight-text.ts`
- `apps/web/src/routes/_authenticated/-components/insight-text.test.ts`
- `apps/web/src/routes/_authenticated/-components/insights-card.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/overview-tab.tsx`

Behavior protected:

- `avgResponseMinutes` renders as `Average response time`.
- `avgLengthBySender` renders as `Message depth by person`.
- `initiationBalance` renders as `Who starts conversations`.
- `messageCountBySender` renders as `Conversation share`.
- `acts_of_service` renders as `Acts of service (90% signal)`.
- Unknown structured keys are still humanized instead of leaked raw.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 11 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=overview`
- Page text still included `TODAY'S ACTION PLAN`.
- Page text included `Average response time`.
- Page text included `Acts of service (90% signal)`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T00:58:53Z

Mounted the relationship-aware AI sidebar on the chat page and fixed the sidebar copy so it gives usable partner context instead of leaking raw profile payloads.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/chat.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/hooks/use-chat-ai.ts`

Behavior added:

- Desktop `/chat` now shows the existing `AI Assistant` sidebar.
- The sidebar surfaces:
  - `Relationship Health`
  - persisted health score
  - partner love-language signals
  - partner interests
  - reply suggestions and live coaching when available
- Sidebar suggestions can be inserted into the message composer through `onUseSuggestion`.

Bug fixed during cmux verification:

- Partner interests were initially rendered as JSON payload strings.
- The formatter now handles both object values and JSON-encoded object strings, showing labels such as `Ciclismo / Bike`, `Corrida`, and `Alimentação saudável`.
- Love-language labels now render as `Acts of service`, `Quality time`, and similar readable labels.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 11 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat`
- Page text included `AI Assistant`.
- Page text included `Relationship Health`.
- Page text included `Acts of service`.
- Page text included `Ciclismo / Bike`, `Corrida`, and `Alimentação saudável`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:00:11Z

Made chat relationship context reachable on smaller screens.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/chat.tsx`

Behavior added:

- `/chat` now includes a mobile/tablet `AI relationship context` toggle below the chat header.
- Opening the toggle shows the same health, love-language, interest, coaching, and suggestion context that desktop users see in the right sidebar.
- Using a reply suggestion from the mobile panel inserts it into the message composer and closes the panel.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 11 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Desktop `/chat` still showed `AI Assistant`, `Relationship Health`, readable love languages, and readable partner interests.
- `cmux browser surface:53 errors list`: no browser errors.

Constraint note:

- cmux WKWebView did not support viewport resizing earlier in this run, so the mobile-specific layout was code/type/build verified and desktop-regression verified, but not viewport-resized in cmux.

### 2026-05-05T01:01:32Z

Added a regression guard for chat relationship-context formatting.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/relationship-context-format.ts`
- `apps/web/src/routes/_authenticated/-components/chat/relationship-context-format.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`

Behavior protected:

- `acts_of_service` renders as `Acts of service`.
- object interest payloads render their `topic`, `title`, `name`, or `label`.
- JSON-encoded interest strings render their readable topic instead of the raw JSON payload.
- invalid JSON and plain strings are preserved without crashing the sidebar.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 15 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat`
- Page text included `AI Assistant`.
- Page text included `Acts of service`.
- Page text included `Ciclismo / Bike`.
- Page text included `Alimentação saudável`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:03:26Z

Improved tiny goals so the user can invite their partner before creating a commitment.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Each tiny goal template now has:
  - `Create for this week`
  - `Invite partner first`
- `Invite partner first` seeds `amore-chat-draft` with a concrete partner invitation and routes to `/chat`.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 15 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/goals`
- Page text included three `Invite partner first` actions.
- Clicking the first invite routed to `http://localhost:9941/chat`.
- Reloading `/chat` showed the textarea prefilled with `I want us to try one tiny relationship practice this week...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:05:42Z

Made the weekly relationship reset interactive instead of static.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`

Behavior added:

- The dashboard weekly ritual now tracks progress across four steps:
  - `Appreciate`
  - `Name the hard thing`
  - `Ask for one need`
  - `Make one promise`
- Progress shows as `0 of 4 done`, `25%`, etc.
- Step completion is persisted in local storage under `amore-weekly-reset-progress`.
- A `Reset` action appears after progress starts.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 15 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?upgraded=false`
- Page text included `0 of 4 done` and `0%`.
- Clicking the first ritual step changed the progress to `1 of 4 done` and `25%`.
- `Reset` returned progress to `0 of 4 done`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:07:59Z

Improved daily check-ins so low/struggling states can become clear support requests.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- After selecting a mood, the check-in card asks `What would help your partner support you?`
- Support chips:
  - `Just listen`
  - `Warmth`
  - `Practical help`
  - `A little space`
  - `Check later`
- Selecting a chip pre-fills the check-in answer with a clear support request.
- `Draft this message` now includes the selected support need in the chat draft.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 15 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?upgraded=false`
- Clicking `Low` showed `Ask for care clearly`.
- Page text included `What would help your partner support you?`
- Page text included all five support chips.
- Clicking `Just listen` prefilled the check-in textarea with `I could use listening, not fixing.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:09:44Z

Added a regression guard for daily check-in support-message copy.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior protected:

- All support chips stay concrete and sendable.
- `low` + `listen` drafts include both the mood and the explicit listening request.
- `struggling` can still draft a message without selecting a support chip.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 18 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?upgraded=false`
- Page text still included `What would help your partner support you?`
- Page text still included `Just listen`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:11:07Z

Added accountability-oriented chat starters for hard conversations.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Empty chat composer now offers two additional starters:
  - `Need`: `One thing I need this week is ____...`
  - `Own my part`: `I have been thinking about my part in this...`
- These starters make it easier to begin hard conversations with a clear need or accountability instead of blame.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 18 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat`
- Page text included `Appreciate`, `Check in`, `Repair`, `Need`, and `Own my part`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:14:42Z

Improved active goals so a created commitment can become a partner conversation.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/goal-draft.ts`
- `apps/web/src/routes/_authenticated/goal-draft.test.ts`

Behavior added:

- Active goals now show `Discuss in chat`.
- The discussion action seeds `amore-chat-draft` with:
  - the goal title
  - the goal description when present
  - one concrete question about what would make the goal easier this week
  - the due date when present
- Due-date formatting now treats `YYYY-MM-DD` as a local calendar date so a date input does not shift one day in local time.

Validation:

- Initial test run caught the date-shift bug: expected `May 12`, got `May 11`.
- Fixed date formatting in `goal-draft.ts`.
- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 19 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/goals?verify=1`
- Created `One appreciation message every day` from the tiny-goal template to verify the active-goal surface.
- Active goal showed `Discuss in chat`.
- Clicking `Discuss in chat` routed to `/chat`.
- Navigating to `http://localhost:9941/chat?goal-discuss=1` showed the textarea prefilled with `I want us to stay connected around this goal: One appreciation message every day...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:16:31Z

Added deterministic coach quick prompts so the coach is useful immediately, even before AI-generated starters load.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`

Behavior added:

- Coach sidebar now shows `Start with a hard thing` quick prompts:
  - `Prepare repair`
  - `Ask a better question`
  - `Choose one goal`
  - `Own my part`
- Clicking a quick prompt fills the coach input and focuses it.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 19 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?upgraded=false`
- Opened the coach with the `Coach` button.
- Sidebar showed `Prepare repair`, `Ask a better question`, `Choose one goal`, and `Own my part`.
- Clicking `Prepare repair` filled the coach textarea with `Help me prepare a calm repair conversation...`.
- `cmux browser surface:53 errors list`: no browser errors.

## Next Work Queue

- Add better in-place actions on individual wishes, dates, and interests.
- Add a stronger partner-facing completion loop after rituals are done.
- Re-check the full app surface after the accumulated changes and clean any rough edges found in live use.
- Verify every slice with `pnpm check-types` and the logged-in cmux browser before moving on.

### 2026-05-05T01:20:43Z

Turned coaching insights into direct action starters.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/coaching-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/coaching-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/coaching-actions.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`

Behavior added:

- Goal suggestions in the Coaching tab now offer `Discuss with partner`, which opens chat with a concrete conversation draft.
- Goal suggestions also offer `Make it a goal`, which opens the goals page with the suggested title prefilled.
- Conflict alerts now offer `Draft softer repair`, which opens chat with a repair-message draft.
- Moved the goal draft helper/test behind the route ignore prefix so TanStack route discovery no longer warns about non-route files.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 7 files and 21 tests.
- `pnpm build`: passed. The earlier route-file warnings for `goal-draft.ts` and `goal-draft.test.ts` are gone; the existing non-blocking `connections.ts` dynamic/static import chunking warning remains.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=coaching&verify=coaching-actions-20260505`
- Coaching tab rendered active tips and a `Goal Suggestions` section with `Discuss with partner` and `Make it a goal`.
- Clicking `Discuss with partner` routed to `/chat`.
- Chat textarea was prefilled with `I saw a relationship goal that could help us: Strengthen your communication...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:23:01Z

Turned communication analytics into an immediate conversation move.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/communication-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/communication-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/communication-actions.test.ts`

Behavior added:

- Communication tab now starts with a `Conversation move` card instead of only showing charts.
- The card detects whether the user, the partner, or both are carrying the message rhythm.
- The card detects the strongest recurring conversation window from hourly activity.
- `Open in chat` seeds `amore-chat-draft` with a partner-ready conversation prompt.
- `Make it a goal` seeds `amore-goal-draft` with a small intentional-conversation goal.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 8 files and 25 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=communication&verify=communication-actions-20260505`
- Communication tab rendered `Your message rhythm looks balanced.`, `Open in chat`, `Make it a goal`, `Message Balance`, `Daily Message Volume`, `Active Hours`, and `Message Length`.
- Clicking `Open in chat` routed to chat.
- Chat textarea was prefilled with `I like that our conversation rhythm looks pretty balanced right now...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:25:51Z

Turned emotional patterns into a gentle repair/support action.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/emotions-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/emotion-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/emotion-actions.test.ts`

Behavior added:

- Emotions tab now starts with an `Emotional reset` move instead of only charts.
- The move prioritizes a negative sentiment day when present.
- If sentiment is steady, it falls back to a recent low or struggling mood.
- If neither is present, it reinforces what is working with an appreciation prompt.
- `Open in chat` seeds `amore-chat-draft` with a support or repair prompt.
- `Make it a goal` seeds `amore-goal-draft` with a gentle emotional reset goal.

Validation:

- Initial `pnpm --filter @amore-couples/web test` caught a date-only timezone shift: expected `May 2`, got `May 1`.
- Fixed date-only formatting in `emotion-actions.ts`.
- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 9 files and 28 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=emotions&verify=emotion-actions-20260505`
- Emotions tab rendered `A low mood needs a gentle follow-up.`, `Open in chat`, `Make it a goal`, `Sentiment Trend`, `Mood Timeline`, `Best & Worst Days`, and `Emotional Balance`.
- Clicking `Open in chat` routed to chat.
- Chat textarea was prefilled with `I saw there has been a lower mood lately...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:28:32Z

Turned relationship discoveries into a visible partner action.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/discoveries-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.test.ts`

Behavior added:

- Discoveries tab now starts with a `Discovery move` card.
- The move prioritizes active wishes, then important dates, then shared interests, then partner-only interests.
- `Open in chat` seeds `amore-chat-draft` with a concrete partner prompt.
- `Make it a goal` seeds `amore-goal-draft` with a small action from the discovery.
- Shared interests now normalize string, JSON-string, array, and object-shaped profile data instead of assuming every interest is a plain string.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 10 files and 32 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=discoveries&verify=discovery-actions-20260505`
- Discoveries tab rendered `DISCOVERY MOVE`, `There is a wish you can turn into care.`, `Open in chat`, `Make it a goal`, `Love Languages`, `Shared Interests`, and `Wishlist`.
- Live shared interests rendered clean labels such as `Ciclismo / Bike`, `Corrida`, and `Alimentacao saudavel` instead of raw JSON.
- Clicking `Open in chat` routed to chat.
- Chat textarea was prefilled with `I noticed this wish matters: Segundo sinal de internet instalado como backup...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:32:00Z

Kept daily check-in support needs alive after submission.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- The collapsed checked-in state now infers a selected support need from the saved answer.
- When a support need is present, the card shows `Today support ask`.
- The support ask includes `Tell partner`, which opens chat with a clear support request.
- The support ask includes `Ask coach`, which opens the coach with a prompt about asking clearly and kindly.
- This gives the daily check-in an actual follow-up loop instead of ending after mood submission.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 10 files and 34 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?verify=support-followup-20260505`
- Selected `Low`, selected `Warmth`, and submitted the daily check-in with `I could use warmth and reassurance.`
- Dashboard rendered `Tell partner` and `Ask coach` in the checked-in state.
- Clicking `Tell partner` routed to chat.
- Chat textarea was prefilled with `I checked in today, and I want to make it easy to support me...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:34:29Z

Closed the goal loop with celebration and learning.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`

Behavior added:

- Completing a goal now shows a `Goal completed` banner instead of silently moving it out of Active Goals.
- The banner includes `Celebrate in chat`.
- Completed goals also expose `Celebrate in chat` when the completed list is expanded.
- The celebration draft asks the couple to name what worked, what felt hard, and whether to repeat a smaller version next week.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 10 files and 35 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/goals?verify=goal-celebration-20260505`
- Completed the live active goal `One appreciation message every day`.
- Goals page rendered `GOAL COMPLETED`, `Celebrate what worked before moving on`, and `Celebrate in chat`.
- Active Goals became empty and `Completed (1)` appeared.
- Clicking `Celebrate in chat` routed to chat.
- Chat textarea was prefilled with `I am glad we completed this together: One appreciation message every day...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:38:22Z

Made individual discoveries immediately actionable and fixed a live hydration mismatch.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/discoveries-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.test.ts`

Behavior added:

- Shared interest chips now open chat with a small invitation to do that interest together.
- Wishlist rows now include `Plan in chat`.
- Important date rows now include `Plan in chat`.
- The goal completion banner no longer renders literal backticks around completed goal names.
- Date-only discovery values are parsed in local time, and invalid date values now fall back to the original text instead of rendering `Invalid Date`.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 10 files and 36 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=discoveries&verify=individual-discovery-actions-20260505`
- Discoveries rendered shared interest links and many `Plan in chat` links for wishlist and important-date rows.
- Clicking a discovery action routed to chat.
- Chat textarea was prefilled with `I noticed this wish matters: Segundo sinal de internet instalado como backup...`.
- The live browser initially surfaced a hydration error caused by `Invalid Date`; after the date parsing fix, `cmux browser surface:53 errors clear`, and reload, `cmux browser surface:53 errors list` reported no browser errors.

### 2026-05-05T01:40:58Z

Made the discoveries tab usable when the app has a large memory set.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/discoveries-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.test.ts`

Behavior added:

- Wishlist and important-date sections now show the first 6 rows by default, with explicit `Show more` controls for the rest.
- JSON-shaped entity content now renders readable labels using `item`, `description`, `text`, `name`, `title`, or date fields instead of leaking raw object text.
- Individual row chat drafts still work after the list cap.
- Shared helper coverage now includes JSON entity text and speaker extraction.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 10 files and 37 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/insights?tab=discoveries&verify=discovery-list-cap-20260505`
- Discoveries tab rendered 6 wishlist rows, `Show 149 more wishes`, 6 important-date rows, and `Show 84 more dates`.
- The visible wishlist rows rendered readable item text such as `Segundo sinal de internet instalado como backup` and `Vitamina C e NAC (suplemento)`.
- Clicking the first wishlist `Plan in chat` routed to `/chat`.
- Chat textarea was prefilled with `I noticed this wish matters: Segundo sinal de internet instalado como backup...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:43:11Z

Added a structured repair-message builder to chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/repair-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/repair-draft.test.ts`

Behavior added:

- Chat now has a `Repair guide` control beside the quick starters.
- The guide asks for four concrete pieces: what I felt, what I can own, what I need, and what I am asking for.
- `Build repair` turns those notes into a message that leads with repair, not winning, and includes ownership before the request.
- Blank fields fall back to safe, non-accusatory wording.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 11 files and 39 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat?verify=repair-builder-20260505`
- Chat rendered the `Repair guide` button.
- Opening the guide rendered inputs for `What I felt...`, `What I can own...`, `What I need...`, and `Could we...`.
- Filling the fields and clicking `Build repair` populated the chat textarea with `I want to repair this, not win it...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:45:21Z

Turned the weekly reset into a note-taking ritual that can be shared.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.test.ts`

Behavior added:

- Each weekly reset step now has a note field.
- Notes are persisted in localStorage alongside step completion.
- `Send reset summary` drafts a partner message from the four answers.
- Blank answers remain collaborative instead of producing empty sections.
- `Reset` clears both checked steps and notes.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 12 files and 41 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?verify=weekly-reset-notes-20260505`
- Dashboard rendered four weekly-reset note fields under the ritual steps.
- Filled appreciation, hard thing, need, and promise notes.
- Clicking `Send reset summary` routed to `/chat`.
- Chat textarea was prefilled with `Hey Jaluza, I filled out a simple weekly reset for us...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:50:22Z

Made profile context actionable and fixed a live profile crash.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/profile.tsx`
- `apps/web/src/routes/_authenticated/-components/profile-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/profile-action-draft.test.ts`

Behavior added:

- Partner love language now has `Plan care in chat`.
- Partner communication style now has `Ask what helps`.
- Partner interests are clickable chat starters.
- Profile interest values now tolerate stored shapes including `{ items }`, arrays, strings, object maps, object records, and JSON strings.
- Profile interest chips now render readable topic labels instead of raw JSON.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 13 files and 45 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Initial live profile reload failed with `undefined is not an object (evaluating 'interests.items.length')`; fixed by normalizing interest shapes.
- URL: `http://localhost:9941/profile?verify=profile-interest-labels-20260505`
- Profile rendered without crashing.
- Interest labels rendered as `Ciclismo / Bike`, `Corrida`, `Alimentação saudável`, and similar readable labels instead of JSON.
- Clicking partner interest `Ciclismo / Bike` routed to `/chat`.
- Chat textarea was prefilled with `I noticed Ciclismo / Bike matters to Jaluza...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:52:15Z

Tightened the profile page against empty profile facts.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/profile.tsx`

Behavior added:

- Empty love-language objects now render as `No love language data yet` / `Not set yet` instead of `Primary:` with a blank value.
- Empty communication-style objects now render as `No communication style data yet` / `Not set yet`.
- Chat action links are hidden when the profile fact they need is missing.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test`: passed, 13 files and 45 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after nav click: `http://localhost:9941/profile`
- Profile showed `No love language data yet`, `No communication style data yet`, and partner-side `Not set yet` for empty facts.
- Partner interest links still rendered with readable labels.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:54:30Z

Made active goals actionable from the dashboard card.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

Behavior added:

- Active goals on the dashboard now include a `Discuss` action.
- The action opens chat with a goal-specific draft using the same discussion helper as the full goals page.
- Goal due dates on the dashboard now parse date-only values in local time and ignore invalid dates instead of rendering unstable date output.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 13 files and 45 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Created the legitimate built-in goal `One phone-free conversation this week` from `/goals`.
- Navigated back to the dashboard.
- Dashboard goals card rendered the goal and the new `Discuss` action.
- Clicking `Discuss` routed to `/chat`.
- Chat textarea was prefilled with `I want us to stay connected around this goal: One phone-free conversation this week...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T01:56:20Z

Generalized dashboard insight actions beyond health score.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights-card.tsx`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- Health score and conflict alerts still draft repair messages.
- Communication-pattern insights now show `Discuss this pattern`.
- Love-language insights now show `Act on this`.
- Coaching tips can become a chat conversation.
- Goal suggestions can open the goals page with a prefilled goal draft.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 14 files and 48 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Dashboard insights card rendered `Turn into a repair message`, multiple `Discuss this pattern` actions, and `Act on this`.
- Clicking the first `Discuss this pattern` action routed to `/chat`.
- Chat textarea was prefilled with `I noticed a communication pattern we could talk about: Average response time...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:03:00Z

Tightened dashboard goal metadata so the next action reads cleanly.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

Behavior added:

- The dashboard goal card groups the AI badge, due date, and discussion action with stable spacing.
- Date-only due dates continue to render in local time.
- The empty-goal state now nudges couples toward one small promise they can actually keep this week.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 14 files and 48 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/dashboard?verify=goal-spacing-20260505&upgraded=false`
- Dashboard goal card rendered `Due May 11` and `Discuss` as separate readable lines for `One phone-free conversation this week`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:11:30Z

Added a dashboard daily care plan that turns relationship signals into one concrete partner action.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-care-plan.ts`
- `apps/web/src/routes/_authenticated/-components/daily-care-plan.test.ts`

Behavior added:

- The dashboard now shows a `Care plan` card after the primary relationship move.
- The plan prioritizes hard partner moods, then low health score repair, then love-language action, then partner interests, then a generic tiny promise.
- Each plan includes three steps plus actions to draft a message, make the plan a goal, or ask the coach.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-care-plan.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 15 files and 52 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/dashboard?verify=daily-care-plan-20260505`
- Dashboard rendered `CARE PLAN`, `Repair first, then reconnect`, and the three-step repair plan.
- Clicking `Draft message` routed to `/chat`.
- Chat textarea was prefilled with `Hey Jaluza, I want to repair something gently...`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:18:15Z

Added a chat pause rewrite to prevent reactive messages from escalating.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/pause-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/pause-draft.test.ts`

Behavior added:

- When a user has typed a draft, the chat input now offers a `Pause` action.
- `Pause` rewrites the current draft into a 20-minute pause request while preserving the core issue.
- Long drafts are trimmed so the pause message stays readable and sendable.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/pause-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 16 files and 55 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled chat with `You never listen and I am tired of repeating myself. This always becomes my problem.`
- Clicked the `Pause` action.
- Chat textarea became `I am feeling activated and I do not want to say this badly... Can we pause for 20 minutes...`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:25:20Z

Added a no-guilt recovery path for active goals.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`

Behavior added:

- Active goals now include a `Make easier` action next to `Discuss in chat`.
- The action drafts a renegotiation message that keeps the goal collaborative instead of turning it into pressure or guilt.
- The draft asks the couple to shrink the commitment into something realistic for the current week.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 16 files and 56 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Goals page rendered `Make easier` for `One phone-free conversation this week`.
- Clicking `Make easier` routed to `/chat`.
- Chat textarea was prefilled with `I do not want this goal to become pressure or guilt... Could we make it smaller...`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:33:40Z

Made quick mood sharing actionable with support requests.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/mood-selector.tsx`

Behavior added:

- Quick mood now shows support chips when the user chooses a shared visibility.
- Choosing a support need fills the mood note with a clear request.
- The user can draft a support message in chat directly from the quick mood flow.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 16 files and 56 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened quick mood on the dashboard.
- Selected `Low`, then `Visible`.
- Support chips appeared: `Just listen`, `Warmth`, `Practical help`, `A little space`, `Check later`.
- Clicking `Warmth` filled the note with `I could use warmth and reassurance.`
- Clicking `Draft support message` routed to `/chat`.
- Chat textarea was prefilled with `I am feeling low today... What would help: I would really appreciate some warmth and reassurance from you.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:41:40Z

Turned passive chat-sidebar profile signals into one-click connection actions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/chat.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`

Behavior added:

- The chat sidebar love-language card now has `Plan care in chat`.
- Partner interest chips are now buttons that draft curiosity messages.
- Both actions reuse the same profile action draft helpers already covered by tests.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 16 files and 56 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=sidebar-profile-actions-20260505`
- Sidebar rendered `Plan care in chat` and clickable partner interests.
- Clicking `Plan care in chat` filled the chat textarea with `I noticed Jaluza's love language is Acts of service...`
- Clicking `Ciclismo / Bike` filled the chat textarea with `I noticed Ciclismo / Bike matters to Jaluza...`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:48:45Z

Made the chat-sidebar health score actionable.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`

Behavior added:

- The relationship health score card now offers an action instead of only showing a number.
- Low scores show `Draft repair check-in`.
- Stronger scores show a maintenance-oriented care check-in draft.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 17 files and 58 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=health-score-action-20260505`
- Sidebar rendered `Draft repair check-in` under `Relationship Health`.
- Clicking it filled chat with `Hey Jaluza, I want to slow down and repair instead of letting distance build...`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:56:10Z

Added a structured need-request guide to chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/need-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/need-draft.test.ts`

Behavior added:

- Chat starters now include `Need guide`.
- The guide collects what the user needs, why it matters, the request, and flexibility.
- It builds a clear ask that starts with `I want to ask for something clearly, not criticize you.`

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/need-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 18 files and 60 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=need-guide-20260505`
- Opened `Need guide`.
- Filled the fields with `more predictable time together`, `I relax when I know we have space for us`, `could we pick one evening before the week starts?`, and `I am flexible on the day`.
- Clicking `Build need` filled chat with a clear non-blaming need request.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:28:45Z

Added a guided appreciation builder to chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/appreciation-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/appreciation-draft.test.ts`

Behavior added:

- Empty chat now includes `Appreciation guide`.
- The guide asks what the user noticed, what it showed, how it landed, and what tiny continuation they want.
- It builds a specific appreciation instead of a generic thank-you.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/appreciation-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 20 files and 68 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=appreciation-guide-20260505`.
- Opened `Appreciation guide`.
- Filled fields with `you checked on me before your meeting`, `it showed me I matter to you`, `I felt calmer and less alone`, and `could we keep doing a small check-in on busy days?`.
- Clicking `Build appreciation` filled chat with a specific appreciation draft that included all four pieces.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:32:10Z

Added a dashboard question-of-the-day card.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-connection-question.ts`
- `apps/web/src/routes/_authenticated/-components/daily-connection-question.test.ts`

Behavior added:

- Dashboard now shows `QUESTION OF THE DAY` between the daily care plan and the practice deck.
- The question adapts to harder partner moods, low relationship score, partner interests, or a generic positive-connection fallback.
- It offers `Ask in chat`, `Make a goal`, and `Ask coach` exits.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-connection-question.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 21 files and 71 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/dashboard?verify=question-of-day-20260505`.
- Dashboard rendered `QUESTION OF THE DAY`, `Use one question to lower defensiveness`, and the question `What is one thing you wish I understood better about this week?`.
- Clicking `Ask in chat` routed to `http://localhost:9941/chat`.
- The textarea was prefilled with `Hey Jaluza, I want to understand before I try to fix anything... I will try to listen without defending myself first.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:35:00Z

Fixed date-only goal due dates drifting one day early.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior fixed:

- Goal due dates now use the shared `formatGoalDueDate` helper in the Goals page.
- The helper treats both `YYYY-MM-DD` strings and returned `Date` objects as date-only values so UTC midnight does not display as the prior local day.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 5 tests.
- `pnpm test`: passed, 21 files and 72 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/goals?verify=goal-date-drift-fixed-20260505`.
- Before the completed fix, the active goal displayed `Due May 11`.
- After the completed fix, the same active goal displayed `Due May 12`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:39:10Z

Added a structured apology guide to chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/apology-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/apology-draft.test.ts`

Behavior added:

- Empty chat now includes `Apology guide`.
- The guide captures what happened, the impact the user can see, what they own, and the repair ask.
- It builds a non-defensive apology that does not ask the partner to manage the user's feelings.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/apology-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 22 files and 74 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=apology-guide-20260505`.
- Opened `Apology guide`.
- Filled fields with `I dismissed your concern too quickly`, `it probably made you feel alone with it`, `I got defensive instead of listening first`, and `could I listen again and summarize what I missed?`.
- Clicking `Build apology` filled chat with a clear apology draft that included what happened, visible impact, ownership, and a repair ask.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:33:54Z

Verified coach quick prompts for harder couple conversations.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`

Behavior added:

- Coach quick prompts now include `Plan apology` and `Build appreciation`.
- `Plan apology` gives the coach enough structure to help the user name what happened, visible impact, ownership, and one repair ask without defensiveness.
- `Build appreciation` gives the coach enough structure to help the user turn a vague thank-you into a concrete appreciation.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 22 files and 74 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat`.
- Opened the coach drawer and confirmed `Plan apology` and `Build appreciation` both rendered.
- Clicked `Plan apology`.
- Coach textbox became `Help me prepare a clear apology that names what I did, the impact I can see, what I own, and one repair ask without defending myself.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:36:34Z

Added a structured conflict map in chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/conflict-map-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/conflict-map-draft.test.ts`

Behavior added:

- Empty chat now includes `Conflict map`.
- The guide separates a hard message into `What happened`, `What I felt`, `Story I told myself`, and `Could we...`.
- The generated message keeps the couple on the same team and explicitly marks the story as a possible interpretation rather than a fact.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/conflict-map-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 23 files and 76 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat`.
- Cleared the chat composer, opened `Conflict map`, and confirmed all four input fields rendered.
- Filled example conflict notes and clicked `Build conflict map`.
- The chat textarea became a structured message with `What I noticed`, `What I felt`, `The story I started telling myself`, and a concrete request.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:39:05Z

Added a dashboard micro-date planner.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan.ts`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan.test.ts`

Behavior added:

- Dashboard now shows a `Micro-date` card after the question-of-the-day card.
- The plan adapts to hard moods, low relationship score, partner interests, or a generic no-phone fallback.
- The card gives a timebox, three concrete steps, and two exits: `Invite in chat` and `Make it a goal`.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/micro-date-plan.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 24 files and 80 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/dashboard?upgraded=false`.
- Dashboard rendered `Reconnect without pretending nothing happened` with `Invite in chat` and `Make it a goal` actions.
- Clicking `Invite in chat` navigated to `/chat` and prefilled `Hey Jaluza, I do not want us to pretend everything is perfect or make tonight heavy...`
- Returning to dashboard and clicking `Make it a goal` navigated to `/goals`.
- `#goalTitle` was prefilled with `Do one low-pressure repair reset with Jaluza`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:40:57Z

Added a guided space request for conflict de-escalation.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/space-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/space-draft.test.ts`

Behavior added:

- Empty chat now includes `Space guide`.
- The guide helps the user ask for space while reassuring the partner that they are not abandoning the conversation.
- The generated draft includes reassurance, capacity, a concrete return time, and a restart request.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/space-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 25 files and 82 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL after navigation: `http://localhost:9941/chat?verify=space-guide-20260505`.
- Cleared chat, opened `Space guide`, and confirmed fields for reassurance, why space is needed, return time, and request.
- Filled an example and clicked `Build space request`.
- Chat textarea became `I love you and I want to do this carefully... What I need: I can come back after dinner at 8...`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:42:36Z

Added a follow-up transform for difficult messages.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/follow-up-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/follow-up-draft.test.ts`

Behavior added:

- Non-empty chat drafts now show a `Follow up` action next to `Soften`, `Pause`, and `Review`.
- The transform converts a hard draft into a second-message check-in that asks how the first message landed.
- It preserves the first topic but avoids repeating the entire hard message.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/follow-up-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 26 files and 85 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat?verify=space-guide-20260505`.
- The composer rendered `Prepare a follow-up that checks how this landed`.
- Filled `Hey, I felt hurt when plans changed after I arranged my night. I got defensive after that.`
- Clicking the follow-up action rewrote the textarea to `I want to check how that landed instead of assuming we are okay...`
- The rewritten draft included the first topic and omitted `I got defensive after that`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:44:27Z

Added a composer-to-coach draft review path.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/coach-review-prompt.ts`
- `apps/web/src/routes/_authenticated/-components/chat/coach-review-prompt.test.ts`

Behavior added:

- Non-empty chat drafts now show a `Coach` action.
- Clicking it opens the coach drawer and hands over the current draft with instructions to keep the truth, lower defensiveness, and make the request clear.
- Long drafts are capped before being passed to the coach prompt.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/coach-review-prompt.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 27 files and 88 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- URL: `http://localhost:9941/chat?verify=space-guide-20260505`.
- The composer rendered `Ask coach to improve this draft`.
- Clicking it opened the coach drawer.
- After the coach sidebar finished loading, the coach textbox contained `Help me improve this message before I send it... Draft: ... Please help me keep the truth, lower defensiveness, and make the request clear.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:46:01Z

Added a heated-draft warning in the chat composer.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.test.ts`

Behavior added:

- The composer now detects global blame, contempt labels, and very long drafts before send.
- It shows a small warning with specific guidance and direct actions: `Soften this` and `Pause instead`.
- The warning reuses existing safer rewrite paths instead of introducing a separate flow.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/heated-draft.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 28 files and 92 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled chat with `You never listen when plans change. I am tired of repeating myself.`
- Composer showed `This may land as blame` and guidance to name one specific event.
- `Soften this` rewrote the draft through the existing softer-start path.
- Observed follow-up improvement need: the softened output for this phrase is understandable but awkward (`not happening listen...`), so a later slice should tighten the soft-start parser.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:47:18Z

Tightened the soft-start parser after browser QA found awkward wording.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/soften-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/soften-draft.test.ts`

Behavior fixed:

- `You never listen when plans change...` now softens to `I have been feeling unheard when plans change`.
- Added a regression test so this phrase cannot return the previous awkward `not happening listen...` wording.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/soften-draft.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 28 files and 93 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled chat with `You never listen when plans change. I am tired of repeating myself.`
- Clicked `Soften this`.
- Chat textarea became `The thing I am trying to talk about is: I have been feeling unheard when plans change.`
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:49:32Z

Added a missed-bid repair guide.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/bid-repair-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/bid-repair-draft.test.ts`

Behavior added:

- Empty chat now includes `Missed bid`.
- The guide helps the user repair after missing a partner's bid for connection.
- It captures what was missed, how it may have landed, what the user wishes they had done, and an offer to try again.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/bid-repair-draft.test.ts`: passed, 2 tests.
- `pnpm test`: passed, 29 files and 95 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Cleared chat, opened `Missed bid`, and confirmed all four fields rendered.
- Filled a missed phone/listening example and clicked `Build missed-bid repair`.
- Chat textarea became a repair draft with `What I missed`, `How it may have landed`, `What I wish I had done`, and a repair offer.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:51:57Z

Added sidebar-to-composer guide discovery.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`

Behavior added:

- The chat AI sidebar now includes a `Conversation Toolkit`.
- When health is low or tension is detected, it shows `Conflict map`, `Space request`, `Apology guide`, and `Missed bid`.
- When the relationship is steadier, it keeps a lighter toolkit with `Conflict map` and `Missed bid`.
- Clicking a toolkit item clears the composer and opens the matching structured guide.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 29 files and 97 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Sidebar rendered `Conversation Toolkit` with `Conflict map`, `Space request`, `Apology guide`, and `Missed bid`.
- Clicking the sidebar `Conflict map` button opened the composer `Conflict map` guide with all four fields.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T02:55:02Z

Added a chat-to-goal bridge.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/chat-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-goal-draft.test.ts`

Behavior added:

- When the composer has text, chat now exposes a `Goal` action.
- The action extracts a small concrete request or promise from the draft, stores it as `amore-goal-draft`, and navigates to `/goals`.
- This makes a good conversation turn immediately actionable instead of leaving it as a one-off message.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/chat-goal-draft.test.ts`: passed, 4 tests.
- `pnpm test`: passed, 30 files and 101 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled chat with `Hey Jaluza, could we protect one 20-minute no-phone pocket this week?`.
- Clicked `Turn this draft into a tiny goal`.
- Browser navigated to `/goals`.
- `#goalTitle` was prefilled with `protect one 20-minute no-phone pocket this week`.
- `cmux browser surface:53 errors list`: no browser errors.

### 2026-05-05T03:00:56Z

Added aftercare planning from chat drafts.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/aftercare-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/aftercare-draft.test.ts`

Behavior added:

- When the composer has text, chat now exposes an `Aftercare` action.
- The action turns the current hard-talk draft into a short plan for ending the conversation with:
  - one thing each person understood,
  - one repair or reassurance needed that night,
  - one tiny next step for the next 24 hours.
- Composer controls now wrap instead of relying on a brittle single row as more couple-support tools are added.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/aftercare-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 31 files and 104 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Restarted the Amore dev server on the configured `BETTER_AUTH_URL` origin, `http://localhost:9941`.
- Opened a fresh cmux browser surface (`surface:174`) because `surface:53` was contaminated by another local app/service-worker state.
- Verified authenticated dashboard access, navigated to `/chat`, and filled a hard-talk draft.
- Clicked `Turn this into a small aftercare plan`.
- The chat textarea became an aftercare plan with the three expected end-of-conversation checkpoints.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:03:12Z

Added aftercare to chat toolkit discovery.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`

Behavior added:

- The chat AI sidebar toolkit now includes `Aftercare plan`.
- Low-health or tense contexts show it alongside conflict mapping, space requests, apology, and missed-bid repair.
- Steadier contexts still show it in the lighter toolkit because aftercare is useful even after non-crisis conversations.
- `ChatInput` now handles `amore:open-chat-guide` with `detail: 'aftercare'` by seeding a blank aftercare plan directly into the composer.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/ai-sidebar.test.ts src/routes/_authenticated/-components/chat/aftercare-draft.test.ts`: passed, 7 tests.
- `pnpm test`: passed, 31 files and 104 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Reused the live aftercare composer proof from `surface:174`.
- Attempted to open the mobile AI-context toolkit on the same cmux pane; the accessibility tree exposed the toggle, but clicks did not reveal the panel in that pane, so this slice relies on exported toolkit tests plus full build/test verification rather than overstating browser proof.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:06:29Z

Added a dashboard repair debrief ritual.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/repair-debrief-draft.ts`
- `apps/web/src/routes/_authenticated/-components/repair-debrief-draft.test.ts`

Behavior added:

- Dashboard now includes `Keep the repair from evaporating`.
- The ritual captures:
  - what the user heard from the partner,
  - what the user owns,
  - what reassurance still matters,
  - one concrete next step.
- `Send debrief` seeds chat with a partner-ready repair follow-up.
- `Make follow-through goal` appears when the next-step field has content and seeds the goals form.
- Notes persist locally so the user can leave and come back before sending.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts`: passed, 3 tests.
- `pnpm test`: passed, 32 files and 107 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Filled all four dashboard debrief fields on `surface:174`.
- Confirmed `Make follow-through goal` appeared only after the next-step field had content.
- Clicked `Send debrief`; `/chat` opened with a full repair debrief in the composer.
- Returned to dashboard and clicked `Make follow-through goal`; `/goals` opened with `#goalTitle` set to `Follow through: I will name when I need a 20-minute pause`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:08:14Z

Added no-blame repair for slipped goals.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`

Behavior added:

- Active goals now include `Repair slip`.
- The generated chat draft explicitly prevents missed goals from turning into blame or quiet resentment.
- The draft asks both partners to name what got in the way and choose the smallest repair version for the next 24 hours.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 6 tests.
- `pnpm test`: passed, 32 files and 108 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/goals` on `surface:174`.
- Confirmed the active goal row now shows `Repair slip`.
- Clicked `Repair slip`; `/chat` opened with a no-blame repair prompt for the selected goal.
- Confirmed the textarea included `blame or quiet resentment`, `smallest repair version`, `My part is`, and `A smaller version I can do is`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:10:39Z

Added a listen-first chat guide.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/listen-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/listen-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`

Behavior added:

- Empty chat now includes `Listen first`.
- The guide captures what the user heard, what the partner felt, one part the user can own, and one clarifying question.
- The generated reply starts with listening before responding, then validates, owns, and asks one question.
- The AI sidebar toolkit now prioritizes `Listen first` in both tense and steady states.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/listen-draft.test.ts src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`: passed, 6 tests.
- `pnpm test`: passed, 33 files and 110 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, cleared the composer, and confirmed `Listen first` appeared.
- Filled all four guide fields with a changed-plans example.
- Clicked `Build listening reply`.
- Confirmed the textarea contained the reflective draft with `What I heard`, validation, `One part I can own`, and the clarifying question.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:14:22Z

Added a longing-under-the-complaint guide.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/longing-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/longing-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx`
- `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`

Behavior added:

- Empty chat now includes `Longing`.
- The guide turns a complaint into the need underneath it, a concrete request, and one appreciation.
- The AI sidebar toolkit now includes `Longing` in both tense and steady states, immediately after `Listen first`.

Validation:

- `pnpm check-types`: passed.
- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/longing-draft.test.ts src/routes/_authenticated/-components/chat/ai-sidebar.test.ts`: passed, 6 tests.
- `pnpm test`: passed, 34 files and 112 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, cleared the composer, and clicked `Longing`.
- Filled all four guide fields with a changed-plans example.
- Clicked `Build longing request`.
- Confirmed the textarea converted the complaint into longing, request, and appreciation language.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:19:58Z

Added calm conversation agreements before conflict.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-draft.ts`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Dashboard now has a `Make the hard-talk rules while calm` practice.
- Couples can define a pause phrase, phone boundary, repair window, and one topic boundary before the next hard conversation.
- `Propose agreement` seeds a partner-facing chat draft.
- `Make agreement goal` seeds a concrete goal title from the pause phrase and repair window.
- Chat and goals now consume stored drafts even when their route component stays mounted across dashboard transitions.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/conversation-agreement-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 35 files and 115 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`.
- Filled the agreement fields with `yellow light`, a no-phone boundary, `24 hours`, and an old-arguments topic boundary.
- Clicked `Propose agreement`; `/chat` opened and the composer contained the full agreement draft with pause phrase, phone boundary, repair window, topic boundary, and calm-agreement ask.
- Returned to dashboard and clicked `Make agreement goal`; `/goals` opened with the new-goal title `Use "yellow light" and repair within 24 hours`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:23:09Z

Added a profile care-manual prompt.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/profile.tsx`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.ts`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.test.ts`

Behavior added:

- Relationship Profile now opens with a `Care manual` section.
- Couples can draft a calm message asking what support helps first, what pause phrase keeps connection intact, what repair helps, and what to avoid.
- The section can also seed a goal to create care instructions together.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 36 files and 117 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile` on `surface:174` and confirmed the `Stop guessing what helps when one of you is hurt` care-manual section appeared.
- Clicked `Ask in chat`; `/chat` opened with the care-instructions draft for Jaluza in the composer.
- Returned to `/profile` and clicked `Make it a goal`; `/goals` opened with `Create care instructions with Jaluza` in the new-goal title field.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:26:10Z

Added partner check-in support responses.

Files changed in this slice:

- `apps/web/src/server/checkin.ts`
- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- The daily check-in loader now returns the partner's same-day check-in details, not only a boolean.
- When a partner check-in includes one of the known support asks, the dashboard can show the partner's support need.
- `Respond with care` drafts a concrete response that acknowledges the partner's ask and commits to one supportive action.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 7 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 36 files and 118 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` with the current logged-in data.
- Confirmed the dashboard still renders the existing checked-in state and support actions with no browser errors.
- Did not seed the partner-check-in branch because `.env.local` points at a Railway Postgres URL; branch behavior is covered by deterministic helper tests and type/build validation instead.

### 2026-05-05T03:28:39Z

Added an in-the-moment pause reset.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/hot-moment-reset-draft.ts`
- `apps/web/src/routes/_authenticated/-components/hot-moment-reset-draft.test.ts`

Behavior added:

- Dashboard now includes `Pause without disappearing` for heated moments.
- The user can choose whether they are getting sharp, shutting down, flooded, or spiraling.
- The reset captures a return time and the concrete action the user will take while paused.
- `Send pause request` seeds a chat draft that protects connection, states the pause is not abandonment, and commits to returning by starting with what the partner said.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/hot-moment-reset-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 121 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed `Pause without disappearing` rendered.
- Selected `I am shutting down`, changed return time to `15 minutes`, and changed the reset action to `drink water and write down one thing I heard`.
- Clicked `Send pause request`; `/chat` opened with the accountable pause draft in the composer.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:31:03Z

Added a final-language harm guard in chat.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.test.ts`

Behavior added:

- Chat now detects relationship-ending language such as `I am done`, `we're done`, `this is over`, divorce, and breakup threats while drafting.
- The warning explains that final language can be hard to take back and steers the user toward a pause with a return time.
- Existing `Pause instead` rewrites the heated draft into a safer pause request.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/heated-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 122 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `I am done with this relationship.`, and confirmed the final-language warning appeared.
- Clicked `Pause instead`; the composer rewrote the message into a 20-minute pause request that preserved the topic without sending a relationship-ending threat.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:35:20Z

Extracted the hot-moment reset into a focused component so the dashboard can keep growing without burying intervention logic inside the route file.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/hot-moment-reset-card.tsx`

Behavior preserved:

- `Pause without disappearing` still renders on the dashboard.
- The state buttons, return-time input, reset-action input, preview, and `Send pause request` handoff still work.
- The chat draft still opens in `/chat` with the accountable pause language.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/hot-moment-reset-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 122 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed `Pause without disappearing` rendered from the extracted component.
- Clicked `Send pause request`; `/chat` opened and the composer contained the expected pause draft.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:37:07Z

Extracted the relationship practice deck into its own component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/relationship-practice-deck.tsx`

Behavior preserved:

- Dashboard still shows `Tiny things that help today`.
- Practice cards still seed concrete chat drafts for appreciation, emotional check-in, and repair after tension.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 122 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed `Tiny things that help today` plus `Draft check-in` rendered.
- Clicked `Draft check-in`; `/chat` opened with `Hey Jaluza, how are you feeling about us today? I do not need a perfect answer. I just want to understand you better.` in the composer.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:38:56Z

Added a goal support-planning action so goals can become teamwork before they slip.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Active goals now include `Plan support`.
- The generated chat draft asks each partner to name one obstacle and one kind of support before the goal turns into pressure, guilt, or quiet judgment.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 7 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 123 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/goals` on `surface:174` and confirmed the active goal showed `Plan support`.
- Clicked `Plan support`; `/chat` opened with a teamwork-oriented support draft for `One phone-free conversation this week`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:40:48Z

Added a reciprocal care-manual action on Profile.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.ts`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.test.ts`
- `apps/web/src/routes/_authenticated/profile.tsx`

Behavior added:

- Profile care manual now has `Share mine first` in addition to asking the partner.
- The draft uses available profile data, including interests, and leaves blanks for support preferences the user still needs to fill in.
- This makes the feature mutual: the user can volunteer how to care for them instead of only asking their partner to explain.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts`: passed, 4 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 125 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile` on `surface:174` and confirmed `Share mine first` rendered in the care-manual card.
- Clicked `Share mine first`; `/chat` opened with a first-draft care manual addressed to Jaluza and populated with the user profile interests.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:43:40Z

Added a read-only 7-day check-in rhythm to the daily check-in card.

Files changed in this slice:

- `apps/web/src/server/checkin.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- `getDailyCheckin()` now returns the last seven UTC check-in dates for both partners.
- The checked-in daily card shows a compact `7-day rhythm` with two mood markers per day: the user first, partner second.
- The card also shows how many of the last seven days both partners checked in together.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 125 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the live Railway-backed data rendered `7-DAY RHYTHM`.
- The card showed `0/7 together` and the visible week markers, including today's user mood and missing partner mood.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:45:26Z

Turned the 7-day check-in rhythm into an action, not just a chart.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- The rhythm card now includes `Talk about rhythm`.
- The generated draft frames the weekly pattern as a gentle signal, not a scorecard.
- The draft includes the number of days both partners checked in, the latest known user mood, the latest known partner mood if present, and a two-minute conversation ask.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 8 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed `Talk about rhythm` rendered in the daily check-in rhythm card.
- Clicked `Talk about rhythm`; `/chat` opened with the no-scorecard rhythm draft addressed to Jaluza.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:47:07Z

Extracted the check-in rhythm UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-rhythm.tsx`

Behavior preserved:

- Daily check-in still shows the 7-day rhythm, together count, mood markers, and `Talk about rhythm`.
- The rhythm conversation draft still seeds `/chat`.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted rhythm component rendered `7-DAY RHYTHM`, `0/7 together`, the seven day markers, and `Talk about rhythm`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:50:10Z

Extracted the relationship daily care-plan UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-care-plan-card.tsx`

Behavior preserved:

- Dashboard still shows the `CARE PLAN` guidance.
- The `Draft message`, `Make it a goal`, and `Ask coach` actions still point at the same couple-support workflows.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-care-plan.test.ts`: passed, 4 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted care-plan component rendered `CARE PLAN` and `Repair first, then reconnect`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:52:10Z

Extracted the question-of-the-day UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-connection-question-card.tsx`

Behavior preserved:

- Dashboard still chooses the right daily question from relationship score, partner mood, and partner interests.
- `Ask in chat`, `Make a goal`, and `Ask coach` still route the question into the existing couple-support workflows.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-connection-question.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted question card rendered `QUESTION OF THE DAY`, `Use one question to lower defensiveness`, `Ask in chat`, `Make a goal`, and `Ask coach`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:53:50Z

Extracted the micro-date planning UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan-card.tsx`

Behavior preserved:

- Dashboard still turns relationship score, partner mood, and partner interests into a small, low-pressure date plan.
- `Invite in chat` and `Make it a goal` still seed the existing chat and goals flows.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/micro-date-plan.test.ts`: passed, 4 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted micro-date card rendered `MICRO-DATE · 30 MINUTES`, `Reconnect without pretending nothing happened`, `Invite in chat`, and `Make it a goal`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:56:02Z

Extracted the repair debrief UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/repair-debrief-card.tsx`

Behavior preserved:

- The debrief card still persists notes in `localStorage`.
- `Send debrief` still seeds chat, and `Make follow-through goal` still appears only when a next step exists.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted debrief card rendered `AFTER REPAIR`, `Keep the repair from evaporating`, `Send debrief`, `What I heard`, and `Next step`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T03:58:15Z

Extracted the calm conversation agreement UI into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-card.tsx`

Behavior preserved:

- The agreement card still persists pause phrase, phone boundary, repair window, and topic boundary notes in `localStorage`.
- `Propose agreement` still seeds chat, and `Make agreement goal` still appears once the notes can form an actionable goal.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/conversation-agreement-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted agreement card rendered `BEFORE CONFLICT`, `Make the hard-talk rules while calm`, `Propose agreement`, `Pause phrase`, `Repair window`, and `Do not mix in`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:00:45Z

Extracted the weekly relationship reset ritual into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-ritual.tsx`

Behavior preserved:

- The weekly ritual still persists checked steps and notes in `localStorage`.
- `Send reset summary` still seeds chat, and `Make promise a goal` still appears once the promise note exists.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/weekly-reset-draft.test.ts`: passed, 3 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the extracted weekly ritual rendered `WEEKLY RITUAL`, `The 15-minute relationship reset`, `0 of 4 done`, `Send reset summary`, `Appreciate`, and `Make one promise`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:03:03Z

Extracted the primary relationship move card into a focused component.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/dashboard.tsx`
- `apps/web/src/routes/_authenticated/-components/relationship-move-card.tsx`

Behavior preserved:

- Dashboard still selects the daily move from health score, partner mood, active goals, and messages since analysis.
- The low-score branch still expands the 10-minute repair guide and seeds the ready-to-edit chat draft.

Validation:

- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 126 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked `Start repair guide`, and confirmed the extracted card rendered `10-minute repair guide`, `Appreciate first`, and `Use this in chat`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:07:20Z

Added reciprocal support after a daily check-in support ask.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- When I have already checked in and named what support I need, the support card now offers `Ask theirs too`.
- The action seeds `/chat` with a reciprocal care draft so the check-in does not become one-sided: it names my ask, then asks what would help my partner feel cared for today.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 9 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 127 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed `TODAY SUPPORT ASK` includes `Ask theirs too`.
- Clicked `Ask theirs too`, landed on `/chat`, and confirmed the draft: `Hey Jaluza, I named my own ask: I could use warmth and reassurance, and I do not want today to become only about me.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:09:21Z

Expanded dashboard insight actions so more relationship signals become partner-ready care.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights-card.tsx`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- `sentiment_trend` insights now produce a `Send emotional check-in` chat draft.
- `wish` insights now produce an `Honor this wish` chat draft.
- `important_date` insights now produce a `Plan with care` chat draft.
- Dashboard insight priority now keeps wish and important-date signals closer to the visible action surface.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 129 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the insights card still rendered existing visible actions: `Turn into a repair message`, `Discuss this pattern`, and `Act on this`.
- New hidden insight-type actions are covered by the focused unit tests because the current live dashboard data did not expose those exact insight types in the visible top six.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:11:53Z

Made love-language insight actions concrete instead of generic.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- Love-language actions now map the detected language to a small behavior that could actually land, such as taking one thing off a partner's plate for acts of service.
- The chat draft asks whether that move would feel caring or whether something else would land better, keeping the app from assuming the first idea is correct.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 129 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked `Act on this`, landed on `/chat`, and confirmed the draft included `take one small thing off your plate without making you manage it`.
- The same draft ended with `Would that feel caring to you, or would something else land better?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:14:22Z

Made communication-pattern insight actions specific to the detected pattern.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- Communication pattern actions now map known pattern keys to a concrete couple behavior instead of a generic adjustment.
- Average response time now suggests agreeing when a slower reply means busy, not distant.
- Initiation balance, conversation share, message depth, and late-night repair patterns each get their own small adjustment.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts`: passed, 6 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 37 files and 130 tests.
- `git diff --check`: passed.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked `Discuss this pattern`, landed on `/chat`, and confirmed the draft included `Average response time`.
- The same draft included `agree on when a slower reply means busy, not distant` and ended by asking whether that would make communication feel safer.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:17:40Z

Added support-ask follow-through goals from daily check-ins.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- A checked-in user's support ask now has a `Make support goal` action.
- Partner support asks also get a partner-specific `Make support goal` action.
- Support needs map to concrete follow-through goals, such as listening for 10 minutes without fixing or offering one clear reassurance and one specific appreciation.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 10 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 131 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174` and confirmed the daily support ask now includes `Make support goal`.
- Clicked `Make support goal`, landed on `/goals`, and confirmed the new goal title field was prefilled with `Follow through today: Offer one clear reassurance and one specific appreciation`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:20:32Z

Upgraded stored goal drafts so support actions can carry descriptions, not just titles.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`

Behavior added:

- `/goals` can now parse structured `amore-goal-draft` payloads with title, description, and due date while preserving old string-only drafts.
- Daily support goals now pass a useful description into the goal form, so the user sees what the support action means in practice before creating it.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 19 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 133 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked `Make support goal`, and landed on `/goals`.
- Confirmed the title field was `Follow through today: Offer one clear reassurance and one specific appreciation`.
- Confirmed the description field contained `Make warmth visible today with one reassurance, one specific appreciation, and a gentle check that it landed.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:23:09Z

Made chat-to-goal conversion preserve the relationship intention.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/chat-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- `Turn this draft into a tiny goal` now stores a structured goal draft instead of only a title.
- The goal title stays short, while the description keeps the original relational context and asks the couple to check whether the practice helped instead of treating it as a test.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/chat-goal-draft.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 13 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 134 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `Hey Jaluza, could we protect one 20-minute no-phone pocket this week? I want us to feel less rushed.`, then clicked `Turn this draft into a tiny goal`.
- Landed on `/goals` and confirmed the title field was `protect one 20-minute no-phone pocket this week`.
- Confirmed the description field was `Practice the promise from this draft: Hey Jaluza, could we protect one 20-minute no-phone pocket this week? I want us to feel less rushed. Check whether it helped, then adjust together instead of treating it as a test.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:25:29Z

Made communication insight goals carry practical follow-through instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/communication-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/communication-actions.test.ts`
- `apps/web/src/routes/_authenticated/-components/insights/communication-tab.tsx`

Behavior added:

- The Communication tab's `Make it a goal` action now stores a structured goal draft instead of only a title.
- Goal descriptions use the strongest conversation window and the current balance direction to suggest a small practice that feels like connection, not homework.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/communication-actions.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 13 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 135 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/insights?tab=communication` on `surface:174`, clicked `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Have one intentional conversation Saturday around 3 PM`.
- Confirmed the description field was `Use Saturday around 3 PM because it is already a strong conversation window. Protect the balance by each answering the same check-in question. Keep it small enough that it feels like connection, not homework.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:29:28Z

Made emotional insight goals carry concrete reset instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/emotion-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/emotion-actions.test.ts`
- `apps/web/src/routes/_authenticated/-components/insights/emotions-tab.tsx`

Behavior added:

- The Emotions tab's `Make it a goal` action now stores a structured goal draft.
- Sentiment drops, low moods, and steady emotional periods each produce a goal description with a small follow-through practice instead of only a title.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/emotion-actions.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 12 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 136 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/insights?tab=emotions` on `surface:174`, clicked `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Do one gentle emotional reset this week`.
- Confirmed the description field was `You logged low. Ask whether support should be listening, comfort, practical help, or space, then do the version they choose.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:33:19Z

Made discovery insight goals carry concrete care instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/discovery-actions.test.ts`
- `apps/web/src/routes/_authenticated/-components/insights/discoveries-tab.tsx`

Behavior added:

- The Discoveries tab's `Make it a goal` action now stores a structured goal draft instead of only a title.
- Wishes, important dates, shared interests, partner-only interests, and fallback curiosity moves now each include a goal description that tells the user exactly how to act with care.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/discovery-actions.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 15 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 137 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/insights?tab=discoveries` on `surface:174`, clicked `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Do one small thing for: Segundo sinal de internet instalado como backup`.
- Confirmed the description field was `Choose one realistic way to honor this wish this week. Keep it thoughtful and voluntary, not another source of pressure.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:36:14Z

Made dashboard goal suggestions carry follow-through instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- Dashboard `goal_suggestion` actions now store a structured goal draft instead of only a title.
- Goal suggestions with descriptions keep that description and add a small, kind, observable follow-through frame.
- Goal suggestions without descriptions now get a default instruction to pick one tiny version and check whether it helped.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 15 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 37 files and 138 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior checked in cmux:

- Opened `/dashboard` on `surface:174`.
- Confirmed the current logged-in dashboard data did not expose a visible `goal_suggestion` card in the first six rendered insights, so there was no natural dashboard click target for this exact path in the current account state.
- Confirmed the dashboard rendered normally and `cmux browser surface:174 errors list` reported no browser errors after this change.

### 2026-05-05T04:38:37Z

Made the overview action-plan goal carry practical repair instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insights/overview-tab.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/overview-tab.test.ts`

Behavior added:

- The Insights overview `Make it a goal` action now stores a structured goal draft instead of only a title.
- Each overview action-plan branch now includes a concrete goal description: repair, conflict soft-start, weekly practice, or appreciation.
- The low-health repair branch now opens the goal form with a specific 10-minute repair practice instead of a bare title.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/overview-tab.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 11 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 38 files and 141 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/insights?tab=overview` on `surface:174`, clicked `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Repair tension within 24 hours`.
- Confirmed the description field was `Take 10 calm minutes with Jaluza. Start with appreciation, own one piece, and ask what would help before trying to solve everything.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:41:18Z

Made Daily Care Plan goals preserve the care steps.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-care-plan.ts`
- `apps/web/src/routes/_authenticated/-components/daily-care-plan.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-care-plan-card.tsx`

Behavior added:

- Daily Care Plan now builds a structured goal draft with title and description.
- Hard mood, repair, love-language, interest, and tiny-promise branches each carry the actual care instructions into the goal form.
- The visible dashboard `Repair first, then reconnect` goal now tells the user what to do inside the 10-minute repair conversation.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-care-plan.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 12 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 38 files and 141 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked the Daily Care Plan `Make it a goal` link under `Repair first, then reconnect`, and landed on `/goals`.
- Confirmed the title field was `Have one 10-minute repair conversation with Jaluza`.
- Confirmed the description field was `Name one real appreciation, own one part without defending yourself, then ask what felt heavy and listen before responding.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:45:10Z

Made question and micro-date goals preserve follow-through instructions.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-connection-question.ts`
- `apps/web/src/routes/_authenticated/-components/daily-connection-question.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-connection-question-card.tsx`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan.ts`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan.test.ts`
- `apps/web/src/routes/_authenticated/-components/micro-date-plan-card.tsx`

Behavior added:

- Daily connection questions now store structured goal drafts with the listening/support instruction.
- Micro-date plans now store structured goal drafts with the activity steps, not only the plan title.
- The visible dashboard question and micro-date actions both carry relationship-safe follow-through into `/goals`.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-connection-question.test.ts src/routes/_authenticated/-components/micro-date-plan.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 15 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 38 files and 141 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked the `Use one question to lower defensiveness` card's `Make a goal`, and landed on `/goals`.
- Confirmed the title field was `Ask one repair question to Jaluza`.
- Confirmed the description field was `Ask what they wish you understood better about this week, then listen without defending yourself before you respond.`
- Returned to `/dashboard`, clicked the `Reconnect without pretending nothing happened` card's `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Do one low-pressure repair reset with Jaluza`.
- Confirmed the description field was `Start with something neutral, share one appreciation before discussing tension, and stop while the conversation still feels safe.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:48:45Z

Made note-driven repair, agreement, and weekly reset goals preserve context.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/repair-debrief-draft.ts`
- `apps/web/src/routes/_authenticated/-components/repair-debrief-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/repair-debrief-card.tsx`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-draft.ts`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/conversation-agreement-card.tsx`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-ritual.tsx`

Behavior added:

- Repair debrief follow-through goals now keep the next step and any available repair context.
- Hard-talk agreement goals now keep the pause phrase, phone boundary, repair window, and topic boundary.
- Weekly reset promise goals now keep appreciation, hard thing, need, and promise context.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts src/routes/_authenticated/-components/conversation-agreement-draft.test.ts src/routes/_authenticated/-components/weekly-reset-draft.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 20 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 38 files and 144 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, entered `send the check-in before bed` in the repair debrief `Next step` textarea, clicked `Make follow-through goal`, and landed on `/goals`.
- Confirmed the title field was `Follow through: send the check-in before bed`.
- Confirmed the description field was `Do the follow-through: send the check-in before bed. Keep it small, visible, and connected to the repair conversation.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:53:03Z

Removed another title-only goal path by making Profile care-manual goals store structured follow-through instructions, with the same structured draft parser used by the Goals form.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.ts`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.test.ts`
- `apps/web/src/routes/_authenticated/profile.tsx`
- `apps/web/src/routes/_authenticated/-components/insights/coaching-actions.ts`
- `apps/web/src/routes/_authenticated/-components/insights/coaching-actions.test.ts`
- `apps/web/src/routes/_authenticated/-components/insights/coaching-tab.tsx`

Behavior added:

- Profile care-manual `Make it a goal` now opens the Goals form with a specific title and an action-oriented description.
- Coaching-tab goal suggestions now use the same structured goal draft shape when visible for an account.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts src/routes/_authenticated/-components/insights/coaching-actions.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 16 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 38 files and 146 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile` on `surface:174`, clicked care manual `Make it a goal`, and landed on `/goals`.
- Confirmed the title field was `Create care instructions with Jaluza`.
- Confirmed the description field was `Answer the care manual with Jaluza: what helps first when upset, what pause phrase still means coming back, what repair helps, and what to avoid even when trying to help.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:57:04Z

Added a dashboard repair chooser so a user in a tense moment can pick the kind of message they need instead of starting from a blank chat box.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/repair-choice-draft.ts`
- `apps/web/src/routes/_authenticated/-components/repair-choice-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/repair-choice-card.tsx`
- `apps/web/src/routes/_authenticated/dashboard.tsx`

Behavior added:

- Dashboard now has a `Pick the message that lowers the heat` panel.
- The user can enter what happened, choose `Listen first`, `Own my part`, `Start softer`, or `End safely`, preview the draft, and send it to chat.
- The new helper reuses the existing listening, apology, softer-start, and aftercare draft builders instead of creating a disconnected draft system.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-choice-draft.test.ts src/routes/_authenticated/-components/chat/aftercare-draft.test.ts src/routes/_authenticated/-components/chat/apology-draft.test.ts src/routes/_authenticated/-components/chat/listen-draft.test.ts src/routes/_authenticated/-components/chat/soften-draft.test.ts`: passed, 5 files and 15 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 39 files and 150 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, found `Pick the message that lowers the heat`, entered `I got sharp when you asked if I had forgotten dinner plans`, selected `Own my part`, and clicked `Send this draft`.
- Confirmed `/chat` opened with the composer containing an owned apology draft, including `What I am apologizing for: I got sharp when you asked if I had forgotten dinner plans.`, `it may have made Jaluza feel alone with the problem.`, and `could I listen to what would help repair this now?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T04:59:46Z

Added an immediate `Do today` action for active goals so weekly relationship promises can become one same-day move instead of staying abstract.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Active goals now have a `Do today` action on the dashboard Goals summary.
- Active goals also have `Do today` on the full `/goals` page.
- The generated chat draft names the goal, preserves the description, includes the due date when present, and asks each partner to pick one tiny version for today.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 9 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 39 files and 151 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, found the active goal `One phone-free conversation this week`, clicked `Do today`, and landed on `/chat`.
- Confirmed the composer contained `For our goal "One phone-free conversation this week", I want to choose the smallest version we can actually do today.`, the original goal description, `This is due May 12`, and `My tiny version for today is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:02:53Z

Added a Profile bridge action that turns both partners' profile data into one practical weekly adjustment instead of leaving profile fields as passive labels.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/profile-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/profile-action-draft.test.ts`
- `apps/web/src/routes/_authenticated/profile.tsx`

Behavior added:

- `/profile` now includes `Turn both profiles into one small adjustment`.
- `Bridge in chat` creates a shared conversation draft that compares how care lands for each person and how conversations can feel safer for each person.
- The draft still works when profile fields are missing by using practical fallbacks instead of blank output.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/profile-action-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 39 files and 152 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile` on `surface:174`, dismissed the premium modal that appeared from the prior chat path, clicked `Bridge in chat`, and landed on `/chat`.
- Confirmed the composer contained `I want us to use our profiles as practical instructions, not labels.`, care-language lines for me and Jaluza, conversation-safety lines for me and Jaluza, and `Could we each pick one small adjustment for this week so both of us feel easier to love and easier to talk to?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:06:04Z

Made the heated-draft warning more actionable by adding a recommended rescue action instead of leaving the user to choose between generic buttons while activated.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/heated-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Final relationship-ending language now recommends `Use pause instead`.
- Blame, contempt, and overlong drafts now recommend the safer softer-start path.
- The warning still keeps the existing `Soften this` and `Pause instead` options for user control.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/heated-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 39 files and 152 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `I am done with this relationship`, and confirmed the heated warning exposed `Use pause instead`.
- Clicked `Use pause instead` and confirmed the composer changed to `I am feeling activated and I do not want to say this badly.`, kept the original topic, and ended with `Can we pause for 20 minutes and come back to this when I can listen better?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:08:27Z

Added a `Reassure` chat starter for moments when the helpful move is not a repair argument but a simple signal that the bond is still intact.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/reassurance-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/reassurance-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Empty chat composer now includes `Reassure`.
- The starter creates a short non-abandoning message: care, concern about distance, and one small step back toward each other.
- The draft helper accepts custom context for future guided reassurance flows.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/reassurance-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 40 files and 154 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, cleared the composer, confirmed `Reassure` appeared in the starter row, and clicked it.
- Confirmed the composer contained `I care about us and I am still here.`, `I do not want the distance between us to get bigger.`, and `Could we take one small step back toward each other today?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:14:48Z

Added a local draft check in the chat composer so couples get immediate, non-premium feedback before sending a message in a tense moment.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Typed drafts now get a local checklist for `Specific moment`, `Clear next ask`, and `No global blame`.
- The checklist rewards concrete context and answerable asks.
- The checklist flags global blame language such as `you never`, `you always`, or `you do not care` without requiring AI or a paid feature.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 41 files and 156 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `You never listen when dinner plans change`, and confirmed the live composer HTML rendered `Local draft check`.
- Confirmed checklist states: `OK: Specific moment`, `Needs: Clear next ask`, and `Needs: No global blame`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:16:29Z

Added a `Break silence` chat starter for the relationship moment where the useful next step is a low-pressure restart after distance.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/silence-repair-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/silence-repair-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Empty chat composer now includes `Break silence`.
- The starter creates a short reconnection message that names the distance, owns not making reconnection easy, and asks for one gentle check-in.
- Custom helper inputs normalize whitespace and punctuation for future guided versions.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/silence-repair-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 158 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, confirmed `Break silence` appeared in the empty starter row, and clicked it.
- Confirmed the textarea contained `I have been quiet, but I do not want distance to become our answer.`, `I can own that I did not make it easy to reconnect.`, and `Could we restart with one gentle check-in today?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:18:37Z

Made the local draft check actionable by adding a one-click `Add clear ask` repair when the user's draft names a moment but does not give their partner an answerable next step.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Drafts missing a clear request now show `Add clear ask` inside `Local draft check`.
- Clicking it preserves the user's original statement and appends `Could we talk for 10 minutes today and pick one next step?`
- Drafts that already contain a request are not changed by the helper.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 4 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 160 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `I felt hurt when dinner plans changed tonight`, and confirmed `Add clear ask` appeared in the local draft check.
- Clicked `Add clear ask` and confirmed the textarea became `I felt hurt when dinner plans changed tonight.` followed by `Could we talk for 10 minutes today and pick one next step?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:20:58Z

Added a weekly care-swap goal template so the Goals page helps couples make practical support explicit instead of asking them to infer each other's needs.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Goals now includes `One care swap this week`.
- The goal describes a mutual support exchange: one practical request and one support offer from each person.
- `Invite partner first` creates a chat draft that asks for a 10-minute care swap, keeps the request non-complaining, and gives both people blanks to fill.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 10 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 161 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/goals` on `surface:174` and confirmed the template HTML included `One care swap this week` and `Each person names one small practical support request and one support offer so care becomes explicit instead of guessed.`
- Clicked the fourth template's `Invite partner first`, landed on `/chat`, and confirmed the textarea contained `Could we do a 10-minute care swap this week?`, `daily life feel lighter`, `My request is: ____.`, and `The support I can offer you is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:24:09Z

Improved the daily check-in `Invite theirs` action so it uses the user's selected support ask instead of sending a generic check-in nudge.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- `Invite theirs` now builds a partner-specific check-in draft with the current support ask.
- The draft names what I could use today, avoids pressure, and asks what would help the partner feel cared for.
- If no support ask is known, the helper falls back to a general emotional check-in rather than a blank message.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 12 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 162 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard` on `surface:174`, clicked `Invite theirs` from the submitted daily check-in card, and landed on `/chat`.
- Confirmed the textarea contained `Hey Jaluza, I noticed I could use this today: I could use warmth and reassurance.`, `I do not want to pressure you to do the same`, and `How are you feeling today, and what would help you feel cared for?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:26:00Z

Made the local draft check more useful for blame-language drafts by adding a one-click `Add ownership` rewrite.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Drafts that fail `No global blame` now show `Add ownership`.
- Clicking it keeps the user's concern visible but reframes it as something they want to say without making the partner the whole problem.
- The rewrite adds blanks for `The part I can own` and `What I want us to understand together`.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 163 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat` on `surface:174`, typed `You never care when plans change`, and confirmed `Add ownership` appeared beside the other draft repair actions.
- Clicked `Add ownership` and confirmed the textarea contained `I want to say this without making you the whole problem: You never care when plans change`, `The part I can own is: ____.`, and `What I want us to understand together is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:29:36Z

Added a dashboard `Check progress` action for active goals so a couple can revisit a promise before it quietly goes stale.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

Behavior added:

- Active goals on the dashboard now show `Check progress` alongside `Discuss` and `Do today`.
- The action opens Chat with a midweek check-in script that names the goal, repeats the original promise, asks what is easier, asks what is getting in the way, and reduces the plan to the smallest version still possible today.
- Due dates are translated into a shared next-step prompt instead of being left as passive metadata.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 10 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 163 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=goal-progress` on `surface:174` and confirmed an active goal card showed `Discuss`, `Do today`, and `Check progress`.
- Clicked `Check progress`, landed on `/chat`, and confirmed the textarea contained `Quick goal check-in: One phone-free conversation this week.`, `The promise was: Pick one 20-minute window with no phones, no fixing, and no multitasking. Just ask what felt good and what felt hard.`, `What has been easier than expected?`, `What has been getting in the way?`, `What is the smallest version we can still do today?`, and `Before May 12, could we each name one next step?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:33:17Z

Moved the no-blame goal slip repair path onto the dashboard so active goals can be repaired from the place couples already scan.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

Behavior added:

- Dashboard goal cards now include `Repair slip`.
- The action opens Chat with the same structured no-blame slip repair draft used by the full goals page.
- The draft names the goal, repeats the promise, prevents blame/resentment framing, asks what got in the way, and turns the slip into a next-24-hours repair version.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 10 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 163 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=goal-slip` on `surface:174` and confirmed the active goal card showed `Repair slip`.
- Clicked `Repair slip`, landed on `/chat`, and after the route settled confirmed the textarea contained `I think we may have slipped on this goal: One phone-free conversation this week.`, `I do not want that to turn into blame or quiet resentment.`, `Can we each name one thing that got in the way`, `My part is: ____.`, and `A smaller version I can do is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:37:08Z

Added a local warmth check to the Chat composer so clear repair drafts do not land colder than intended.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- The local draft check now includes `Warmth signal`.
- A clear but emotionally cold draft shows `Add warmth`.
- Clicking `Add warmth` prepends `I care about us, and I want to say this in a way that keeps us close.` while preserving the user's original message and ask.
- Drafts that already name care, appreciation, gratitude, or teamwork do not get duplicate warmth lines.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 8 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 166 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat?proof=warmth-check` on `surface:174`, typed `I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?`, and confirmed the local draft check showed `Add warmth` plus the warmth detail.
- Clicked `Add warmth` and confirmed the textarea contained `I care about us, and I want to say this in a way that keeps us close.` followed by the original draft.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:41:09Z

Added check-in appreciation loops so support requests can close with gratitude instead of stopping at the ask.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- Partner support cards now have `Thank first`, which thanks the partner for checking in before moving to the support plan.
- The user's own support ask now has `Thank after help`, which opens a draft that notices the care received, names what helped, names the emotional impact, and thanks the partner for not making the user carry it alone.
- Both drafts preserve the detected support need instead of sending generic appreciation.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 14 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 168 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=thank-after-help` on `surface:174` and confirmed the daily support ask actions included `Thank after help`.
- Clicked `Thank after help`, landed on `/chat`, and after the route settled confirmed the textarea contained `Hey Jaluza, I want to notice the care you gave today.`, `When I asked for warmth, what helped was: ____.`, `It made me feel: ____.`, and `Thank you for not making me carry that alone.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:47:04Z

Made the local Chat draft checker actionable when a message is vague by adding an `Add moment` repair.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Drafts missing `Specific moment` now show `Add moment`.
- Clicking it prepends `One specific moment I mean is: ____.` and preserves the user's original draft.
- Drafts that already name a concrete moment are left unchanged by the helper.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 10 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 170 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/chat?proof=add-moment` on `surface:174`, typed `I feel disconnected. Could we talk?`, and confirmed the local draft check showed `Add moment`.
- Clicked `Add moment` and confirmed the textarea contained `One specific moment I mean is: ____.`, followed by `I feel disconnected. Could we talk?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:52:24Z

Strengthened dashboard conflict/health insight actions so the generated repair message includes ownership and a concrete repair request.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/insight-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/insight-action-draft.test.ts`

Behavior added:

- `Turn into a repair message` now keeps the insight text but structures the draft into a calmer repair conversation.
- The draft asks for a 10-minute talk, adds `One part I can own is: ____.`, and adds `One repair that would help me feel closer to you is: ____.`
- This turns the insight from a warning into a concrete repair script.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts`: passed, 7 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 170 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=insight-repair-ownership` on `surface:174`, dismissed the premium modal, and confirmed the dashboard Insights card had `Turn into a repair message`.
- Clicked `Turn into a repair message`, landed on `/chat`, and confirmed the textarea contained the communication-load insight, `Can we take 10 minutes to talk about what has felt heavy?`, `One part I can own is: ____.`, and `One repair that would help me feel closer to you is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:00:04Z

Added a direct care-manual action for naming what not to do during hard moments.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.ts`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.test.ts`
- `apps/web/src/routes/_authenticated/profile.tsx`

Behavior added:

- The Profile care manual now includes `Ask what to avoid`.
- The draft asks what not to do when the partner is upset or overwhelmed, gives examples like advice too fast, too many questions, disappearing without a return signal, and defending before understanding, then asks which habit should stop first.
- This gives couples a practical prevention script, not only a repair-after-damage script.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts`: passed, 6 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 171 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile?proof=avoid-hard-moments` on `surface:174` and confirmed the care manual showed `Ask in chat`, `Ask what to avoid`, `Share mine first`, and `Make it a goal`.
- Clicked `Ask what to avoid`, landed on `/chat`, and confirmed the textarea contained `I want to get better at not making hard moments harder`, `what should I avoid doing even if I am trying to help?`, `Giving advice too fast.`, `Getting quiet without saying I am coming back.`, `Defending myself before I understand you.`, and `What is one thing you wish I would stop doing first?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:05:49Z

Turned partner-interest drafts into a small shared-moment invitation instead of only curiosity.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/profile-action-draft.ts`
- `apps/web/src/routes/_authenticated/-components/profile-action-draft.test.ts`

Behavior added:

- Clicking a partner interest still asks what the partner has been enjoying about it.
- The draft now also asks to choose one tiny shared version this week, even if it is just 15 minutes.
- This makes profile interests usable as a connection plan rather than static profile data.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/profile-action-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 171 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/profile?proof=interest-shared-version` on `surface:174` and confirmed Jaluza's profile interests included `Ciclismo / Bike`.
- Clicked `Ciclismo / Bike`, landed on `/chat`, and confirmed the textarea contained `I noticed Ciclismo / Bike matters to Jaluza.`, `Would you tell me what you have been enjoying about it lately?`, and `Could we choose one tiny shared version this week, even if it is just 15 minutes?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:10:04Z

Added a tiny-goal template for an apology that includes changed behavior.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-goal-draft.ts`
- `apps/web/src/routes/_authenticated/-goal-draft.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- Goals now includes `One apology with changed behavior`.
- The template description asks the user to own a specific impact, name what behavior will change, and check whether the repair would actually land.
- `Invite partner first` opens a structured chat draft with blanks for ownership, impact, and the specific behavior to practice differently next time.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 11 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed, 42 files and 172 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.

User-visible behavior verified in cmux:

- Opened `/goals?proof=changed-apology` on `surface:174` and confirmed the page HTML included `One apology with changed behavior` and `Own one specific impact, name the behavior that will change, and ask whether the repair would actually land.`
- Clicked the fifth `Invite partner first`, landed on `/chat`, and confirmed the textarea contained `I want to make one apology this week that includes changed behavior, not just words.`, `The thing I want to own is: ____.`, `The impact I can understand is: ____.`, `The specific behavior I will practice differently next time is: ____.`, and `Would you be willing to tell me whether that would actually repair anything for you?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:54:01Z

Made support-goal drafts due today and fixed the goals route crash encountered during proof.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/goals.tsx`

Behavior added:

- `Make support goal` now creates a same-day support follow-through draft instead of falling back to a week.
- The draft still keeps the selected support need concrete, such as warmth requiring one reassurance, one appreciation, and a check that it landed.
- Goals now keeps the no-couple empty state in a separate component so the connected goals page does not change its hook layout during auth or live reload transitions.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts src/routes/_authenticated/-goal-draft.test.ts`: passed, 25 tests.
- `pnpm check-types`: passed.

User-visible behavior verified in cmux:

- Used the logged-in cmux browser on `surface:174`.
- Clicked dashboard `Make support goal`, landed on `/goals`, and confirmed the new-goal form title was `Follow through today: Offer one clear reassurance and one specific appreciation`.
- Confirmed the description was `Make warmth visible today with one reassurance, one specific appreciation, and a gentle check that it landed.`
- Confirmed the due-date field was `2026-05-05`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:56:20Z

Added a support landing-check action so couples can close the feedback loop after asking for care.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- The checked-in support card now includes `Check if it landed`.
- The generated chat draft asks whether the support ask was clear, names what helped, names what still felt hard or unclear, and invites one small adjustment for next time.
- This turns support from a one-way ask into a shared learning loop.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 15 tests.
- `pnpm check-types`: passed.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=landing-check` on `surface:174` and confirmed `Check if it landed` appeared in the support ask card.
- Clicked `Check if it landed`, landed on `/chat`, and confirmed the textarea contained `Hey Jaluza, can I check whether my support ask landed clearly?`, `Earlier I named this as what would help: I could use warmth and reassurance.`, `What helped me was: ____.`, `What still felt hard or unclear was: ____.`, and `Could we adjust one small thing for the next time so support feels easier for both of us?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:58:05Z

Added a no-reply follow-up starter for vulnerable messages that went unanswered.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/silence-repair-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/silence-repair-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Chat now has a `No reply` starter separate from the broader `Break silence` starter.
- The generated draft names the anxiety created by silence without accusing the partner.
- It reassures that the user is not trying to pressure or start a fight, then asks for a concrete response window.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/silence-repair-draft.test.ts`: passed, 4 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/chat?proof=no-reply` on `surface:174` and confirmed the starter rail included `No reply`.
- Clicked `No reply` and confirmed the textarea contained `I sent something vulnerable and noticed I started filling in the silence with stories.`, `I am not trying to pressure you or start a fight.`, and `Could you let me know when you have space to respond, even if the answer is later today?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T05:59:58Z

Added a respect-no starter so the app helps users receive a boundary without pressure.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/respect-no-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/respect-no-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Chat now has a `Respect no` starter.
- The draft thanks the partner for honesty, names disappointment without turning it into pressure, prioritizes relational safety, and offers smaller version, another time, or accepting no for today.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/respect-no-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- In the logged-in `/chat` view on `surface:174`, cleared the textarea and confirmed the starter rail included `Respect no`.
- Dismissed the premium modal with `Maybe later` when it appeared.
- Clicked `Respect no` and confirmed the textarea contained `Thank you for being honest with me, even if the answer is no or not right now.`, `I feel disappointed, and I do not want to turn that into pressure on you.`, `I care more about us feeling safe than about getting the exact answer I wanted.`, and `Could we choose a smaller version, another time, or simply let this be no for today?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:01:22Z

Added a redo-message starter for repairing a message that came out sharper than intended.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/redo-message-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/redo-message-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Chat now has a `Redo message` starter.
- The draft owns the previous tone, restates the underlying need, and asks to try again calmly instead of making the partner respond to the worst version.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/redo-message-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- In the logged-in `/chat` view on `surface:174`, cleared the textarea and confirmed the starter rail included `Redo message`.
- Clicked `Redo message` and confirmed the textarea contained `I do not like how my last message came out.`, `Under the sharpness, what I was trying to say is that I want us to understand each other better.`, and `Can I try again with a calmer version instead of making you respond to the worst version of it?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:03:42Z

Added a lower-pressure choice check for chat drafts that make direct requests.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- The local draft checker now includes `Room for no`.
- If a draft asks for something without leaving room for no, later, or a smaller version, chat shows `Add choice`.
- `Add choice` appends a lower-pressure alternative instead of making the ask feel like a demand.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 13 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- In the logged-in `/chat` view on `surface:174`, entered `I care about us, and I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?`
- Confirmed the local draft check showed `Add choice`.
- Clicked `Add choice` and confirmed the textarea appended `If that does not work for you, could you suggest a smaller version or another time?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:05:12Z

Added a before-advice starter so users ask what kind of support is wanted before fixing.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/before-advice-draft.ts`
- `apps/web/src/routes/_authenticated/-components/chat/before-advice-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx`

Behavior added:

- Chat now has a `Before advice` starter.
- The draft asks whether the partner wants comfort, listening, problem-solving, or space before the user gives advice.
- This helps couples avoid the common fixing-vs-comfort mismatch.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/before-advice-draft.test.ts`: passed, 2 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- In the logged-in `/chat` view on `surface:174`, cleared the textarea and confirmed the starter rail included `Before advice`.
- Clicked `Before advice` and confirmed the textarea contained `I want to support you in the way that actually helps, not just jump into fixing.`, `Do you want comfort, listening, problem-solving, or a little space right now?`, and `I can follow your lead instead of guessing.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:07:35Z

Added dashboard goal rescue actions for planning support and making a goal easier.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

Behavior added:

- Dashboard active goals now show `Plan support`.
- Dashboard active goals now show `Make easier`.
- These actions were already available on the full Goals page; adding them to the dashboard makes the rescue path available where users are most likely to notice a slipping goal.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts`: passed, 11 tests.
- `pnpm check-types`: passed.
- `pnpm test`: passed, 45 files and 184 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=goal-support-actions` on `surface:174` and confirmed the dashboard goal row included `Plan support` and `Make easier`.
- Clicked `Plan support`, landed on `/chat`, and confirmed the textarea contained `I want this goal to feel like teamwork`, `Can we each name one obstacle that might make this hard`, and `One kind of support that would help is: ____.`
- Returned to `/dashboard?proof=goal-make-easier`, clicked `Make easier`, landed on `/chat`, and confirmed the textarea contained `I do not want this goal to become pressure or guilt`, `Could we make it smaller and more realistic for this week?`, and `A version I think we could actually keep is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:09:13Z

Added a what-not-to-do support path after daily check-in.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- The checked-in support card now includes `Name what not to do`.
- The generated draft keeps the original support ask, names one behavior that would not help, and invites a replacement behavior.
- This helps partners avoid accidentally making support harder while trying to help.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 16 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=support-avoidance` on `surface:174` and confirmed the checked-in support card included `Name what not to do`.
- Clicked `Name what not to do`, landed on `/chat`, and confirmed the textarea contained `Hey Jaluza, I want to make my support ask easier to get right, not more stressful.`, `What would help me is still: I would really appreciate some warmth and reassurance from you.`, `One thing that probably would not help is: ____.`, and `If you notice yourself wanting to do that, could we try this instead: ____?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:11:20Z

Added a partner-side ask-what-to-avoid support path.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-card.tsx`

Behavior added:

- When the partner support-ask card is present, it now includes `Ask what to avoid`.
- The generated draft tells the partner the user wants to support them without making the moment heavier, repeats the support ask, asks what to avoid doing or saying, and names a replacement behavior.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 17 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

Runtime note:

- Opened `/dashboard?proof=partner-avoidance` on `surface:174`; the logged-in account did not currently have a partner support ask rendered, so there was no honest click target for this conditional UI path.
- The dashboard rendered cleanly and `cmux browser surface:174 errors list` reported no browser errors.

### 2026-05-05T06:13:15Z

Added an early-overwhelm-signs action to the profile care manual.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.ts`
- `apps/web/src/routes/_authenticated/-components/care-instructions-draft.test.ts`
- `apps/web/src/routes/_authenticated/profile.tsx`

Behavior added:

- The Profile care manual now includes `Ask stress signs`.
- The generated draft asks what early signs show up in the partner's voice, body, texting, or energy, how to check in gently, and what first support response helps.
- This shifts the app from reactive repair to earlier care.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts`: passed, 7 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/profile?proof=stress-signs` on `surface:174` and confirmed the care manual included `Ask stress signs`.
- Clicked `Ask stress signs`, landed on `/chat`, and confirmed the textarea contained `I want to notice earlier when things are getting too much for you`, `what do you usually do with your voice, body, texting, or energy?`, `without making you feel watched or managed?`, and `One early sign I notice in myself is: ____.`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:15:14Z

Added a weekly-reset action that turns the user's need into a smaller direct ask.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-draft.test.ts`
- `apps/web/src/routes/_authenticated/-components/weekly-reset-ritual.tsx`

Behavior added:

- The weekly reset ritual now includes `Ask for need`.
- The generated draft pulls the hard thing and need notes into a short ask instead of requiring the full reset summary.
- It asks for the smallest doable version so the need does not become pressure.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/weekly-reset-draft.test.ts`: passed, 5 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=weekly-need` on `surface:174` and confirmed the weekly reset included `Ask for need`.
- Filled the weekly hard thing with `planning felt scattered` and the weekly need with `one calm planning window`.
- Clicked `Ask for need`, landed on `/chat`, and confirmed the textarea contained `One thing that felt hard this week was: planning felt scattered.`, `What would help me next week is: one calm planning window.`, and `Could we choose the smallest version of that together so it feels doable for both of us?`
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:17:09Z

Added a tiny-goal path for missed daily check-in rhythm.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-support.test.ts`
- `apps/web/src/routes/_authenticated/-components/daily-checkin-rhythm.tsx`

Behavior added:

- The 7-day check-in rhythm card now includes `Make rhythm tiny`.
- The generated goal draft asks the couple to choose the smallest daily check-in version that feels kind instead of like a scorecard.
- The draft due date is one week out.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts`: passed, 18 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/dashboard?proof=rhythm-goal` on `surface:174` and confirmed the 7-day rhythm card included `Make rhythm tiny`.
- Clicked `Make rhythm tiny`, landed on `/goals`, and confirmed the new-goal title was `Make check-ins easier with Jaluza`.
- Confirmed the description was `We both checked in on 0/7 days. Pick the smallest daily version that feels kind instead of like a scorecard, then try it for one week.`
- Confirmed the due date was `2026-05-12`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:18:58Z

Fixed the room-for-no checker so support-choice questions are not overcorrected.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`

Behavior added:

- The `Room for no` check now treats support-choice questions as already lower-pressure when they offer options such as comfort, listening, problem-solving, or space.
- This prevents healthy support questions from getting an unnecessary `Add choice` prompt.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 14 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Opened `/chat?proof=support-choice-check` on `surface:174`.
- Clicked `Before advice` and confirmed the textarea contained `Do you want comfort, listening, problem-solving, or a little space right now?`
- Confirmed the local draft check showed `Add moment` and `Add warmth`, but did not show `Add choice`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:20:31Z

Fixed the warmth checker so practical support language counts as care.

Files changed in this slice:

- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.ts`
- `apps/web/src/routes/_authenticated/-components/chat/draft-care-check.test.ts`

Behavior added:

- The `Warmth signal` check now recognizes `I want to support you`, `support you`, and `follow your lead`.
- This prevents useful support drafts from being incorrectly flagged as lacking warmth.

Validation:

- `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts`: passed, 15 tests.
- `pnpm check-types`: passed.
- `git diff --check`: passed.

User-visible behavior verified in cmux:

- Cleared the `/chat` textarea on `surface:174`, dismissed the premium modal with `Maybe later`, and clicked `Before advice`.
- Confirmed the textarea contained `I want to support you in the way that actually helps, not just jump into fixing.`
- Confirmed the local draft check showed only `Add moment`, with no `Add warmth` and no `Add choice`.
- `cmux browser surface:174 errors list`: no browser errors.

### 2026-05-05T06:21:08Z

Ran a broad integration checkpoint after the support, profile, weekly reset, and draft-checker changes.

Validation:

- `pnpm test`: passed, 45 files and 191 tests.
- `pnpm build`: passed with the existing non-blocking `connections.ts` dynamic/static import chunking warning.
## 2026-05-05T06:26:36Z - Emotional reset asks before fixing

- Strengthened the insights emotional reset chat draft so hard emotional days ask what felt hardest, name one ownable part, and ask what would help now.
- Strengthened the live low-mood reset path so it asks what felt heaviest, leaves room for the user's role without defensiveness, and then asks whether support should be listening, comfort, practical help, or space.
- Updated the matching goal description so the goal is not just "ask support type"; it includes listening for any owned part and following the chosen support version.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/emotion-actions.test.ts` passed, 5 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/insights` -> `Emotions` -> `Open in chat` produced the revised live draft:
    - `What has felt heaviest today?`
    - `If any part of it involved me, I want to understand that without defending.`
    - `Would support feel better as listening, comfort, practical help, or a little space today?`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:29:35Z - Chat starter for turning yes into follow-through

- Added an `After yes` chat starter for the moment after a couple agrees in principle but needs a concrete next step.
- Draft structure:
  - name appreciation for the small yes,
  - signal warmth and low pressure,
  - ask what each person will do and by when,
  - leave room to adjust instead of silently dropping the plan.
- Tightened the draft after live care-check feedback so it no longer triggers `Add warmth` or `Add choice`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/after-yes-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 17 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat` -> `After yes` produced:
    - `I care about us turning it into something kind and doable, not another pressure point.`
    - `Can we make the next step concrete: what each of us will do, and by when?`
    - `If that does not work or starts feeling too much, can we adjust it instead of silently dropping it?`
  - The body text no longer contained `Add warmth` or `Add choice`; `errors list` reported no browser errors.
## 2026-05-05T06:32:15Z - Chat starter for both-perspectives conflict

- Added a `Both true` chat starter for disagreements where both partners have a valid experience and the conversation risks becoming a right/wrong fight.
- Draft structure:
  - anchors to `this moment today`,
  - validates the partner's experience without erasing the user's,
  - names care about understanding both sides,
  - asks what each person most needs understood before solving,
  - includes a pause/later option if the conversation is too much.
- Tightened the draft after live care-check feedback so it stopped triggering `Add moment` and `Add choice`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/both-true-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 17 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat` -> `Both true` produced the revised draft and no care-check action buttons.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:36:03Z - Repair debrief can check whether repair landed

- Added a `Check if landed` action to the dashboard repair debrief card.
- The generated message asks whether the repair actually helped instead of assuming completion, repeats what the user tried to understand, repeats the named follow-through, and leaves room to come back later.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts` passed, 5 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard proof:
    - filled `What I heard` with `you felt alone when I went quiet`,
    - filled `Next step` with `name when I need a 20-minute pause`,
    - clicked `Check if landed`,
    - landed at `http://localhost:9941/chat` with the expected draft in the chat input.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:38:34Z - Conversation agreement can repair slips

- Added a `Repair agreement slip` action to the hard-talk rules card.
- The generated draft helps the user come back to a missed agreement without turning the missed agreement into a second fight.
- It includes the pause phrase, repair window, topic boundary, an ownership line, and a smaller-version option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/conversation-agreement-draft.test.ts` passed, 5 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard proof:
    - filled `Pause phrase` with `yellow light`,
    - filled `Repair window` with `before sleep`,
    - filled `Do not mix in` with `old arguments`,
    - clicked `Repair agreement slip`,
    - landed at `http://localhost:9941/chat` with the expected agreement-repair draft.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:39:03Z - Mid-run checkpoint after latest relationship workflows

- Re-ran focused coverage across the latest slices:
  - emotional reset,
  - `After yes`,
  - `Both true`,
  - repair landing check,
  - agreement slip repair.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts src/routes/_authenticated/-components/conversation-agreement-draft.test.ts src/routes/_authenticated/-components/chat/after-yes-draft.test.ts src/routes/_authenticated/-components/chat/both-true-draft.test.ts src/routes/_authenticated/-components/insights/emotion-actions.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
## 2026-05-05T06:41:24Z - Communication insight draft is now a habit, not a chart comment

- Strengthened the `/insights` communication action drafts:
  - if the user carries the conversation, the draft asks to make room and own answering before asking follow-ups;
  - if the partner carries the conversation, the draft owns passive follow-up behavior and asks what to follow up on;
  - if balance is good, the draft protects the rhythm before either partner feels alone with tracking.
- All variants now include warmth and a smaller/later option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/communication-actions.test.ts` passed, 6 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/insights?tab=communication` -> `Open in chat` landed at `/chat` with:
    - `I care about protecting that balance before either of us starts feeling alone with the tracking.`
    - `Could we choose one check-in question for this week, or pick a smaller version later if now is not a good time?`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:44:43Z - Care manual has a repair path when the user misses it

- Added `Repair miss` to the profile care-manual card.
- The generated draft helps the user repair a moment where they missed what helps their partner:
  - no defensiveness,
  - explicit warmth,
  - an ownership line,
  - what they tried,
  - how it may have landed,
  - the first signal to watch next time,
  - a later/smaller repair option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/care-instructions-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 23 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/profile` -> `Repair miss` landed at `/chat` with `I care about getting this right because I want hard moments to feel safer for both of us.`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:45:27Z - Broad suite checkpoint

- Ran the broader local verification suite after the communication and care-manual additions.
- Verification:
  - `pnpm test` passed, 47 files / 200 tests.
  - `pnpm build` passed.
  - Build still reports the known non-blocking `apps/web/src/server/connections.ts` dynamic/static import chunking warning.
## 2026-05-05T06:49:31Z - Micro-date plans can be rescheduled without rejection

- Added `Reschedule kindly` to the dashboard micro-date card.
- The generated draft keeps the connection bid alive while removing pressure:
  - names that the user still wants connection,
  - adds explicit warmth,
  - asks for a smaller version or another time,
  - proposes a 10-minute fallback,
  - asks whether another version would feel better.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/micro-date-plan.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 20 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> `Reschedule kindly` landed at `/chat` with `I care about us keeping this warm and doable, even if the original plan needs to change.`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T06:51:36Z - Daily connection question drafts pass care intent

- Strengthened the dashboard question-of-the-day chat drafts so they include explicit care and timing flexibility across:
  - hard mood support,
  - low-score repair,
  - partner-interest curiosity,
  - positive connection reflection.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-connection-question.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> `Question of the day` -> `Ask in chat` landed at `/chat` with:
    - `I care about understanding you before I try to fix anything.`
    - `If now is not a good time, could we choose a smaller moment later today?`
  - The body did not show `Add warmth` or `Add choice`; `errors list` reported no browser errors.
## 2026-05-05T06:53:59Z - Daily care plan drafts now leave room for capacity

- Strengthened dashboard care-plan chat drafts across hard mood, repair, love-language, interest, and generic promise branches.
- Added explicit care and smaller/later options so care suggestions do not become pressure.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-care-plan.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 20 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> care plan `Draft message` landed at `/chat` with:
    - `One thing I appreciate about you is ____.`
    - `One part I can own is ____.`
    - `Could we take 10 minutes to talk about what felt heavy for you, or choose a smaller moment later today if now is too much?`
  - The body did not show `Add warmth` or `Add choice`; `errors list` reported no browser errors.
## 2026-05-05T06:58:19Z - Practice deck includes visible follow-through

- Added `Close the loop` to the dashboard practice deck.
- The new practice helps the user make follow-through visible after a promise, repair, or plan:
  - what they said they would do,
  - what they actually did,
  - what still needs adjustment,
  - whether the follow-through felt visible,
  - a later-today option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/relationship-practice-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 16 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> `Close the loop` -> `Draft follow-through` landed at `/chat` with `I care about making follow-through visible instead of making you guess.`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:01:33Z - Active goals can notice progress before completion

- Added `Notice progress` to the dashboard active-goal actions.
- The draft helps couples reinforce effort before the goal is finished:
  - names the active goal,
  - names the goal description,
  - says `I care about us making effort visible`,
  - asks what each person is trying,
  - chooses the next smallest step or a smaller version.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 27 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> `Goals` -> `Notice progress` landed at `/chat` with the expected progress-appreciation draft.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:04:11Z - Discovery actions are less transactional

- Strengthened discovery drafts for wishes, important dates, shared interests, partner-only interests, and fallback curiosity.
- Reused the stronger direct draft builders inside the main discovery move so the top-card action and row actions stay consistent.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/discovery-actions.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 22 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/insights?tab=discoveries` -> `Open in chat` landed at `/chat` with:
    - `I care about honoring it in a way that feels thoughtful, not like another task.`
    - `Could we choose one small, realistic way to honor it this week, or pick a smaller version later if now is not a good time?`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:04:50Z - Focused checkpoint after habit/action upgrades

- Re-ran focused coverage for:
  - goal progress,
  - practice follow-through,
  - discovery actions,
  - daily care plan,
  - daily connection question,
  - draft care checks.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts src/routes/_authenticated/-components/relationship-practice-draft.test.ts src/routes/_authenticated/-components/insights/discovery-actions.test.ts src/routes/_authenticated/-components/daily-care-plan.test.ts src/routes/_authenticated/-components/daily-connection-question.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 43 tests.
  - `pnpm check-types` passed.
## 2026-05-05T07:07:10Z - Hot-moment pauses have a return script

- Added `Return script` to the dashboard hot-moment reset card.
- The return draft helps the user prove the pause was not abandonment:
  - thanks the partner for room to cool down,
  - names what was happening internally before the pause,
  - starts with one thing understood from the partner,
  - names one owned part before explaining,
  - asks whether to continue now, take a smaller next step, or choose another time.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/hot-moment-reset-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` dashboard -> `Hot moment` -> `Return script` landed at `/chat` with:
    - `I am back after the 20 minutes pause.`
    - `One thing I understood from you is: ____.`
    - `One thing I want to own before I explain my side is: ____.`
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:11:17Z - Aftercare drafts now close hard talks instead of dropping them

- Strengthened the chat aftercare action so a hard draft can become a clear closing structure:
  - one thing each person understood,
  - one repair or reassurance needed tonight,
  - one tiny next step for the next 24 hours,
  - a smaller/later option when the full structure is too much.
- Kept normal source drafts readable while capping long pasted drafts so the output stays usable.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/aftercare-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat` -> `Turn this into a small aftercare plan` produced the expected aftercare structure with the original source draft intact.
  - The body did not show `Add warmth` or `Add choice`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:14:40Z - Apologies now require changed behavior

- Strengthened the apology builder so apologies are not only better phrasing:
  - names the specific moment,
  - states the visible impact,
  - owns the behavior without explaining it away,
  - includes a changed-behavior line,
  - explicitly removes pressure to reassure or forgive quickly.
- Updated the repair-choice apology path to expect the same stronger structure.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/apology-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/repair-choice-draft.test.ts` passed, 21 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat` -> `Apology guide` -> `Build apology` produced the changed-behavior apology draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:16:40Z - Follow-ups check impact without fishing for reassurance

- Strengthened the chat follow-up action so it checks how a message landed while lowering pressure:
  - says the user cares about understanding,
  - explicitly says they are not asking for reassurance,
  - keeps only the first topic sentence from the original draft,
  - offers to come back later if now is not a good time.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/follow-up-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat?proof=followup-care-20260505` -> `Prepare a follow-up that checks how this landed` produced the revised draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:18:47Z - Health-score repair prompts are safer and more concrete

- Strengthened the coach sidebar health-score drafts:
  - low scores now ask for one heavy thing, one owned part, and one repair that would actually help,
  - low scores explicitly avoid turning the score into pressure,
  - steady scores now offer a tiny fallback if a full check-in is too much.
- Strengthened the insights overview repair and conflict chat drafts with warmth and smaller/later options.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/ai-sidebar.test.ts src/routes/_authenticated/-components/insights/overview-tab.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 22 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat?proof=health-repair-draft` -> coach sidebar `Draft repair check-in` produced the strengthened repair draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:20:41Z - Dashboard repair guide uses the same stronger repair shape

- Extracted the dashboard relationship-move repair draft into a tested helper.
- Upgraded the guide draft so `Use this in chat` now includes:
  - warmth and safety,
  - one appreciation,
  - one owned part,
  - a question about what repair would actually help,
  - a smaller/later option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/relationship-move-card.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 16 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/dashboard?proof=relationship-repair-guide` -> `Start repair guide` -> `Use this in chat` landed at `/chat` with the strengthened repair draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:24:17Z - Pause requests now include return safety

- Strengthened `Turn this into a 20-minute pause request` so it does not feel like disappearance:
  - says the user cares about coming back kinder,
  - names the topic without preserving global blame,
  - asks for a 20-minute pause,
  - offers another clear return time if that does not work.
- Added blame softening for heated phrases like `you never listen to me`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/pause-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=pause-return-plan-v2` transformed `Hey, you never listen to me...` into a pause request with `I felt unheard` and a clear return-time fallback.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:27:27Z - Need requests stay flexible even with user-entered wording

- Strengthened the need builder so requests do not become demands:
  - adds a warmth line about finding a version that works for both people,
  - grounds the request in `this week`,
  - turns blank flexibility into a smaller-version fallback,
  - appends a smaller/later option when the user-entered flexibility line is too vague.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/need-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 17 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=need-flexibility-v2` -> `Need guide` -> `Build need` produced the revised request draft with an appended smaller/another-time option.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:30:20Z - Core repair builder clears care checks on its own

- Strengthened `Repair guide` output:
  - adds a warmth line about staying on the same team,
  - adds a specific-moment line when the user does not provide one,
  - keeps ownership and need fields,
  - appends a smaller/another-time option after the request.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/repair-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 17 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=repair-guide-core-v2` -> `Repair guide` -> `Build repair` produced the strengthened repair draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:31:55Z - Appreciation invitations stay low-pressure

- Strengthened `Appreciation guide` output:
  - grounds appreciation in today,
  - adds a warmth line about noticing what helps the relationship feel close,
  - keeps the specific appreciation fields,
  - adds a smaller/another-time option when the appreciation includes an invitation.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/appreciation-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 17 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=appreciation-guide-care` -> `Appreciation guide` -> `Build appreciation` produced the strengthened appreciation draft.
  - The body did not show `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:34:38Z - Conflict and space guides include smaller/return alternatives

- Strengthened `Conflict map` output with a today anchor and a smaller/another-time fallback.
- Strengthened `Space guide` output with another-clear-return-time fallback after the pause request.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/conflict-map-draft.test.ts src/routes/_authenticated/-components/chat/space-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=conflict-space-care` -> `Conflict map` -> `Build conflict map` produced the revised conflict draft.
  - cmux browser `surface:174` `/chat?proof=conflict-space-care` -> `Space guide` -> `Build space request` produced the revised space draft.
  - Both live drafts showed no `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:38:12Z - Missed bids and listening replies reduce pressure

- Strengthened `Missed bid` output:
  - anchors the missed moment in today,
  - adds care about turning toward the partner,
  - avoids making the partner prove the moment mattered,
  - adds a smaller/another-time option.
- Strengthened `Listen first` output:
  - anchors the reply in today,
  - adds care about understanding instead of defending,
  - offers to listen first and ask later if a question is too much.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/bid-repair-draft.test.ts src/routes/_authenticated/-components/chat/listen-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - cmux browser `surface:174` `/chat?proof=bid-listen-care` -> `Missed bid` -> `Build missed-bid repair` produced the revised missed-bid draft.
  - cmux browser `surface:174` `/chat?proof=bid-listen-care` -> `Listen first` -> `Build listening reply` produced the revised listening draft.
  - Both live drafts showed no `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:41:02Z - Reassurance and longing stay vulnerable without pressure

- Strengthened `Reassure` starter output with a smaller/another-time option.
- Strengthened `Longing` guide output:
  - anchors the longing in today,
  - adds care about staying connected,
  - keeps the complaint-to-longing structure,
  - adds a smaller/another-time option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/longing-draft.test.ts src/routes/_authenticated/-components/chat/reassurance-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=longing-reassurance-care` -> `Reassure` produced the revised reassurance draft.
  - cmux browser `surface:174` `/chat?proof=longing-reassurance-care` -> `Longing` -> `Build longing request` produced the revised longing draft.
  - Both live drafts showed no `Add warmth`, `Add choice`, or `Add moment`; `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:43:07Z - Broad test checkpoint after chat guide hardening

- Ran the full repo test suite after updating the chat guide family.
- First run found one stale assertion in `repair-choice-draft.test.ts` for the stronger listening draft.
- Updated that assertion and reran the suite.
- Verification:
  - `pnpm test` passed: 49 files, 206 tests.
  - `git diff --check` passed before the checkpoint.
## 2026-05-05T07:44:28Z - Coach review prompts enforce care-check criteria

- Strengthened `Ask coach to improve this draft` prompts so the AI is asked to preserve truth while also:
  - naming one real moment,
  - including warmth,
  - leaving room for no or later,
  - keeping the request clear.
- Lowered the draft excerpt cap so the stronger instruction stays under the prompt-size test threshold.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/coach-review-prompt.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
## 2026-05-05T07:45:46Z - Cross-builder care-check regression guard

- Added a regression test that runs representative guided chat drafts through `getDraftCareChecks`.
- Covered aftercare, apology, appreciation, missed bid, conflict map, follow-up, listen first, longing, need, pause, reassurance, repair, and space.
- This protects the core chat helper family from silently reintroducing drafts that trigger `Add warmth`, `Add choice`, or `Add moment`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 16 tests.
  - `pnpm check-types` passed.
## 2026-05-05T07:48:43Z - Composer shows when a draft is ready

- Added a `Ready to send` badge to the local draft check when every care check passes.
- This makes the composer reward safer drafts instead of only showing repair buttons when something is missing.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 16 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=ready-to-send-badge` with a care-ready draft showed `Ready to send` plus all five `OK` checks and no `Add warmth`, `Add choice`, or `Add moment`.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:52:31Z - Starter buttons are covered by the care regression guard

- Expanded the cross-builder care regression guard to cover fast starter drafts:
  - `After yes`,
  - `Before advice`,
  - `Both true`,
  - `Redo message`,
  - `Respect no`,
  - `No reply`,
  - `Break silence`.
- The guard exposed missing care-check coverage in `Before advice`, `Redo message`, `No reply`, and `Break silence`; those starters now include the missing specific moment, warmth, or smaller/later option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts src/routes/_authenticated/-components/chat/silence-repair-draft.test.ts src/routes/_authenticated/-components/chat/redo-message-draft.test.ts src/routes/_authenticated/-components/chat/before-advice-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 24 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=starter-care-guard` -> `No reply` showed `Ready to send` plus all five `OK` checks and no care-fix buttons.
  - cmux browser `surface:174` `/chat?proof=starter-care-guard` -> `Redo message` showed `Ready to send` plus all five `OK` checks and no care-fix buttons.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:53:08Z - Full suite green after starter regression expansion

- Re-ran the full suite after expanding the cross-builder guard and hardening the exposed starters.
- Verification:
  - `pnpm test` passed: 50 files, 207 tests.
## 2026-05-05T07:56:08Z - Goal chat drafts now have care-check coverage

- Added a goal-draft regression that runs representative goal chat drafts through `getDraftCareChecks`.
- Strengthened goal drafts exposed by the guard:
  - completed-goal celebration now includes warmth about noticing what worked,
  - renegotiation includes care and an explicit smaller alternative,
  - midweek check-ins include care about adjusting before pressure builds,
  - today actions include warmth and an even-smaller fallback,
  - support plans include care and a smaller support plan option,
  - care-swap and changed-behavior apology invites include warmth and fallback choices,
  - goal-slip repair includes warmth and another smaller/another-time option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-goal-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 28 tests.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
## 2026-05-05T07:58:02Z - Live goal action clears care checks

- Verified a dashboard goal action through the real browser flow after strengthening goal drafts.
- Verification:
  - cmux browser `surface:174` `/dashboard?proof=goal-draft-care` -> active goal `Do today` landed at `/chat`.
  - The generated draft included `I care about making progress visible without turning this into pressure` and `If that does not work, could we choose an even smaller version?`
  - The composer showed `Ready to send` plus all five `OK` checks and no `Add warmth`, `Add choice`, or `Add moment`.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T07:59:53Z - Build checkpoint after goal draft hardening

- Re-ran the production build after adding the goal draft care regression and live goal-action verification.
- Verification:
  - `git diff --check` passed.
  - `pnpm build` passed for both Turbo tasks.
  - Known non-blocking Vite warning remained: `apps/web/src/server/connections.ts` is both dynamically and statically imported by authenticated routes, so dynamic import will not move it into another chunk.
## 2026-05-05T08:02:56Z - Dashboard insight actions are composer-ready

- Extended the draft care-check guard to dashboard insight actions and coaching insight actions.
- Strengthened those drafts so hard insight cards do not ask for repair without warmth, today-level specificity, and a smaller/later option.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insight-action-draft.test.ts src/routes/_authenticated/-components/insights/coaching-actions.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 26 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/dashboard` -> insight `Turn into a repair message` landed in `/chat` with `Ready to send` plus all five `OK` checks and no care-fix buttons.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:05:20Z - Insights overview and emotion drafts are care-checked

- Extended the care-check standard to the overview action plan and emotion reset drafts.
- Strengthened fallback and tiny-practice overview drafts so they include warmth, a concrete time anchor, and a smaller/later option.
- Strengthened emotional reset drafts so hard mood/sentiment actions invite repair without pressure.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/overview-tab.test.ts src/routes/_authenticated/-components/insights/emotion-actions.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 25 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/insights?tab=overview` -> `Draft repair message` landed in `/chat` with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:11:07Z - Daily check-in support no longer creates pressure drafts

- Added care-check coverage to daily care plans, micro-date plans, and the daily check-in support helper family.
- The first live cmux check exposed `Make tonight plan` still producing `Add warmth` and `Add choice`; traced it to `buildTonightPlanDraft` in `daily-checkin-support.ts`.
- Strengthened daily check-in drafts, support follow-ups, support thanks, landing checks, reciprocal support, partner support responses, and check-in rhythm drafts so they include concrete time context, warmth, clear asks, and smaller/later options.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-care-plan.test.ts src/routes/_authenticated/-components/micro-date-plan.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 25 tests.
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/daily-checkin-support.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 33 tests.
  - `pnpm check-types` passed after the changes.
  - cmux browser `surface:174` `/dashboard` -> daily check-in `Make tonight plan` first reproduced `Add warmth` / `Add choice`, then after the fix landed in `/chat` with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:13:33Z - Stress-state scripts are care-checked

- Added care-check coverage to hot-moment pause/return scripts, weekly reset drafts, and close-the-loop practice drafts.
- Strengthened hot-moment pause requests with an explicit smaller-pause/another-time option.
- Strengthened weekly reset drafts with warmth, no-scorecard framing, and smaller/later choices.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/hot-moment-reset-draft.test.ts src/routes/_authenticated/-components/weekly-reset-draft.test.ts src/routes/_authenticated/-components/relationship-practice-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 25 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/dashboard` -> `Send pause request` landed in `/chat` with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:16:14Z - Profile care instructions are composer-ready

- Added care-check coverage to profile action drafts and care-instruction/manual drafts.
- Strengthened love-language, communication-style, interest, profile-bridge, care manual, avoidance, overwhelm-signal, and share-my-care drafts with warmth and smaller/later options.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/profile-action-draft.test.ts src/routes/_authenticated/-components/care-instructions-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 28 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/profile` -> `Ask in chat` landed in `/chat` with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:21:21Z - Insight-to-repair flows are care-checked

- Added care-check coverage to discovery actions, communication actions, conversation agreements, and repair debrief drafts.
- Strengthened important-date and partner-interest drafts with time anchors, agreement drafts with smaller/later options, and repair debriefs with warmth.
- The live dashboard `Check if landed` flow exposed a blank-note case that still needed `Add moment`; the blank fallback now says what was understood/followed through `today`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/insights/discovery-actions.test.ts src/routes/_authenticated/-components/insights/communication-actions.test.ts src/routes/_authenticated/-components/conversation-agreement-draft.test.ts src/routes/_authenticated/-components/repair-debrief-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 40 tests.
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/repair-debrief-draft.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts` passed, 21 tests after the blank-note regression was added.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/dashboard` -> repair debrief `Check if landed` first reproduced `Add moment`, then after the fix landed in `/chat` with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:21:59Z - Broad regression checkpoint

- Ran the full test suite after the expanded care-check guard coverage.
- Verification:
  - `git diff --check` passed.
  - `pnpm test` passed: 50 test files, 214 tests.
## 2026-05-05T08:26:01Z - One-click draft repair works

- Added `Make ready` to the local draft check so a rough draft can be repaired in one click instead of requiring several individual buttons.
- Fixed `Add ownership` so it no longer preserves global-blame wording inside the rewritten draft.
- Fixed `Add moment` so it inserts a phrase the checker actually recognizes as specific: `When ____ happened today...`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=make-ready`, draft `You never care when plans change` -> `Make ready` rewrote it into a repair-oriented message with `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:28:16Z - Default starter chips are ready by default

- Upgraded the built-in composer starter chips for appreciation, check-in, repair, needs, and ownership so they already include warmth, specificity, clear asks, and room for later.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts` passed, 18 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=starter-ready-defaults` -> `Appreciate` showed `Ready to send` plus all five `OK` checks.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:30:29Z - Starter chip regression is now durable

- Moved composer starter chip drafts into `starter-drafts.ts`.
- Added a regression test that every starter chip passes the local draft care check.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/starter-drafts.test.ts src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
## 2026-05-05T08:31:07Z - Production build checkpoint after composer upgrade

- Re-ran the production build after the `Make ready` and starter-draft module changes.
- Verification:
  - `git diff --check` passed.
  - `pnpm build` passed for both Turbo tasks.
  - Known non-blocking Vite warning remained: `apps/web/src/server/connections.ts` is both dynamically and statically imported by authenticated routes, so dynamic import will not move it into another chunk.
## 2026-05-05T08:38:16Z - Composer send path now enforces repair

- Closed the remaining bypass where `Send` could still submit a draft that failed the local care check.
- The first send attempt on an unready draft now repairs the text locally and keeps focus in the composer; only a draft that passes all five checks gets the normal `Send` action.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/chat/starter-drafts.test.ts src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts` passed, 19 tests.
  - `pnpm check-types` passed.
  - cmux browser `surface:174` `/chat?proof=send-guard`, draft `You never care when plans change` -> `Fix before send` rewrote the draft into a repair-oriented message and changed the primary action back to `Send`.
  - `cmux browser surface:174 errors list` reported no browser errors.
## 2026-05-05T08:39:56Z - Send guard has a pure regression contract

- Extracted the send readiness decision into `prepareDraftForSend`.
- This keeps the composer behavior explicit: blank drafts stay unsendable, ready drafts pass through unchanged, and unready drafts return a repaired draft with `ready: false`.
- Verification:
  - `pnpm --filter @amore-couples/web test src/routes/_authenticated/-components/chat/draft-care-check.test.ts src/routes/_authenticated/-components/chat/starter-drafts.test.ts src/routes/_authenticated/-components/chat/chat-draft-care-regression.test.ts` passed, 22 tests.
  - `pnpm check-types` passed.
## 2026-05-05T10:41:50Z - Final validation after 10-hour floor

- The long-run tracker was interrupted by the user at 35,799 seconds and moved to `paused`.
- Added an explicit 220-second wall-clock buffer before final validation, clearing the 36,000-second floor without relying on the paused counter.
- Verification:
  - `lsof -nP -iTCP:9941 -sTCP:LISTEN` confirmed the local app server is listening on port `9941`.
  - cmux browser `surface:174` on `http://localhost:9941` showed authenticated UI with `Sign Out` and couple `Jaluza`.
  - `pnpm check-types` passed.
  - `git diff --check` passed.
  - `pnpm test` passed: 51 test files, 220 tests.
  - `pnpm build` passed: 2 successful Turbo tasks.
  - cmux browser route checks on `Dashboard`, `Chat`, `Goals`, `Insights`, and `Profile` rendered authenticated content with `cmux browser surface:174 errors list` reporting no browser errors.
  - cmux browser composer check on `Chat`: draft `You never care when plans change` showed `Fix before send`, rewrote into a repair-oriented message, and changed back to `Send`.
