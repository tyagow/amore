# WhatsApp Chat UI - Full Port Implementation Plan

## Overview

Port the complete WhatsApp chat interface from `../amore` to `amore-couples`, including real-time messaging, AI sidebar with suggestions/mood/coaching/review, and all supporting components. The backend infrastructure (WebSocket proxy, wa-bridge, message DB) already exists — this plan covers frontend hooks, components, server functions, and the chat route.

## Current State Analysis

### What Exists in amore-couples (READY)
- WebSocket proxy at `ws/chat` — authenticates, proxies to wa-bridge, handles `load-history`, `send`, forwards all events
- wa-bridge with full Baileys integration — send, receive, receipts, resync, contacts, session management
- `messages` table with `coupleId`, `waMessageId`, `senderId`, `text`, `timestamp`, `sentiment`, `isMedia`
- `couples` table with `healthScore`, `lastAnalyzed`, `messagesSinceAnalysis`, `whatsappJid`
- `userRelationshipProfiles` table (replaces amore's `partnerProfiles`) — `loveLanguages`, `communicationStyle`, `interests`
- `insights` table scoped to `coupleId`
- `moodStates` table with structured mood system
- `coupleGoals` table
- Dashboard data server function
- Session management UI at `/whatsapp`
- `requireCouple()` shared auth guard
- Design system: Tailwind v4, stone/rose palette, DM Sans/Serif fonts, no component library

### What's Missing (TO BUILD)
- `useChatWebSocket` hook
- `useChatAI` hook
- Chat server functions (`getChatAISuggestions`, `getChatAIMood`, `getChatAIReview`, `getChatRelationshipData`)
- All chat components: MessageBubble, MessageList, ChatInput, ChatHeader, StatusDot, DateDivider, AISidebar, ReviewPanel, MobileSidebarSheet, LoggedOutOverlay
- `/chat` route
- Nav link to chat

### Key Adaptations from amore
- `relationshipId` -> `coupleId` (amore-couples uses couples model)
- `verifyRelationshipOwnership` -> `requireCouple()` (cleaner guard)
- `partnerProfiles` table -> `userRelationshipProfiles` (dual entries per couple)
- `relationships` table -> `couples` table
- Keep amore-couples' existing mood system (structured moodStates, not inline mood string)
- Keep amore-couples' existing coaching system (insights-based, not inline coaching strings)

## What We're NOT Doing
- Media rendering (keep `[Media]` placeholder — media display is a separate effort)
- Auto-analysis trigger from chat (wa-bridge already handles `messagesSinceAnalysis`)
- New database migrations (all tables exist)
- Changes to wa-bridge (already feature-complete)
- Changes to WebSocket proxy (already feature-complete)

## Implementation Approach

Port component-by-component from `../amore`, adapting to amore-couples' data model and design system. Build bottom-up: types -> hooks -> components -> route.

---

## Phase 1: Types & WebSocket Hook

### Overview
Create shared types and the `useChatWebSocket` hook — the core real-time communication layer.

### Changes Required:

#### 1. Chat Types
**File**: `apps/web/src/types/chat.ts` (NEW)

```ts
export interface ChatMessage {
  id: string
  sender: string
  text: string | null
  timestamp: string | Date
  fromMe: boolean
  isMedia?: boolean
  waMessageId?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'queued'
  clientId?: string
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'logged-out'
  | 'session-expired'
```

#### 2. WebSocket Hook
**File**: `apps/web/src/hooks/use-chat-websocket.ts` (NEW)

Port from `../amore/apps/web/src/hooks/use-chat-websocket.ts` with these adaptations:
- Import types from `~/types/chat`
- No changes to WebSocket URL pattern (`/ws/chat?relationshipId=...` — the proxy already expects this but we'll pass coupleId as the query param since the proxy resolves couple from session anyway)
- Actually, check the proxy: it uses `relationshipId` query param but resolves couple from session. We should keep the same param name for compatibility or update both. **Decision**: The WS proxy doesn't actually use `relationshipId` from the query — it resolves the couple from the authenticated session. We can pass `coupleId` or nothing. Keep the param for future multi-couple support.

Core features to port:
- Optimistic message sending with `clientId` tracking
- 120-second send confirmation timeout -> error status
- 1-second send throttle
- Offline queue with flush on reconnect
- Exponential backoff reconnection (1s -> 30s cap)
- History loading (initial 50 + pagination via `load-history`)
- Message deduplication by `waMessageId`, `id`, `clientId`
- Receipt status updates (`delivered`, `read`)
- `sent-echo` backup confirmation
- Resync support
- Shadow refs for callbacks (avoid stale closures)
- `mountedRef` guard for async state updates

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd apps/web && npx tsc --noEmit`
- [ ] Hook can be imported without errors

#### Manual Verification:
- [ ] N/A — hook tested via Phase 4 integration

---

## Phase 2: AI Server Functions & Hook

### Overview
Create the chat AI server functions and the `useChatAI` hook for reply suggestions, mood analysis, draft review, and relationship data.

### Changes Required:

#### 1. Chat Server Functions
**File**: `apps/web/src/server/chat.ts` (NEW)

Port 4 server functions from `../amore/apps/web/src/server/chat.ts`, adapted to amore-couples model:

**`getChatRelationshipData`** (GET):
- Use `requireCouple()` instead of `verifyRelationshipOwnership`
- Query `couples` for `healthScore`, `lastAnalyzed`, `messagesSinceAnalysis`
- Query `userRelationshipProfiles` for partner's profile (where `userId = partnerId`)
- Query `insights` for recent insights (last 10, scoped to `coupleId`)
- Query `users` for partner's `name`
- Query `couples` for `whatsappJid` (the contactJid)
- Return: `{ healthScore, partnerName, contactJid, partnerProfile, recentInsights, totalMessages }`

**`getChatAISuggestions`** (POST):
- Input: `{ messages: ChatMessage[] }` (last 15)
- Use `requireCouple()` for auth
- Call AI function to generate 3 reply suggestions based on conversation context
- If `@amore-couples/ai` doesn't have `generateReplySuggestions`, create it (check first)
- Return: `{ suggestions: string[] }`

**`getChatAIMood`** (POST):
- Input: `{ messages: ChatMessage[] }` (last 20)
- Use `requireCouple()`
- Call AI function to analyze live conversation mood
- Return: `{ mood: string, coaching: string[], tensionFlag: boolean }`

**`getChatAIReview`** (POST):
- Input: `{ messages: ChatMessage[], draft: string }`
- Use `requireCouple()`
- Call AI function to review draft tone
- Return: `{ tone: string, suggestions: string[], revised: string }`

**Note**: Check if `@amore-couples/ai` package has these functions. If not, we need to add them (or inline Anthropic calls like `getAISuggestedGoals` does).

#### 2. AI Package Functions (if missing)
**File**: `packages/ai/src/chat.ts` (NEW, if needed)

Check `packages/ai/` for existing functions. If missing, create:
- `generateReplySuggestions(messages, partnerName)` -> `string[]`
- `analyzeLiveMood(messages, partnerName)` -> `{ mood, coaching, tensionFlag }`
- `reviewMessageTone(messages, draft, partnerName)` -> `{ tone, suggestions, revised }`

Each uses Anthropic API with focused system prompts.

#### 3. Chat AI Hook
**File**: `apps/web/src/hooks/use-chat-ai.ts` (NEW)

Port from `../amore/apps/web/src/hooks/use-chat-ai.ts` with adaptations:

**State shape** (same as reference):
```ts
interface AISidebarState {
  suggestions: string[]
  mood: string | null
  coaching: string[]
  tensionFlag: boolean
  review: { tone: string; suggestions: string[]; revised: string } | null
  suggestionsLoading: boolean
  moodLoading: boolean
  reviewLoading: boolean
  aiError: string | null
}
```

**Adaptations:**
- Use `coupleId` instead of `relationshipId`
- Call `getChatRelationshipData()` (no param needed — `requireCouple()` resolves from session)
- `partnerProfile` shape: `{ loveLanguages, communicationStyle, interests }` (no `wishlist` or `importantDates` in amore-couples)
- Pre-populate coaching from `insights` where `type = 'coaching_tip'`

**Core logic (port as-is):**
- Suggestion trigger: 3s debounce after incoming message, rate-limited 6/min
- Mood trigger: every 7 new messages, rate-limited 2/min
- Review: manual, rate-limited 3/hr
- AbortController for in-flight requests
- Em-dash cleanup on review text

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd apps/web && npx tsc --noEmit`
- [ ] Server functions importable

#### Manual Verification:
- [ ] N/A — tested via Phase 4 integration

---

## Phase 3: Chat Components

### Overview
Build all chat UI components in `apps/web/src/routes/_authenticated/-components/chat/`.

### Changes Required:

#### 1. StatusDot
**File**: `apps/web/src/routes/_authenticated/-components/chat/status-dot.tsx` (NEW)

Simple colored dot + label based on `ConnectionStatus`:
- `connected` -> green dot + "Connected"
- `connecting` / `reconnecting` -> yellow pulsing dot + label
- `disconnected` / `logged-out` / `session-expired` -> red dot + label

Styling: Use `bg-emerald-500`, `bg-amber-500 animate-pulse`, `bg-red-500` with stone text.

#### 2. DateDivider
**File**: `apps/web/src/routes/_authenticated/-components/chat/date-divider.tsx` (NEW)

Thin horizontal line with date label centered. Use `border-stone-200` line, `text-stone-400 text-xs bg-stone-50 px-2`.

#### 3. MessageBubble
**File**: `apps/web/src/routes/_authenticated/-components/chat/message-bubble.tsx` (NEW)

Port from reference with amore-couples design tokens:
- Sent (fromMe): `bg-rose-50 text-stone-900` right-aligned, `rounded-2xl rounded-br-md`
- Received: `bg-stone-100 text-stone-900` left-aligned, `rounded-2xl rounded-bl-md`
- Both: `max-w-[75%] px-3 py-2 text-sm`
- Timestamp: `text-[10px] text-stone-400`
- Status icons: inline SVG checkmarks (single grey, double grey, double rose-500 for read)
- Sending: small spinner
- Error: "Failed. Tap to retry" in `text-red-500`
- Media: italic `text-stone-400` placeholder

#### 4. MessageList
**File**: `apps/web/src/routes/_authenticated/-components/chat/message-list.tsx` (NEW)

Port from reference:
- Date grouping via `useMemo`
- Auto-scroll to bottom (only when at bottom, 100px threshold)
- "New messages" floating button
- "Load earlier messages" button
- Loading spinner
- Empty state
- Refs: `bottomRef`, `containerRef`, `isAtBottomRef`

#### 5. ChatInput
**File**: `apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx` (NEW)

Port from reference:
- Auto-growing textarea (cap at 96px / ~3 lines)
- Enter to send, Shift+Enter for newline
- "Review" button (sparkle icon + "Review")
- Send button
- `inputText`/`setInputText` lifted to parent (for AI suggestion injection)
- Disabled state when disconnected

Styling: `border-t border-stone-200 bg-white px-4 py-3`, textarea `rounded-xl border-stone-300`, buttons `bg-stone-900 text-white rounded-lg`.

#### 6. ChatHeader
**File**: `apps/web/src/routes/_authenticated/-components/chat/chat-header.tsx` (NEW)

Port from reference:
- Partner name (or "Chat" fallback)
- StatusDot
- Resync button (circular arrows SVG, `animate-spin` when resyncing)
- Simple avatar circle with initials (no external Avatar component)

Styling: `border-b border-stone-200 bg-white/80 backdrop-blur-sm px-4 py-3`

#### 7. ReviewPanel
**File**: `apps/web/src/routes/_authenticated/-components/chat/review-panel.tsx` (NEW)

Port from reference:
- Tone badge (color-coded: green for positive tones, red for harsh, amber for neutral)
- List of suggestions
- Revised text with "Use revised version" button
- Dismiss button

Styling: `bg-amber-50 border border-amber-200 rounded-xl mx-4 mb-2 p-3`

#### 8. AISidebar
**File**: `apps/web/src/routes/_authenticated/-components/chat/ai-sidebar.tsx` (NEW)

Port from reference with amore-couples adaptations:

Sub-components (inline):
- **HealthRing**: Reuse existing `health-ring.tsx` component from dashboard
- **MoodIndicator**: Badge showing live conversation mood
- **CoachingTips**: List of coaching tips as badges
- **SuggestionsList**: Clickable suggestion cards with skeleton loading
- **TensionAlert**: Red alert banner when tension detected
- **LoveLanguages**: Progress bars (from `userRelationshipProfiles`)
- **PartnerInterests**: Badge list (from `userRelationshipProfiles`)
- **ZeroState**: Progress bar with "Learning Your Patterns" when < 10 messages

**Adaptations:**
- No `ImportantDates` section (amore-couples doesn't have this field)
- No `wishlist` section
- Health ring reuses existing component

Styling: `bg-stone-50 border-l border-stone-200 p-4 overflow-y-auto`

#### 9. MobileSidebarSheet
**File**: `apps/web/src/routes/_authenticated/-components/chat/mobile-sidebar-sheet.tsx` (NEW)

Bottom sheet for mobile:
- Slides up from bottom, max 70vh
- Backdrop overlay
- Drag handle at top
- Contains AISidebar content

#### 10. LoggedOutOverlay
**File**: `apps/web/src/routes/_authenticated/-components/chat/logged-out-overlay.tsx` (NEW)

Full-screen overlay when WhatsApp disconnects:
- Semi-transparent backdrop
- Card with "WhatsApp Disconnected" message
- "Reconnect" link to `/whatsapp` (amore-couples uses `/whatsapp` not `/connect` for session management)

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd apps/web && npx tsc --noEmit`
- [ ] All component files exist in the chat directory

#### Manual Verification:
- [ ] N/A — visual testing in Phase 4

---

## Phase 4: Chat Route & Navigation

### Overview
Create the `/chat` route, wire up all hooks and components, and add navigation.

### Changes Required:

#### 1. Chat Route
**File**: `apps/web/src/routes/_authenticated/chat.tsx` (NEW)

```ts
export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatPage,
  loader: async () => {
    const status = await getWaSessionStatus()
    return { waSession: status.waSession }
  },
})
```

**ChatPage component:**
- If no WA session or status !== 'connected', show redirect/prompt to `/whatsapp`
- Use `useChatWebSocket(coupleId)` for messaging
- Use `useChatAI(coupleId, messages)` for AI features
- Lift `inputText` state for suggestion injection
- Two-column layout: 65% chat, 35% AI sidebar (desktop), full-width + bottom sheet (mobile)
- Wire up all components: ChatHeader, MessageList, ReviewPanel, ChatInput, AISidebar, MobileSidebarSheet, LoggedOutOverlay
- Redirect to `/whatsapp` on `session-expired`

**Layout structure:**
```
div.flex.h-[calc(100dvh-57px)]
  LoggedOutOverlay (conditional)
  div.flex-1.flex.flex-col (chat column, lg:max-w-[65%])
    ChatHeader
    MessageList
    ReviewPanel (conditional)
    ChatInput
  div.hidden.lg:flex.lg:w-[35%] (sidebar)
    AISidebar
  MobileSidebarSheet (mobile)
  FAB button to open mobile sidebar
```

#### 2. Navigation Update
**File**: `apps/web/src/routes/_authenticated/-components/nav.tsx` (EDIT)

Add chat link:
- Icon: speech bubble SVG
- Label: "Chat"
- Route: `/chat`
- Position: after Dashboard, before Goals (or after WhatsApp)

#### 3. Route Registration
TanStack file-based routing should auto-detect the new route file. Verify by checking `routeTree.gen.ts` regeneration.

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd apps/web && npx tsc --noEmit`
- [ ] Build succeeds: `cd apps/web && pnpm run build`
- [ ] Route file detected by TanStack router

#### Manual Verification:
- [ ] Navigate to `/chat` — see chat interface
- [ ] Messages load from history (if connected)
- [ ] Can send a message and see it appear
- [ ] Receive a message from partner in real-time
- [ ] Read receipts update (sent -> delivered -> read)
- [ ] "Load earlier messages" works for pagination
- [ ] AI sidebar shows health ring and suggestions
- [ ] Review button analyzes draft tone
- [ ] Suggestion click populates input
- [ ] Mobile sidebar sheet opens/closes
- [ ] Disconnection shows overlay with reconnect link
- [ ] Resync button triggers history refresh
- [ ] Offline queue: send while disconnected, messages send on reconnect

---

## Phase 5: AI Functions Implementation

### Overview
Implement the AI functions that power suggestions, mood analysis, and draft review. Check what exists in `@amore-couples/ai` and fill gaps.

### Changes Required:

#### 1. Check existing AI package
**File**: `packages/ai/` — examine what functions exist

If missing, create:

#### 2. Reply Suggestions
**Function**: `generateReplySuggestions(messages, partnerName, context?)`

System prompt: Generate 3 natural, contextually appropriate reply suggestions. Consider tone, topic, and relationship dynamics. Return as JSON array of strings.

#### 3. Live Mood Analysis
**Function**: `analyzeLiveMood(messages, partnerName)`

System prompt: Analyze the conversation mood. Return JSON with `mood` (one-word label), `coaching` (array of 1-3 brief tips), `tensionFlag` (boolean for detected friction).

#### 4. Draft Review
**Function**: `reviewMessageTone(messages, draft, partnerName)`

System prompt: Review the draft message for tone in the context of the conversation. Return JSON with `tone` (one-word label), `suggestions` (array of improvements), `revised` (full rewritten version if needed).

All functions use Anthropic API via the existing client pattern in the AI package (check how `detectMoodShift` and `generateMoodCoaching` are implemented for the pattern).

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles
- [ ] AI functions are importable

#### Manual Verification:
- [ ] Suggestions appear 3s after receiving a message
- [ ] Mood updates every ~7 messages
- [ ] Draft review returns tone + suggestions + revised text
- [ ] Rate limiting works (no spam)

---

## Testing Strategy

### Unit Tests:
- Message deduplication logic in `useChatWebSocket`
- Date grouping in `MessageList`
- Status icon rendering in `MessageBubble`

### Integration Tests:
- WebSocket connection lifecycle
- Optimistic send -> confirmation flow
- History pagination

### Manual Testing Steps:
1. Connect WhatsApp via `/whatsapp`
2. Navigate to `/chat`
3. Verify history loads
4. Send a message — see optimistic bubble, then confirmation
5. Receive a reply — see bubble appear in real-time
6. Check read receipts update
7. Test AI sidebar: wait for suggestions, try review
8. Test mobile: sidebar sheet, responsive layout
9. Test disconnect: close WhatsApp on phone, verify overlay
10. Test reconnect: reconnect and verify messages resume

## Performance Considerations
- Messages use `useMemo` for date grouping (avoid re-grouping on every render)
- Scroll position tracked via ref, not state (avoid scroll-triggered re-renders)
- AI calls are rate-limited and debounced
- AbortController cancels stale AI requests
- Shadow refs prevent stale closures in WebSocket callbacks

## References
- Reference implementation: `../amore/apps/web/src/routes/_authenticated/chat.$relationshipId.tsx`
- Reference hooks: `../amore/apps/web/src/hooks/use-chat-websocket.ts`, `use-chat-ai.ts`
- Reference components: `../amore/apps/web/src/routes/_authenticated/-components/chat/`
- WebSocket proxy: `apps/web/server/routes/ws/chat.ts`
- wa-bridge: `apps/wa-bridge/src/`
- DB schema: `packages/db/src/schema.ts`
