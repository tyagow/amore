# Coach Sidebar Contextual Starters

**Date**: 2026-03-10
**Status**: Approved

## Problem

When the coach sidebar opens on the chat page, it shows a blank conversation. The user has to think of what to ask. The coach should be proactive — reading recent messages and offering insights + actionable suggestions immediately.

## Design

### Trigger Conditions

Auto-insight fires when ALL of these are true:
1. User is on the **chat page** (`currentPage === "chat"`)
2. Thread is **new** (no messages) OR **stale** (last message >1 hour ago)

If the thread has recent activity (<1h), just show existing message history.

### UX Flow

1. Sidebar opens → loading shimmer (1-2s)
2. Assistant bubble appears with a short insight (2-3 sentences) based on recent WhatsApp messages
3. Below the insight: 3-4 dynamic suggestion chips (e.g. "Ask about her work stress", "Respond to the weekend plan")
4. Tapping a chip sends it as a user message → starts normal conversation
5. Freeform text input remains available
6. Chips disappear once user sends any message (chip or typed)

### Technical Approach

**New server function**: `getCoachStarter(coupleId, userId, partnerId)`
- Fetches last 20 messages from `wa_messages` for the couple
- Calls Claude (fast model, ~200 token response) with a structured JSON prompt
- Returns `{ insight: string, suggestions: string[] }`
- No streaming — response is short, single JSON call is snappier

**AI prompt structure**:
- System: "You are a relationship coach. Given recent messages between a couple, provide a brief observation and 3-4 actionable suggestion prompts."
- Input: Last 20 messages with sender labels (user vs partner)
- Output: JSON `{ insight: "...", suggestions: ["...", "...", "..."] }`

**Hook changes** (`useCoach`):
- Add `starter` state: `{ insight: string, suggestions: string[] } | null`
- Add `loadStarter()` — called when `currentPage === "chat"` and thread is new/stale
- Add `starterLoading` boolean for shimmer state
- Clear starter when user sends any message

**Component changes** (`coach-sidebar.tsx`):
- Render `StarterInsight` bubble when `starter` is set
- Render `SuggestionChips` below the insight
- Chips call `sendMessage(chip.text)` on tap
- Loading shimmer while `starterLoading` is true

### Stale Thread Detection

Check `lastMessage.createdAt` from the current thread's messages:
- If no messages → new thread → fire starter
- If last message > 1 hour ago → stale → fire starter
- Otherwise → show history as-is

### Scope Boundaries

- Chat page only (other pages remain as-is)
- No persistent storage of starters (ephemeral, regenerated each time)
- No background refresh while sidebar is open
- No streaming for the starter (too short to benefit)
