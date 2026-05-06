# TICKET-002: Onboarding Funnel — Reduce Time-to-Value

## Priority: P0 — Critical

## Problem Statement

The current onboarding path requires 8-10 sequential steps across TWO people before anyone sees a single health score:

1. **Signup** (`/signup`) — email, name, password
2. **Setup** (`/_authenticated/setup`) — display name entry (currently skippable since signup already collects name)
3. **Connect** (`/_authenticated/connect`) — enter partner's email, send connection request
4. **PARTNER DEPENDENCY: Partner signs up** — partner must create their own account
5. **PARTNER DEPENDENCY: Partner accepts** — partner must navigate to `/connect` and click Accept
6. **WhatsApp setup** (`/_authenticated/whatsapp`) — click "Connect WhatsApp"
7. **QR scan** — open WhatsApp on phone, go to Settings > Linked Devices, scan QR
8. **Wait for Baileys** — Baileys syncs history (seconds to minutes depending on message volume)
9. **Select contact** — pick partner from contact list
10. **Wait for first analysis** — either 50 messages accumulate (`ANALYSIS_THRESHOLD` in `apps/wa-bridge/src/analysis/trigger.ts`) or user triggers manual analysis (dashboard "Analyze" button calls `triggerAnalysis` in `apps/web/src/server/intelligence.ts`)

**The partner dependency (steps 4-5) is the funnel killer.** Person A signs up, sends an email invite via `searchAndSendRequest` (`apps/web/src/server/connections.ts`), and then sees the `SoloWelcome` component (`apps/web/src/routes/_authenticated/dashboard.tsx:36-137`) — a static page with a heart icon and "Connect with your partner" CTA. There is zero value delivered. Person B receives no notification (TICKET-001 not yet implemented), may not have the app, and may not act for days. By the time Person B signs up, Person A has forgotten the app exists.

**Current solo experience is empty.** The authenticated layout (`apps/web/src/routes/_authenticated.tsx:42-67`) checks `getMyCouple()` and sets `hasCouple` in context. When `hasCouple` is false:
- Dashboard shows `SoloWelcome` — just a heart icon, welcome text, and "Connect with your partner" link
- Coach sidebar is disabled (`onCoachToggle` is `undefined` when `!hasCouple`, line 101)
- No intelligence data loads (dashboard loader returns early at line 22-24)
- The entire platform is inert

**WhatsApp setup has its own friction.** Even after partner connection, users must: understand what linking a device means, have their phone nearby, navigate WhatsApp settings, scan a QR code, wait for Baileys to sync, then pick the right contact from a potentially long list (filtered by `filteredContacts` in `apps/web/src/routes/_authenticated/whatsapp.tsx:182-196`). Each of these is a drop-off point.

**The OnboardingCard** (`apps/web/src/routes/_authenticated/-components/onboarding-card.tsx`) only appears AFTER the couple + WhatsApp connection is done — it tracks sync/analyze/insights steps, but misses the entire pre-connection funnel where most users drop off.

## Goals & Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to first value | <2 minutes from signup | Measure time from `users.created_at` to first coach interaction or chat export analysis completion |
| Solo user retention (Day 1) | >60% return rate without partner connected | Track auth session creation within 24h for users where `getMyCouple()` returns null |
| Partner connection rate | >50% of invited partners connect within 48h | Compare `connection_requests.created_at` to `couples.created_at` for accepted requests |
| Chat export analysis adoption | >30% of new users upload a chat export in first session | Track `chat_exports` table entries within 24h of `users.created_at` |
| Onboarding completion rate | >40% of signups reach first health score within 7 days | Measure `health_score_history` first entry relative to `users.created_at` |
| Coach engagement (solo) | >20% of solo users interact with coach in first session | Track `coach_messages` with role='user' for users without a couple |

## User Stories

**As a new user**, I want to talk to the AI coach immediately after signup, so that I can get relationship advice and understand the platform's value before committing to the full setup.

**As a new user**, I want to upload a WhatsApp chat export (.txt) and see a health score and insights, so that I experience the core product without needing my partner to sign up or connecting WhatsApp live.

**As a solo user waiting for my partner**, I want the dashboard to show useful content (coach prompts, relationship tips, sample insights), so that I have a reason to come back before my partner accepts.

**As a user who uploaded a chat export**, I want my analysis to carry over when I eventually connect WhatsApp live, so that I don't lose the insights I already generated.

**As a new user**, I want a clear, minimal onboarding flow that lets me choose my path (explore first vs. full setup), so that I'm not blocked by a linear wizard.

**As a returning solo user**, I want to see progress indicators showing what I'll unlock by connecting my partner, so that I'm motivated to complete the connection flow.

## Technical Design

### Architecture Overview

```
Current Flow (linear, blocking):
  Signup -> Setup -> Connect -> [BLOCKED: wait for partner] -> WhatsApp -> [BLOCKED: QR] -> Wait -> Score

New Flow (progressive, value-first):
  Signup -> Choose Path:
    |
    +-- Path A: "Try the Coach" (instant value)
    |     Solo coach enabled -> explore freely -> connect partner when ready
    |
    +-- Path B: "Analyze a Conversation" (fast value)
    |     Upload .txt export -> parse -> analyze -> health score in <30s
    |     -> explore insights -> connect partner when ready
    |
    +-- Path C: "Full Setup" (existing flow, streamlined)
          Connect partner -> WhatsApp -> score

  All paths converge: connect partner + WhatsApp when ready (not required upfront)
```

### Implementation Phases

#### Phase 1: Solo Coach Access (S — ~2-3 days)

Remove the partner-connection gate on the AI coach. Let solo users talk to the coach immediately after signup, with a general relationship coaching persona (no couple-specific context yet).

**What to build:**

1. **Enable coach for solo users** — modify `apps/web/src/routes/_authenticated.tsx`
   - Remove the `hasCouple` guard on `onCoachToggle` (line 101): change from `hasCouple ? () => setCoachOpen((open) => !open) : undefined` to always pass the toggle function
   - Remove the `hasCouple &&` gate on CoachSidebar rendering (lines 110-141)
   - The floating coach button on mobile (lines 128-141) should always render

2. **Solo coach thread support** — modify `apps/web/src/server/coach.ts`
   - `getOrCreateThread` currently calls `requireCouple()`. Add a `getOrCreateSoloThread` variant that uses only `userId` (no `coupleId`). Store with `coupleId = null` in the `coach_threads` table.
   - `listThreads`, `getThreadMessages`, `deleteThread` — add solo-user fallback paths that query by `userId` when no couple exists
   - `saveCoachExchange` — when no couple, skip couple-specific context in the exchange persistence
   - `getCoachNudges` — return empty array for solo users (nudges require analysis data)
   - `getCoachStarter` — generate solo-appropriate starters ("Tell me about your relationship", "What communication challenges are you facing?") instead of data-driven starters

3. **Solo coach context** — modify `packages/ai/src/coach-conversation.ts`
   - `streamCoachResponse` takes a `CoachContext` with `healthScore`, `recentInsights`, etc. For solo users, pass a minimal context with nulls/empty arrays.
   - Add a solo-mode system prompt variant: instead of "You have access to this couple's data...", use "This user is exploring relationship coaching. You don't have conversation data yet — focus on general guidance, active listening, and helping them articulate their relationship dynamics."
   - `classifyIntent` and `extractCoachMemory` work unchanged (text-only operations)

4. **Schema change** — modify `packages/db/src/schema.ts`
   - Make `coach_threads.coupleId` nullable: change from `.notNull()` to allow null
   - Add `coach_threads.userId` column (text, references `users.id`) for solo thread ownership
   - Add index on `coach_threads.userId`

5. **Dashboard solo state** — modify `apps/web/src/routes/_authenticated/dashboard.tsx`
   - Replace `SoloWelcome` component with `SoloOnboarding` that shows:
     - A coach CTA card: "Talk to your relationship coach" with a button that opens the coach sidebar
     - A chat export CTA card: "Already have WhatsApp chats? Upload and get instant insights" (Phase 2 hook — disabled until Phase 2, shown as "Coming soon")
     - The existing partner connection CTA (keep but deprioritize visually)
     - Pending connection requests (keep existing prominent display)

**Key files to modify:**
- `apps/web/src/routes/_authenticated.tsx` — remove `hasCouple` gates on coach
- `apps/web/src/server/coach.ts` — solo thread CRUD
- `packages/ai/src/coach-conversation.ts` — solo context/prompt variant
- `packages/db/src/schema.ts` — nullable `coupleId` on `coach_threads`, add `userId`
- `apps/web/src/routes/_authenticated/dashboard.tsx` — new `SoloOnboarding` component
- `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx` — handle missing couple gracefully

**Database migration:**
```sql
ALTER TABLE coach_threads ALTER COLUMN couple_id DROP NOT NULL;
ALTER TABLE coach_threads ADD COLUMN user_id TEXT REFERENCES users(id);
CREATE INDEX coach_threads_user_idx ON coach_threads(user_id);
-- Backfill existing threads: set user_id from couples table
UPDATE coach_threads ct SET user_id = (
  SELECT user_a_id FROM couples WHERE id = ct.couple_id
) WHERE user_id IS NULL;
```

#### Phase 2: Chat Export Upload & Instant Analysis (M — ~4-5 days)

Let users upload a WhatsApp `.txt` chat export, parse it, run the analysis pipeline, and show a health score + insights — all without WhatsApp live connection or partner signup.

**What to build:**

1. **Chat export parser** — new file `packages/ai/src/parse-export.ts`
   - Parse WhatsApp's `.txt` export format: `[DD/MM/YYYY, HH:MM:SS] Sender: message` (also handle `MM/DD/YYYY` US format and 12h time)
   - Handle multi-line messages (continuation lines without timestamp prefix)
   - Handle media placeholders: `<Media omitted>`, `<image omitted>`, `<attached: filename>`
   - Handle system messages: "Messages and calls are end-to-end encrypted", "X changed the group description", etc. — skip these
   - Return `Array<{ timestamp: Date; sender: string; text: string; isMedia: boolean }>` matching the shape expected by `analyzeConversation` in `packages/ai/src/analyze.ts`
   - Sender normalization: detect the two unique senders, let user confirm which one is them

2. **Chat export upload endpoint** — new file `apps/web/src/server/chat-export.ts`
   - `uploadChatExport` server function: accepts file text content (string, not multipart — client reads file via FileReader), userId, and sender mapping
   - Creates a `chat_exports` row to track the upload
   - Persists parsed messages to the `messages` table with `source: 'export'` and a synthetic `coupleId` (solo couple — see schema changes)
   - Triggers `runAnalysisPipeline` from `packages/ai/src/orchestrate.ts` directly (no wa-bridge involvement)
   - Returns analysis results inline (health score, insights, summary) for immediate display
   - Size limit: 5MB text file, max 50,000 messages

3. **Solo couple concept** — modify `apps/web/src/server/connections.ts` and `packages/db/src/schema.ts`
   - When a user uploads a chat export without a partner, create a "solo couple" row in `couples` with `status: 'solo'`, `userAId = userId`, `userBId = userId` (self-reference)
   - This allows all existing couple-scoped queries (`insights`, `health_score_history`, `messages`) to work without modification
   - When a real partner connects later, migrate the solo couple's data to the real couple (Phase 3)
   - Add `couples.status` value `'solo'` alongside existing `'pending'` and `'active'`

4. **Upload UI** — new file `apps/web/src/routes/_authenticated/-components/chat-export-upload.tsx`
   - File picker accepting `.txt` and `.zip` (WhatsApp exports messages as `.txt` inside a `.zip`)
   - For `.zip`: extract `.txt` file client-side using a lightweight zip library (e.g., `fflate`)
   - Preview: show first 5 messages + total count + date range
   - Sender mapping: "Which of these senders is you?" with two buttons (one per detected sender name)
   - Progress states: uploading -> parsing -> analyzing -> done
   - On completion: redirect to dashboard where `CouplesDashboard` renders with health score from the solo couple

5. **Upload page route** — new file `apps/web/src/routes/_authenticated/upload.tsx`
   - Full-page upload experience with the `ChatExportUpload` component
   - Accessible from the `SoloOnboarding` dashboard card (Phase 1)
   - After successful analysis, redirect to dashboard

**Key files to create:**
- `packages/ai/src/parse-export.ts` — WhatsApp .txt parser
- `apps/web/src/server/chat-export.ts` — upload + analysis server functions
- `apps/web/src/routes/_authenticated/upload.tsx` — upload page
- `apps/web/src/routes/_authenticated/-components/chat-export-upload.tsx` — upload UI component

**Key files to modify:**
- `packages/db/src/schema.ts` — add `chat_exports` table, add `'solo'` status to couples
- `apps/web/src/routes/_authenticated/dashboard.tsx` — handle solo couple in `CouplesDashboard` (show insights but indicate they're from an export)
- `apps/web/src/routes/_authenticated/-components/onboarding-card.tsx` — add export-based path
- `apps/web/src/server/intelligence.ts` — `getIntelligence` must work for solo couples (the `requireCouple` helper needs a solo-couple path)

**Database changes:**

```sql
CREATE TABLE chat_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  couple_id UUID REFERENCES couples(id),
  filename VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  date_range_start TIMESTAMP,
  date_range_end TIMESTAMP,
  sender_names JSONB NOT NULL,          -- ["Alice", "Bob"]
  user_sender_name VARCHAR(255),        -- which sender is the uploading user
  status VARCHAR(20) NOT NULL DEFAULT 'processing',  -- processing, complete, failed
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX chat_exports_user_idx ON chat_exports(user_id);
```

#### Phase 3: Data Migration & Progressive Onboarding (S — ~2-3 days)

When a solo user eventually connects a real partner, migrate their solo couple data to the real couple and merge the export-based insights with live WhatsApp data.

**What to build:**

1. **Solo-to-real couple migration** — new file `apps/web/src/server/couple-migration.ts`
   - When `acceptConnectionRequest` creates a real couple (`apps/web/src/server/connections.ts:49-73`), check if either user has a solo couple
   - If a solo couple exists: migrate all rows referencing the solo `coupleId` to the new real `coupleId`:
     - `messages` — update `coupleId`
     - `insights` — update `coupleId`
     - `health_score_history` — update `coupleId`
     - `couple_entities` — update `coupleId`
     - `coach_threads` — update `coupleId` (solo threads become couple threads)
     - `coach_memory` — update `coupleId`
     - `chat_exports` — update `coupleId`
   - Delete the solo couple row after migration
   - Handle the `senderId` mapping: export messages have a synthetic sender ID (the solo user's ID for both senders). When the real partner connects, update partner messages to use the partner's real `userId` based on the `chat_exports.user_sender_name` mapping.

2. **Progressive onboarding tracker** — modify `apps/web/src/routes/_authenticated/-components/onboarding-card.tsx`
   - Expand the existing 3-step tracker (sync -> analyze -> insights) to cover the full journey:
     - Step 1: "Get your first insight" (done when health score exists from ANY source — export or live)
     - Step 2: "Connect with your partner" (done when `hasCouple && couple.status === 'active'`)
     - Step 3: "Connect WhatsApp" (done when `whatsappJid` is set)
     - Step 4: "Live insights" (done when analysis runs on live messages — `messages.source = 'baileys'` exists)
   - Show this tracker on the dashboard regardless of which onboarding path the user took
   - Each step shows what it unlocks: "Unlock live mood detection", "Unlock shared goals", etc.

3. **Streamline WhatsApp setup** — modify `apps/web/src/routes/_authenticated/whatsapp.tsx`
   - Add a "Why connect WhatsApp?" explainer section that lists benefits they don't have yet (live chat, mood detection, auto-analysis)
   - If user already has export-based insights, show them: "You're already seeing insights from your chat export. Connecting WhatsApp enables live monitoring."
   - Reduce the visual steps from 5 to 3 (the current "How it works" section at the bottom has unnecessary detail)

**Key files to create:**
- `apps/web/src/server/couple-migration.ts` — solo-to-real couple migration logic

**Key files to modify:**
- `apps/web/src/server/connections.ts` — trigger migration in `acceptConnectionRequest`
- `apps/web/src/routes/_authenticated/-components/onboarding-card.tsx` — progressive tracker
- `apps/web/src/routes/_authenticated/whatsapp.tsx` — "why connect" explainer
- `apps/web/src/server/intelligence.ts` — `requireCouple` helper needs to handle solo couples for `getIntelligence`

### Database Schema Changes

**New tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `chat_exports` | Track uploaded chat exports | userId, coupleId, filename, messageCount, dateRangeStart, dateRangeEnd, senderNames (JSONB), userSenderName, status |

**Modified tables:**

| Table | Change | Reason |
|-------|--------|--------|
| `coach_threads` | Add `userId TEXT REFERENCES users(id)`, make `coupleId` nullable | Solo coach access without a couple |
| `couples` | Allow `status = 'solo'` | Solo couple for export-based analysis |
| `messages` | `source` column already supports arbitrary values (`'baileys'` is default) — use `'export'` for uploaded messages | Distinguish live vs uploaded messages |

### API Endpoints

**New server functions (`apps/web/src/server/chat-export.ts`):**

| Function | Method | Description |
|----------|--------|-------------|
| `uploadChatExport` | POST | Accept parsed chat text, create solo couple if needed, persist messages, run analysis, return results |
| `getChatExports` | GET | List user's chat exports with status |

**Modified server functions:**

| Function | File | Change |
|----------|------|--------|
| `getOrCreateThread` | `apps/web/src/server/coach.ts` | Add solo-user path (no coupleId required) |
| `listThreads` | `apps/web/src/server/coach.ts` | Query by userId when no couple |
| `getCoachStarter` | `apps/web/src/server/coach.ts` | Solo-mode starters |
| `getIntelligence` | `apps/web/src/server/intelligence.ts` | Support solo couples |
| `acceptConnectionRequest` | `apps/web/src/server/connections.ts` | Trigger solo-to-real migration |

### Integration Points

- **`packages/ai/src/orchestrate.ts` — `runAnalysisPipeline`**: Already accepts `Message[]` and returns `AnalysisOutput`. Chat export flow calls this directly after parsing, bypassing wa-bridge entirely.
- **`packages/ai/src/analyze.ts` — `analyzeConversation`**: Accepts `Message[]` with `senderId` and `text`. Export parser must produce compatible objects. The `senderId` field will use the uploading user's ID for their messages and a synthetic ID for the partner.
- **`apps/web/src/lib/events.ts` — SSE**: No changes needed. Solo users don't receive couple events. Coach SSE (`/sse/coach`) already works per-request, not per-couple.
- **`apps/web/src/routes/_authenticated.tsx` — `beforeLoad`**: The solo couple path means `hasCouple` will return `true` for users with a solo couple. The `SoloOnboarding` dashboard should check `couple.status === 'solo'` to show appropriate UI.

## Acceptance Criteria

### Phase 1: Solo Coach Access
- [ ] AC-1.1: When a user signs up and lands on the dashboard without a partner connection, the coach sidebar toggle button is visible and functional in the Nav component (`apps/web/src/routes/_authenticated/-components/nav.tsx`) — clicking it opens the CoachSidebar.
- [ ] AC-1.2: A solo user (no couple) can create a coach thread by opening the sidebar and typing a message. The thread is persisted in `coach_threads` with `couple_id = NULL` and `user_id` set to the current user's ID.
- [ ] AC-1.3: The `streamCoachResponse` function in `packages/ai/src/coach-conversation.ts` produces a coherent response when called with a minimal `CoachContext` (all nulls/empty arrays) — no runtime errors, no "I don't have data" refusal.
- [ ] AC-1.4: Solo coach threads persist across sessions. A solo user who clears their browser, logs back in, and opens the coach sidebar sees their previous threads listed via `listThreads`.
- [ ] AC-1.5: When a solo user later connects with a partner (couple created), their solo coach threads become accessible in the couple's coach sidebar with full history preserved.
- [ ] AC-1.6: The solo dashboard (`SoloOnboarding` component) displays at minimum: (a) a coach CTA card with a button that opens the coach sidebar, (b) the existing partner connection/pending request UI, and (c) a placeholder for chat export upload (Phase 2).
- [ ] AC-1.7: The `coach_threads` table in `packages/db/src/schema.ts` has a nullable `couple_id` column and a `user_id` column with a foreign key to `users.id` and an index.
- [ ] AC-1.8: The solo coach system prompt does NOT reference couple-specific data (health score, patterns, etc.) — it provides general relationship coaching guidance.

### Phase 2: Chat Export Upload & Instant Analysis
- [ ] AC-2.1: When a user uploads a `.txt` WhatsApp chat export file on the `/upload` page, the system parses it and displays a health score within 60 seconds without requiring a WhatsApp QR connection or partner signup.
- [ ] AC-2.2: The WhatsApp export parser (`packages/ai/src/parse-export.ts`) correctly handles: (a) `DD/MM/YYYY, HH:MM:SS` format, (b) `MM/DD/YYYY, HH:MM:SS` format, (c) 12-hour time with AM/PM, (d) multi-line messages, (e) `<Media omitted>` placeholders, (f) system messages (skipped).
- [ ] AC-2.3: The upload UI shows a sender selection step: after parsing, the user sees both detected sender names and selects which one is them. This selection is stored in `chat_exports.user_sender_name`.
- [ ] AC-2.4: Uploaded messages are persisted in the `messages` table with `source = 'export'` and a valid `couple_id` referencing a solo couple with `status = 'solo'`.
- [ ] AC-2.5: After a successful chat export analysis, the dashboard renders the full `CouplesDashboard` (health score ring, insights, pattern cards) using the export-derived data — not the `SoloWelcome` empty state.
- [ ] AC-2.6: The `chat_exports` table exists in `packages/db/src/schema.ts` with columns: `id`, `user_id`, `couple_id`, `filename`, `message_count`, `date_range_start`, `date_range_end`, `sender_names` (JSONB), `user_sender_name`, `status`, `created_at`.
- [ ] AC-2.7: Upload rejects files larger than 5MB with a user-visible error message before sending to the server.
- [ ] AC-2.8: The upload page handles `.zip` files by extracting the `.txt` file inside (WhatsApp exports are often zipped).
- [ ] AC-2.9: The coach sidebar, when opened for a user with export-based data, has access to the export-derived `CoachContext` (health score, patterns, insights) — not the empty solo context from Phase 1.

### Phase 3: Data Migration & Progressive Onboarding
- [ ] AC-3.1: When a user with a solo couple accepts or receives a partner connection, all data (messages, insights, health_score_history, couple_entities, coach_threads, coach_memory) is migrated from the solo couple to the real couple. The solo couple row is deleted.
- [ ] AC-3.2: After migration, the partner's messages in the `messages` table have their `sender_id` updated from the solo user's ID to the real partner's user ID, based on the `chat_exports.user_sender_name` mapping.
- [ ] AC-3.3: The progressive onboarding tracker on the dashboard shows 4 steps (first insight, connect partner, connect WhatsApp, live insights) with accurate completion status based on actual data presence.
- [ ] AC-3.4: A user who uploaded a chat export, then connected a partner, then connected WhatsApp sees both export-derived and live insights on the dashboard without duplicates or data corruption.
- [ ] AC-3.5: The `/whatsapp` page shows a contextual explainer: if the user already has export-based insights, the page explains what live WhatsApp adds (mood detection, live chat, auto-analysis) rather than presenting it as the only way to get started.
- [ ] AC-3.6: The migration function (`apps/web/src/server/couple-migration.ts`) is idempotent — running it twice for the same user does not duplicate data or error.

## Edge Cases & Risks

### Chat Export Parsing
- **Non-standard formats**: Some Android/iOS versions produce slightly different export formats. The parser should be lenient — skip lines that don't match any known pattern rather than failing the entire import.
- **Group chat exports**: User might accidentally upload a group chat. Detect more than 2 unique senders and show an error: "This looks like a group chat. Please export a 1-on-1 conversation."
- **Empty/tiny exports**: Exports with <10 messages may produce unreliable analysis. Show a warning: "We found only N messages. Results may be limited. For better insights, export a conversation with at least 50 messages."
- **Encoding issues**: WhatsApp exports can be UTF-8 or UTF-16. Handle BOM markers and encoding detection.
- **Duplicate uploads**: If a user uploads the same export twice, detect via message deduplication (timestamp + sender + text hash) and skip duplicates.

### Solo Couple Data Model
- **`requireCouple()` callers**: Every server function that calls `requireCouple()` (`apps/web/src/server/require-couple.ts`) will now potentially return a solo couple. Callers that assume a real partner exists (e.g., `getPartnerProfile`, `getPartnerMood`) must handle `couple.status === 'solo'` gracefully — return null/empty rather than crash.
- **Coach memory scope**: Solo coach memory (`coach_memory` with a solo `coupleId`) migrates to the real couple. The memory content might reference "your partner" generically. This is acceptable — no action needed.
- **Concurrent migration**: If both users in a couple have solo couples with export data, the migration must merge both, not overwrite one. Handle by running migration for both solo couples sequentially within a transaction.

### Privacy & Security
- **Chat export content**: Uploaded chat text contains sensitive conversation data. It's already stored in the `messages` table (same as live Baileys messages) with the same `coupleId`-scoped access control. No additional privacy surface.
- **Sender impersonation**: A malicious user could upload a fabricated chat export. Since export data is clearly marked (`source = 'export'`), the UI can differentiate. Health scores from exports should be labeled "Based on uploaded chat" vs "Live analysis."

## Dependencies

- **No external dependencies on TICKET-001** (push notifications). These are independent — solo coach and chat export work without push. However, TICKET-001's notification for "partner accepted connection" would significantly improve the partner-dependency funnel.
- **`packages/ai` functions are already decoupled from wa-bridge**: `analyzeConversation` and `runAnalysisPipeline` accept plain `Message[]` arrays. No bridge-specific code to bypass.
- **Schema migration**: Phase 1 and 2 require `drizzle-kit push` for new columns/tables. Non-breaking changes (nullable column, new table, new index).
- **No new npm packages required for Phase 1**. Phase 2 needs `fflate` (lightweight zip extraction, ~8KB gzipped) for .zip support on the client.

## Estimated Scope

| Phase | Scope | Calendar Estimate | Key Risk |
|-------|-------|-------------------|----------|
| Phase 1: Solo Coach | S (small) | 2-3 days | Coach prompt quality for generic context |
| Phase 2: Chat Export | M (medium) | 4-5 days | WhatsApp export format edge cases |
| Phase 3: Migration | S (small) | 2-3 days | Data integrity during solo-to-real migration |
| **Total** | **M** | **8-11 days** | |

Phase 1 should ship first and independently — it has the highest value-to-effort ratio (coach access is the fastest path to perceived value). Phase 2 can follow. Phase 3 is required before Phase 2 is considered "complete" (export data must survive partner connection).

## Open Questions

1. **Should solo couples be visible in admin/debug tools?** The `couples` table will now contain `status = 'solo'` rows. Drizzle Studio queries and any future admin dashboard should filter or label these appropriately.

2. **What happens to export data if a user deletes their account?** Current cascade deletes on `users.id` would handle it, but the solo couple has `userAId = userBId = userId` — both references point to the same user, so cascade works. Verify this.

3. **Should we support re-analysis of the same export with updated AI models?** The `chat_exports` table tracks the upload, and the `insights` table stores results. Re-running analysis could be a future feature, but is out of scope for this ticket.

4. **Rate limiting on chat export uploads?** A user could abuse the analysis endpoint. Consider limiting to 3 exports per user per day to control Anthropic API costs.

5. **Should export-derived health scores appear in the `health_score_history` trend?** Currently yes (they share the same `coupleId`). When live analysis starts, the trend will include both export-based and live data points. This could create a visual discontinuity. Consider adding a `source` column to `health_score_history` to distinguish.
