# Coach Contextual Starters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the coach sidebar opens on the chat page with a new or stale thread, auto-generate an insight + dynamic suggestion chips from recent WhatsApp messages.

**Architecture:** New AI function generates structured JSON (insight + suggestions) from recent messages. Server function fetches messages and calls AI. Hook manages starter state with loading/clearing. Component renders insight bubble + chip buttons.

**Tech Stack:** Claude Haiku (fast model), Drizzle ORM, TanStack server functions, React

---

### Task 1: AI function — `generateCoachStarter`

**Files:**
- Modify: `packages/ai/src/coach-conversation.ts` (append after `generateThreadTitle`)
- Modify: `packages/ai/src/index.ts` (add export)

**Step 1: Add the starter schema and function to coach-conversation.ts**

Append after the `generateThreadTitle` function (after line 314):

```typescript
const coachStarterSchema = z.object({
  insight: z.string().min(1).max(500),
  suggestions: z.array(z.string().min(1).max(100)).min(2).max(4),
})

export interface CoachStarter {
  insight: string
  suggestions: string[]
}

export async function generateCoachStarter(
  recentMessages: Array<{ sender: string; text: string }>,
): Promise<CoachStarter> {
  const client = getClient()

  const formatted = recentMessages
    .map((m) => `[${m.sender}] ${m.text}`)
    .join('\n')

  try {
    return await withRetry(async () => {
      const response = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 250,
        system: `You are a relationship coach reviewing a couple's recent WhatsApp messages.

Return a JSON object with:
- "insight": A brief observation (1-2 sentences) about the conversation tone, topic, or dynamic. Be specific to what you see, not generic.
- "suggestions": 3-4 short action prompts (5-10 words each) the user could tap to start a coaching conversation. Make them specific to the message content.

Examples of good suggestions: "Ask about her work stress", "Respond to the weekend plan", "Check in on how she's feeling", "Discuss the budget conversation"

Return ONLY valid JSON, no markdown.`,
        messages: [
          { role: 'user', content: `Recent messages:\n${formatted}` },
        ],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
      return parseValidatedResponse(text, coachStarterSchema)
    })
  } catch {
    return {
      insight: "I can see your recent conversation. Ask me anything about how it's going or what to say next.",
      suggestions: [
        'Help me reply thoughtfully',
        'How is our communication today?',
        'Suggest something nice to say',
      ],
    }
  }
}
```

**Step 2: Export from index.ts**

Add `generateCoachStarter` and `CoachStarter` to the re-export line for coach-conversation (line 3 already uses `export *`):

No change needed — `export * from './coach-conversation'` already covers it.

**Step 3: Verify build**

Run: `cd packages/ai && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: add generateCoachStarter AI function
```

---

### Task 2: Server function — `getCoachStarter`

**Files:**
- Modify: `apps/web/src/server/coach.ts` (append new server function)

**Step 1: Add the server function**

Append after `dismissNudge` (after line 204):

```typescript
export const getCoachStarter = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { couple, session, partnerId } = await requireCouple()

    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.coupleId, couple.id),
      orderBy: [desc(messages.timestamp)],
      limit: 20,
      columns: {
        senderId: true,
        text: true,
      },
    })

    const formatted = recentMessages
      .filter((m) => Boolean(m.text))
      .reverse()
      .map((m) => ({
        sender: m.senderId === session.user.id ? 'You' : 'Partner',
        text: m.text ?? '',
      }))

    if (formatted.length === 0) {
      return null
    }

    const { generateCoachStarter } = await import('@amore-couples/ai')
    return generateCoachStarter(formatted)
  })
```

Note: Need to add `messages` to the schema import at top of file (line 8 area). Add `messages` to the import from `@amore-couples/db/schema`. Also add `desc` to drizzle-orm imports if not already there (it's already imported on line 13).

**Step 2: Update imports at top of coach.ts**

Add `messages` to the schema import (line 8):
```typescript
import {
  coachMessages,
  coachNudges,
  coachThreads,
  messages,
} from '@amore-couples/db/schema'
```

Add `generateCoachStarter` type import is not needed (dynamic import used).

**Step 3: Verify build**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: add getCoachStarter server function
```

---

### Task 3: Hook changes — `useCoach` starter state

**Files:**
- Modify: `apps/web/src/hooks/use-coach.ts`

**Step 1: Add import for getCoachStarter**

Update the import block (line 2-10) to include `getCoachStarter`:

```typescript
import {
  deleteThread,
  dismissNudge,
  getCoachNudges,
  getCoachStarter,
  getOrCreateThread,
  getThreadMessages,
  listThreads,
  saveCoachExchange,
} from '~/server/coach'
```

**Step 2: Add starter state and types**

After line 32 (after `CoachNudge` interface), add:

```typescript
export interface CoachStarter {
  insight: string
  suggestions: string[]
}
```

Inside `useCoach` function, after the `error` state (line 88), add:

```typescript
const [starter, setStarter] = useState<CoachStarter | null>(null)
const [starterLoading, setStarterLoading] = useState(false)
```

**Step 3: Add loadStarter function**

After `loadNudges` (after line 165), add:

```typescript
const loadStarter = useCallback(async (threadMessages: CoachMessage[]) => {
  if (currentPage !== 'chat') return

  // New thread (no messages) or stale thread (last message > 1h ago)
  const isNew = threadMessages.length === 0
  const isStale = threadMessages.length > 0 &&
    Date.now() - new Date(threadMessages[threadMessages.length - 1].createdAt).getTime() > 60 * 60 * 1000

  if (!isNew && !isStale) {
    setStarter(null)
    return
  }

  setStarterLoading(true)
  try {
    const result = await getCoachStarter()
    setStarter(result as CoachStarter | null)
  } catch (err) {
    console.error('[coach] failed to load starter', err)
    setStarter(null)
  } finally {
    setStarterLoading(false)
  }
}, [currentPage])
```

**Step 4: Clear starter when user sends a message**

In `sendMessage` (around line 205), right after `setError(null)`, add:

```typescript
setStarter(null)
```

**Step 5: Call loadStarter after opening a thread**

In `openThread` (around line 133-134), after setting messages, call loadStarter:

For the existing-thread branch (inside `if (threadId)`), after `messageCountRef.current = normalized.length` (line 134), add:
```typescript
void loadStarter(normalized)
```

For the new-thread branch (the `else` at line 135), after `messageCountRef.current = 0` (line 138), add:
```typescript
void loadStarter([])
```

**Step 6: Return starter state from hook**

Add to the return object (after line 400):

```typescript
starter,
starterLoading,
```

**Step 7: Verify build**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```
feat: add starter state management to useCoach hook
```

---

### Task 4: Component — render starter insight + suggestion chips

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`

**Step 1: Add StarterShimmer component**

After the `NudgeBanner` component (after line 157), add:

```typescript
function StarterShimmer() {
  return (
    <div className="space-y-3 px-3 py-4">
      <div className="rounded-3xl rounded-bl-md border border-warm-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-warm-200" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-warm-200" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-32 animate-pulse rounded-full bg-warm-100" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-warm-100" />
        <div className="h-8 w-36 animate-pulse rounded-full bg-warm-100" />
      </div>
    </div>
  )
}

function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 px-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-coral-200 bg-white px-3 py-1.5 text-xs font-medium text-coral-700 shadow-sm transition-colors hover:bg-coral-50 hover:border-coral-300 active:bg-coral-100"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Destructure starter state from hook**

In `CoachSidebar` component, update the destructure (around line 166-182) to include:

```typescript
starter,
starterLoading,
```

**Step 3: Replace the empty-state placeholder with starter content**

In the message area (lines 354-378), replace the empty state block. The current code has three branches: `isLoading`, `messages.length === 0`, and messages list. Update the `messages.length === 0` branch to show starter or loading:

Replace the block from line 359 to 368 (the `messages.length === 0` empty state `<div className="rounded-[2rem]...">`) with:

```typescript
starterLoading ? (
  <StarterShimmer />
) : starter ? (
  <div className="space-y-3">
    <CoachBubble role="assistant" content={starter.insight} />
    <SuggestionChips
      suggestions={starter.suggestions}
      onSelect={(text) => {
        void handleSend(text)
      }}
    />
  </div>
) : (
  <div className="rounded-[2rem] border border-dashed border-warm-200 bg-white/75 px-6 py-12 text-center shadow-sm">
    {/* existing empty state content stays the same */}
  </div>
)
```

**Step 4: Update handleSend to accept optional text parameter**

Change `handleSend` (line 224) to accept an optional text parameter so chips can call it directly:

```typescript
const handleSend = async (chipText?: string) => {
  const text = (chipText ?? input).trim()
  if (!text || isStreaming) return

  setInput('')
  await sendMessage(text)
}
```

**Step 5: Verify build**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 6: Manual test**

1. Run `pnpm run dev:restart`
2. Open localhost:9941, go to chat page
3. Open coach sidebar
4. Should see loading shimmer briefly, then insight bubble + suggestion chips
5. Click a suggestion chip — should start a conversation
6. Close sidebar, reopen — should show starter again (new thread or stale)
7. Type a custom message — chips should disappear

**Step 7: Commit**

```
feat: render coach starter insight and suggestion chips in sidebar
```
