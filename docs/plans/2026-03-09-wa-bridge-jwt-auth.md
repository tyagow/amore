# wa-bridge JWT Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static shared secret on wa-bridge with short-lived signed JWT tokens for all server-to-server auth.

**Architecture:** The Nitro WS proxy signs a JWT (5min TTL) containing userId, coupleId, and sessionId before connecting upstream to wa-bridge. The bridge verifies the signature and claims. HTTP routes also switch from static bearer token to JWT. During migration, both old token and new JWT are accepted.

**Tech Stack:** `jose` (JWT signing/verification), Node `ws` (custom headers), Hono `bearerAuth` middleware.

---

### Task 1: Add `jose` to both packages

**Files:**
- Modify: `apps/wa-bridge/package.json`
- Modify: `apps/web/package.json`

**Step 1: Install jose in both packages**

```bash
cd /Users/partiu/workspace/amore-couples
pnpm --filter @amore-couples/wa-bridge add jose
pnpm --filter @amore-couples/web add jose
```

**Step 2: Verify installation**

```bash
pnpm ls jose --filter @amore-couples/wa-bridge
pnpm ls jose --filter @amore-couples/web
```

Expected: jose appears in both dependency lists.

**Step 3: Commit**

```bash
git add apps/wa-bridge/package.json apps/web/package.json pnpm-lock.yaml
git commit -m "deps: add jose for JWT auth"
```

---

### Task 2: Add JWT signing to the web WS proxy

**Files:**
- Modify: `apps/web/server/routes/ws/chat.ts:1-22` (imports and constants)
- Modify: `apps/web/server/routes/ws/chat.ts:63-74` (connectUpstream function)

**Step 1: Add JWT import and secret constant**

At the top of the file, add the `jose` import and replace `WA_BRIDGE_SECRET` with `WA_BRIDGE_JWT_SECRET`:

```typescript
import { SignJWT } from 'jose'

const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9945'
const WA_BRIDGE_JWT_SECRET = process.env.WA_BRIDGE_JWT_SECRET || ''

// Encode the secret for jose (must be Uint8Array)
const jwtSecretKey = new TextEncoder().encode(WA_BRIDGE_JWT_SECRET)
```

Remove the old `WA_BRIDGE_SECRET` constant.

**Step 2: Create a signBridgeToken helper**

Add this helper function after the constants:

```typescript
async function signBridgeToken(state: PeerState): Promise<string> {
  return new SignJWT({
    coupleId: state.coupleId,
    sessionId: state.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(state.userId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(jwtSecretKey)
}
```

**Step 3: Update connectUpstream to use JWT**

Change the `connectUpstream` function to be async, sign a JWT, and pass it as a header:

```typescript
async function connectUpstream(peer: WebSocketPeer, state: PeerState) {
  const wsUrl = WA_BRIDGE_URL.replace(/^http/, 'ws')
  const url = `${wsUrl}?sessionId=${encodeURIComponent(state.sessionId)}`

  const token = await signBridgeToken(state)
  const upstream = new WebSocket(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  state.upstream = upstream
  // ... rest unchanged
```

Note: `sessionId` stays in the query param (bridge needs it before parsing JWT). The token moves to the `Authorization` header.

**Step 4: Update the call site**

In the `open` handler (~line 498), the call is already `connectUpstream(peer, state)`. Since it's now async but we don't await it (fire-and-forget with internal error handling), no change needed at the call site.

Similarly in `scheduleReconnect` (~line 126), the call `connectUpstream(peer, state)` doesn't need awaiting.

**Step 5: Build and verify**

```bash
pnpm run build
```

Expected: Build succeeds with no errors.

---

### Task 3: Add JWT verification to wa-bridge WS handler

**Files:**
- Modify: `apps/wa-bridge/src/index.ts:1-16` (imports and env vars)
- Modify: `apps/wa-bridge/src/index.ts:302-316` (WS connection handler)
- Modify: `apps/wa-bridge/src/index.ts:38-41` (HTTP bearer auth)

**Step 1: Add jose import**

```typescript
import { jwtVerify } from 'jose'
```

**Step 2: Update env var handling**

Replace the strict `WA_BRIDGE_SECRET` requirement with both old and new:

```typescript
const WA_BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET || ''
const WA_BRIDGE_JWT_SECRET = process.env.WA_BRIDGE_JWT_SECRET
if (!WA_BRIDGE_JWT_SECRET && !WA_BRIDGE_SECRET) {
  log.fatal('WA_BRIDGE_JWT_SECRET or WA_BRIDGE_SECRET environment variable is required')
  process.exit(1)
}
const jwtSecretKey = WA_BRIDGE_JWT_SECRET
  ? new TextEncoder().encode(WA_BRIDGE_JWT_SECRET)
  : null
```

**Step 3: Create a verifyBridgeAuth helper**

```typescript
async function verifyBridgeAuth(req: import('http').IncomingMessage, sessionId: string): Promise<boolean> {
  // Try JWT first (Authorization header)
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ') && jwtSecretKey) {
    try {
      const token = authHeader.slice(7)
      const { payload } = await jwtVerify(token, jwtSecretKey)
      // Validate sessionId claim matches the requested session
      if (payload.sessionId !== sessionId) {
        log.warn({ claimed: payload.sessionId, requested: sessionId }, 'JWT sessionId mismatch')
        return false
      }
      return true
    } catch (err) {
      log.warn({ err }, 'JWT verification failed')
      return false
    }
  }

  // Fallback: legacy static token (query param) — remove after full migration
  if (WA_BRIDGE_SECRET) {
    const url = new URL(req.url || '', `http://localhost`)
    const token = url.searchParams.get('token')
    if (token === WA_BRIDGE_SECRET) return true
  }

  return false
}
```

**Step 4: Update the WS connection handler**

Replace the current auth block in `wss.on('connection', ...)`:

```typescript
wss.on('connection', async (ws, req) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId) {
    ws.close(4001, 'Missing sessionId')
    return
  }

  // Authenticate — JWT or legacy token
  const authenticated = await verifyBridgeAuth(req, sessionId)
  if (!authenticated) {
    ws.close(4003, 'Unauthorized')
    return
  }

  // ... rest unchanged (wsClients.set, ws.on('message'), etc.)
```

**Step 5: Update HTTP bearer auth to also accept JWT**

Replace the static bearer auth middleware with a custom one that accepts both:

```typescript
// Auth middleware: accepts JWT (Authorization: Bearer <jwt>) or legacy static token
app.use('/sessions/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  const token = authHeader.slice(7)

  // Try JWT verification first
  if (jwtSecretKey) {
    try {
      await jwtVerify(token, jwtSecretKey)
      return next()
    } catch { /* fall through to legacy */ }
  }

  // Legacy static token
  if (WA_BRIDGE_SECRET && token === WA_BRIDGE_SECRET) return next()

  return c.json({ error: 'Unauthorized' }, 401)
})
app.use('/sessions', async (c, next) => {
  // Same middleware — extract to a shared function
})
app.use('/analysis/*', async (c, next) => {
  // Same middleware
})
```

Better: extract to a reusable middleware function:

```typescript
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  const token = authHeader.slice(7)

  // Try JWT first
  if (jwtSecretKey) {
    try {
      await jwtVerify(token, jwtSecretKey)
      return next()
    } catch { /* fall through */ }
  }

  // Legacy static token fallback
  if (WA_BRIDGE_SECRET && token === WA_BRIDGE_SECRET) return next()

  return c.json({ error: 'Unauthorized' }, 401)
}

app.use('/sessions/*', authMiddleware)
app.use('/sessions', authMiddleware)
app.use('/analysis/*', authMiddleware)
```

**Step 6: Build and verify**

```bash
cd apps/wa-bridge && pnpm run check-types
```

Expected: No type errors.

---

### Task 4: Update env vars

**Files:**
- Modify: `.env.local`

**Step 1: Generate a JWT secret**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Step 2: Add to .env.local**

```
WA_BRIDGE_JWT_SECRET=<generated-value>
```

Keep `WA_BRIDGE_SECRET` for now (backward compat during migration).

**Step 3: Verify local dev works**

```bash
pnpm run dev
```

Open browser to `http://localhost:9941/chat`, verify WS connects and messages load.

---

### Task 5: Update Railway env vars and deploy

**Step 1: Set JWT secret on Railway**

Using Railway MCP tools, set `WA_BRIDGE_JWT_SECRET` on both the web and wa-bridge services (same value).

**Step 2: Deploy wa-bridge first**

Deploy wa-bridge — it now accepts both old token and new JWT.

**Step 3: Deploy web**

Deploy web — it now sends JWT instead of static token.

**Step 4: Verify in prod**

Check Railway logs for `[ws/chat] upstream connected` — confirms JWT auth is working.

---

### Task 6: Remove legacy token support (follow-up)

After confirming prod works with JWT:

**Files:**
- Modify: `apps/wa-bridge/src/index.ts` — remove `WA_BRIDGE_SECRET` fallback from `verifyBridgeAuth` and `authMiddleware`
- Modify: `.env.local` — remove `WA_BRIDGE_SECRET`
- Railway: remove `WA_BRIDGE_SECRET` env var from both services

This task should be done in a separate PR after JWT auth is confirmed working in prod.
