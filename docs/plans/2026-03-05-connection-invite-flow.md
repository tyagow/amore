# Connection & Invite Flow — Robust Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken connection/invite flow so users can send, receive, and accept partner invites with real-time in-app notifications and a polished UX — no dead-ends, no silent failures.

**Architecture:** Add a user-scoped SSE channel (separate from the existing couple-scoped one) so users waiting for connection requests get real-time updates. Redesign the `/connect` page with clear states (empty, pending-sent, pending-received, connected). Fix the `/setup` route guard so the onboarding flow works end-to-end. Add polling fallback on `/connect` for reliability.

**Tech Stack:** TanStack Start server functions, Drizzle ORM, Node EventEmitter SSE, Tailwind CSS (stone palette), h3/Nitro server routes.

---

## Root Cause Analysis

1. **`/setup` is unreachable** — `_authenticated.tsx:50` redirects ALL coupleless users to `/connect`, but `/setup` is not whitelisted. New users can never set their display name.
2. **No real-time notification for incoming requests** — The SSE system is couple-gated (`updates.ts:35`). Users on `/connect` without a couple get a 404 from SSE.
3. **Sent requests give no feedback** — `searchAndSendRequest` always returns the same generic message. The sender has no "Sent Requests" section to track what they sent.
4. **Pending requests only visible on page load** — No polling or SSE on `/connect`. If a request arrives while the user is on the page, they won't see it until they reload.
5. **`window.location.reload()` hack** — After accepting, `connect.tsx:100` does a hard reload instead of proper router invalidation.

---

### Task 1: Fix Route Guard — Whitelist `/setup`

**Files:**
- Modify: `apps/web/src/routes/_authenticated.tsx:50`

**Step 1: Update the route guard to whitelist both `/connect` and `/setup`**

In `_authenticated.tsx`, change line 50 from:

```typescript
if (!hasCouple && location.pathname !== '/connect') {
  throw redirect({ to: '/connect' })
}
```

to:

```typescript
const publicPaths = ['/connect', '/setup']
if (!hasCouple && !publicPaths.includes(location.pathname)) {
  throw redirect({ to: '/connect' })
}
```

**Step 2: Verify manually**

1. Log out, create a new account, navigate to `/setup`
2. Confirm: page renders (not redirected to `/connect`)
3. Fill in display name, click Continue
4. Confirm: redirects to `/connect`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.tsx
git commit -m "fix: whitelist /setup in auth guard so new users can set display name"
```

---

### Task 2: Add User-Scoped Event System for Connection Notifications

**Files:**
- Modify: `apps/web/src/lib/events.ts`

**Step 1: Add user-scoped event types and emitter functions**

Add these types and functions to `events.ts` after the existing couple-scoped code:

```typescript
// ── User-scoped events (for pre-couple notifications) ────

export type UserEventType = 'connection_request_received' | 'connection_request_accepted'

export interface UserEvent {
  type: UserEventType
  data: Record<string, unknown>
}

export function emitUserEvent(userId: string, event: UserEvent) {
  emitter.emit(`user:${userId}`, event)
}

export function subscribeUserEvents(
  userId: string,
  callback: (event: UserEvent) => void,
): () => void {
  const handler = (event: UserEvent) => callback(event)
  emitter.on(`user:${userId}`, handler)
  return () => emitter.off(`user:${userId}`, handler)
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/events.ts
git commit -m "feat: add user-scoped event emitter for connection notifications"
```

---

### Task 3: Add SSE Endpoint for User Events (Pre-Couple)

**Files:**
- Create: `apps/web/server/routes/sse/user-events.ts`

**Step 1: Create the user-scoped SSE endpoint**

```typescript
/**
 * SSE endpoint for user-scoped events (connection requests).
 * Works without an active couple — used on /connect page.
 *
 * Nitro server route: GET /sse/user-events
 */

import { defineEventHandler, createError } from 'h3'
import { auth } from '../../../src/lib/auth'
import { subscribeUserEvents, type UserEvent } from '../../../src/lib/events'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(data: string) {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // stream may be closed
        }
      }

      send(JSON.stringify({ type: 'connected', userId: session.user.id }))

      const unsubscribe = subscribeUserEvents(session.user.id, (evt: UserEvent) => {
        send(JSON.stringify(evt))
      })

      const keepalive = setInterval(() => {
        send(JSON.stringify({ type: 'ping' }))
      }, 30_000)

      event.node?.req.on('close', () => {
        unsubscribe()
        clearInterval(keepalive)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
```

**Step 2: Commit**

```bash
git add apps/web/server/routes/sse/user-events.ts
git commit -m "feat: add user-scoped SSE endpoint for connection request notifications"
```

---

### Task 4: Emit Events from Connection Server Functions

**Files:**
- Modify: `apps/web/src/server/connections.ts`

**Step 1: Import emitUserEvent**

Add at the top of `connections.ts`:

```typescript
import { emitUserEvent } from '~/lib/events'
```

**Step 2: Emit event when a request is sent (after the insert)**

In `searchAndSendRequest`, after line 85 (`await db.insert(connectionRequests).values(...)`) and before the return on line 87, add:

```typescript
    // Notify the target user in real-time
    emitUserEvent(targetUser.id, {
      type: 'connection_request_received',
      data: {
        requestId: undefined, // we don't have it from insert, but the client will refetch
        fromUserName: session.user.name,
        fromUserEmail: session.user.email,
      },
    })
```

**Step 3: Emit event when a request is accepted**

In `acceptConnectionRequest`, after the transaction (after line 153) and before the return on line 155, add:

```typescript
    // Notify the sender that their request was accepted
    emitUserEvent(request.fromUserId, {
      type: 'connection_request_accepted',
      data: {
        acceptedByName: session.user.name,
        acceptedByEmail: session.user.email,
      },
    })
```

**Step 4: Commit**

```bash
git add apps/web/src/server/connections.ts
git commit -m "feat: emit user events on connection request send and accept"
```

---

### Task 5: Add Sent Requests Server Function

**Files:**
- Modify: `apps/web/src/server/connections.ts`

**Step 1: Add getSentRequests server function**

Add after the `getPendingRequests` function (after line 116):

```typescript
/**
 * Get all pending outgoing connection requests sent by the current user.
 */
export const getSentRequests = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    const requests = await db
      .select({
        id: connectionRequests.id,
        toUserEmail: users.email,
        createdAt: connectionRequests.createdAt,
        status: connectionRequests.status,
      })
      .from(connectionRequests)
      .innerJoin(users, eq(users.id, connectionRequests.toUserId))
      .where(eq(connectionRequests.fromUserId, session.user.id))

    return requests
  },
)
```

**Step 2: Commit**

```bash
git add apps/web/src/server/connections.ts
git commit -m "feat: add getSentRequests server function for tracking outgoing invites"
```

---

### Task 6: Redesign the Connect Page with Full UX

**Files:**
- Modify: `apps/web/src/routes/_authenticated/connect.tsx` (full rewrite)

**Step 1: Rewrite the connect page**

Complete replacement of `connect.tsx`:

```tsx
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  searchAndSendRequest,
  getPendingRequests,
  getSentRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  getMyCouple,
} from '~/server/connections'

export const Route = createFileRoute('/_authenticated/connect')({
  component: ConnectPage,
  loader: async () => {
    const [coupleData, pendingRequests, sentRequests] = await Promise.all([
      getMyCouple(),
      getPendingRequests(),
      getSentRequests(),
    ])
    return { coupleData, pendingRequests, sentRequests }
  },
})

function ConnectPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const {
    coupleData,
    pendingRequests: initialPending,
    sentRequests: initialSent,
  } = Route.useLoaderData()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(initialPending)
  const [sentRequests, setSentRequests] = useState(initialSent)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // SSE: listen for real-time connection events
  useEffect(() => {
    if (coupleData) return // already connected, no need

    const source = new EventSource('/sse/user-events')

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'connection_request_received') {
          // Refetch pending requests
          getPendingRequests().then(setPendingRequests)
        } else if (event.type === 'connection_request_accepted') {
          // Our sent request was accepted — reload to show connected state
          router.invalidate()
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => source.close()
  }, [coupleData, router])

  // Also poll every 30s as a fallback
  useEffect(() => {
    if (coupleData) return

    const interval = setInterval(async () => {
      const [pending, sent] = await Promise.all([
        getPendingRequests(),
        getSentRequests(),
      ])
      setPendingRequests(pending)
      setSentRequests(sent)
    }, 30_000)

    return () => clearInterval(interval)
  }, [coupleData])

  // ── Connected state ─────────────────────────────────────
  if (coupleData) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Connected</h1>
          <p className="text-stone-600 mb-1">
            You are connected with{' '}
            <span className="font-semibold text-stone-900">
              {coupleData.partner?.name ?? coupleData.partner?.email}
            </span>
          </p>
          <p className="text-sm text-stone-400 mb-6">{coupleData.partner?.email}</p>
          <button
            onClick={() => navigate({ to: '/dashboard' as string })}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Handlers ────────────────────────────────────────────
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    setMessage(null)
    setError(null)

    try {
      const result = await searchAndSendRequest({ data: { email: email.trim() } })
      setMessage(result.message)
      setEmail('')
      // Refresh sent requests to show the new one
      const updated = await getSentRequests()
      setSentRequests(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await acceptConnectionRequest({ data: { requestId } })
      // Use router invalidation instead of window.location.reload()
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await declineConnectionRequest({ data: { requestId } })
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request')
    } finally {
      setProcessingId(null)
    }
  }

  // ── Not connected state ─────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Connect with your partner
        </h1>
        <p className="text-stone-500 text-sm">
          Send a connection request to start using Amore together.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Pending incoming requests — shown FIRST and prominently */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <h2 className="text-lg font-bold text-stone-900">
              {pendingRequests.length === 1
                ? 'You have a connection request!'
                : `You have ${pendingRequests.length} connection requests!`}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {request.fromUserName ?? 'Someone'}
                    </p>
                    <p className="text-sm text-stone-500">{request.fromUserEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
                    >
                      {processingId === request.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 border border-stone-300 text-stone-600 text-sm rounded-lg font-medium hover:bg-stone-100 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send request form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-stone-900 mb-1">
          Invite your partner
        </h2>
        <p className="text-stone-500 text-sm mb-4">
          Enter their email address. They&apos;ll need an Amore account to accept.
        </p>

        <form onSubmit={handleSendRequest} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
            placeholder="partner@example.com"
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        {message && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Sent requests (tracking what you've sent) */}
      {sentRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-3">
            Sent invitations
          </h2>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-50"
              >
                <span className="text-sm text-stone-700">{request.toUserEmail}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify manually**

1. Open http://localhost:9941/connect in two browsers (one per account)
2. From account A, send invite to account B's email
3. Confirm: Account A sees the invite in "Sent invitations" with "pending" badge
4. Confirm: Account B sees the request appear in real-time (amber banner with pinging dot)
5. Accept from Account B
6. Confirm: Both accounts see "Connected" state without hard reload

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/connect.tsx
git commit -m "feat: redesign connect page with real-time SSE, sent tracking, prominent incoming requests"
```

---

### Task 7: Add Pending Request Indicator to Nav

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/nav.tsx`
- Modify: `apps/web/src/routes/_authenticated.tsx`

**Step 1: Add `pendingRequestCount` prop to Nav**

In `nav.tsx`, update the `NavProps` interface and add a Connect nav item with a badge. Add to the interface:

```typescript
interface NavProps {
  partnerMoodColor?: string | null
  pendingRequestCount?: number
}
```

Add a Connect nav item to the mobile nav (after Profile, before closing `</div>`):

```tsx
{pendingRequestCount != null && pendingRequestCount > 0 && (
  <NavItem to="/connect" label="Connect">
    <span className="relative">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
        {pendingRequestCount}
      </span>
    </span>
  </NavItem>
)}
```

Similarly add to the desktop sidebar (after Profile SidebarItem):

```tsx
{pendingRequestCount != null && pendingRequestCount > 0 && (
  <SidebarItem to="/connect" label="Connection Requests">
    <span className="relative">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
        {pendingRequestCount}
      </span>
    </span>
  </SidebarItem>
)}
```

**Step 2: Pass pending count from layout to Nav**

In `_authenticated.tsx`, update `beforeLoad` to also fetch pending requests when the user has no couple, and pass the count to `AuthenticatedLayout` via route context:

Update the `beforeLoad` return to include `pendingRequestCount`:

```typescript
beforeLoad: async ({ location }) => {
  const session = await getAuthSession()
  if (!session) {
    throw redirect({ to: '/login' })
  }

  const coupleData = await getMyCouple()
  const hasCouple = !!coupleData

  const publicPaths = ['/connect', '/setup']
  if (!hasCouple && !publicPaths.includes(location.pathname)) {
    throw redirect({ to: '/connect' })
  }

  // Fetch pending request count for nav badge (only when not coupled)
  let pendingRequestCount = 0
  if (!hasCouple) {
    const { getPendingRequests } = await import('~/server/connections')
    const requests = await getPendingRequests()
    pendingRequestCount = requests.length
  }

  return { session, hasCouple, pendingRequestCount }
},
```

Update `AuthenticatedLayout` to read and pass the count:

```typescript
function AuthenticatedLayout() {
  const { pendingRequestCount } = Route.useRouteContext()

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav pendingRequestCount={pendingRequestCount} />
      <div className="md:ml-64 pb-20 md:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
```

**Step 3: Verify manually**

1. Log in as user with pending requests
2. Confirm: red badge appears on nav with count
3. Navigate to any page — badge persists
4. Accept all requests — badge disappears on next navigation

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/-components/nav.tsx apps/web/src/routes/_authenticated.tsx
git commit -m "feat: add pending request badge to nav for incoming connection invites"
```

---

## Summary of Changes

| # | What | Why |
|---|------|-----|
| 1 | Whitelist `/setup` in auth guard | New users can set display name before connecting |
| 2 | User-scoped event system | Enables real-time notifications without a couple |
| 3 | User-scoped SSE endpoint | Delivers connection events to `/connect` page |
| 4 | Emit events from server functions | Wire up send/accept to push real-time updates |
| 5 | `getSentRequests` server function | Let senders track their outgoing invites |
| 6 | Redesign `/connect` page | Prominent incoming requests, sent tracking, SSE + polling, no hard reload |
| 7 | Nav pending request badge | Users see incoming requests from any page |

**Files touched:** 5 modified, 1 created. No new dependencies. No schema migrations.
