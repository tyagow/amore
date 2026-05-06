# TICKET-008: Production Security Hardening

## Priority: P1 — High

## Problem Statement

The application has no rate limiting, no CSRF protection, no security headers, and no input validation audit. This is acceptable for a private beta behind `SITE_PASSWORD`, but unacceptable for a production launch. Specific concerns:

1. **No rate limiting:** Every AI-powered endpoint calls Anthropic's API which costs money. The coach SSE stream (`/sse/coach`) calls Claude Sonnet for streaming + intent classification + memory extraction — approximately $0.01-0.05 per exchange. There is no protection against a user (or bot) hammering these endpoints. The monetization gating (TICKET-005 Phase 2) limits free users to 5 coach messages/day, but premium users have no server-side throttle. A compromised premium account could rack up unlimited Anthropic API charges.

   AI-cost endpoints that need rate limiting:
   - `GET /sse/coach` — Claude Sonnet streaming (most expensive)
   - `POST getChatAIReview` — Sonnet tone review
   - `POST getChatAISuggestions` — Haiku reply suggestions
   - `POST getChatAIMood` — Haiku live mood
   - `POST triggerAnalysis` — Full Sonnet analysis pipeline
   - `POST triggerMoodDetection` — Haiku mood detection
   - `POST generateMoodCoachingTips` — Sonnet coaching tips
   - `POST getAISuggestedGoals` — Goal suggestions
   - `POST getCoachStarter` — Haiku starter generation

2. **No CORS on web app:** The wa-bridge has CORS configured (origin: `WEB_APP_URL`), but the web app's Nitro server has no CORS middleware. The SSE endpoints, WebSocket, and API routes are accessible from any origin.

3. **No CSRF protection:** TanStack Start server functions use `createServerFn()` which makes POST requests. There is no CSRF token validation. Better Auth handles its own CSRF for auth routes, but all custom server functions are unprotected.

4. **No security headers:** No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy headers. The app is vulnerable to clickjacking and MIME-type sniffing attacks.

5. **Client bundle audit needed:** Vite exposes all `VITE_*` prefixed env vars to the client bundle. Currently `VITE_VAPID_PUBLIC_KEY` is the only one (which is safe — VAPID public keys are public). But any future `VITE_` variable additions need auditing to ensure no secrets leak.

6. **Input validation gaps:** New server functions from TICKET-001 through TICKET-005 accept user input (mood values, check-in answers, chat export files, coach messages). These need validation to prevent injection or oversized payloads.

7. **Site password decision:** The `SITE_PASSWORD` gate (`apps/web/server/middleware/site-password.ts`) uses HTTP Basic Auth. For launch, this needs a decision: remove it (public launch), keep it (invite-only), or replace it with a proper invite system.

8. **Push notification consent:** The web push subscription flow in `push-opt-in.tsx` requests browser permission. The server must only send notifications to users who have explicitly opted in (have a row in `push_subscriptions`). This is already the case by design, but should be verified.

## Technical Design

### Phase 1: Rate Limiting

Add rate limiting middleware to the Nitro server. Since this is a Nitro app (not Express/Hono), use a simple in-memory rate limiter or Redis-backed limiter.

**Option A: In-memory rate limiter (simpler, works for single-instance Railway deployment):**

Create `apps/web/server/middleware/rate-limit.ts`:
```typescript
import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

const windows = new Map<string, { count: number; resetAt: number }>()
const AI_RATE_LIMIT = 30  // requests per window
const AI_WINDOW_MS = 60_000  // 1 minute

export default defineEventHandler((event) => {
  const path = event.path
  // Only rate-limit AI-heavy endpoints
  if (!isAIEndpoint(path)) return

  const userId = extractUserId(event) ?? getClientIP(event)
  const key = `${userId}:${path}`
  // ... rate limit logic
})
```

**Rate limits by endpoint tier:**

| Tier | Endpoints | Limit | Window |
|------|-----------|-------|--------|
| AI-Heavy | `/sse/coach`, `triggerAnalysis` | 10/min | 1 min |
| AI-Light | `getChatAISuggestions`, `getChatAIMood`, `getChatAIReview`, `getCoachStarter` | 30/min | 1 min |
| Standard | All other API routes | 120/min | 1 min |
| Auth | `/api/auth/sign-in`, `/api/auth/sign-up` | 5/min | 1 min |

Return `429 Too Many Requests` with `Retry-After` header when limit exceeded.

**Option B: Redis-backed (for future multi-instance):**
Use the existing Redis service on Railway. Add `ioredis` to web dependencies. Sliding window counter pattern.

Recommendation: Start with Option A (in-memory). Single Railway instance means no shared state needed. Migrate to Redis if scaling to multiple instances.

### Phase 2: Security Headers

Create `apps/web/server/middleware/security-headers.ts`:
```typescript
import { defineEventHandler, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '0',  // Disabled per modern best practice
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })

  // HSTS only in production (HTTPS)
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    setResponseHeaders(event, {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    })
  }
})
```

**CSP (Content-Security-Policy):** Start permissive, tighten over time:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' wss://*.up.railway.app https://*.up.railway.app;
font-src 'self';
```

Note: `unsafe-inline` and `unsafe-eval` are needed for Vite SSR hydration and TanStack Start. Can be tightened with nonces in a future iteration.

### Phase 3: CORS Configuration

Create `apps/web/server/middleware/cors.ts` for the Nitro server:
```typescript
import { defineEventHandler, setResponseHeaders, getRequestHeader, isPreflightRequest, sendNoContent } from 'h3'

const ALLOWED_ORIGINS = [
  process.env.WEB_APP_URL,
  'https://web-production-08d3b.up.railway.app',
].filter(Boolean)

export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin')
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    })
  }
  if (isPreflightRequest(event)) return sendNoContent(event)
})
```

### Phase 4: Input Validation Audit

Audit all new server functions for input validation. TanStack Start server functions use Zod for some inputs but not consistently.

**Files to audit:**
- `apps/web/src/server/coach.ts` — `saveCoachExchange` accepts `message` string (validate max length)
- `apps/web/src/server/mood.ts` — `setMood` accepts mood value (validate enum)
- `apps/web/src/server/chat-export.ts` — File upload (validate size, type)
- `apps/web/src/server/checkin.ts` — Check-in data (validate mood enum, answer length)
- `apps/web/src/server/goals.ts` — `createGoal` accepts title/description (validate lengths)
- `apps/web/src/server/connections.ts` — `searchAndSendRequest` accepts email (validate format)
- `apps/web/src/server/profile.ts` — `updateProfile` accepts JSONB fields (validate structure)

**Validation pattern:**
```typescript
import { z } from 'zod'

const moodSchema = z.enum(['great', 'good', 'neutral', 'low', 'struggling'])
const coachMessageSchema = z.string().min(1).max(5000)
const goalTitleSchema = z.string().min(1).max(255)
```

### Phase 5: Site Password Decision & Client Bundle Audit

1. **Site password:** Make configurable — if `SITE_PASSWORD` env var is set, enable the gate. If not set, the middleware returns early (already implemented in `apps/web/server/middleware/site-password.ts` line 9: `if (!password) return`). For launch, REMOVE the `SITE_PASSWORD` env var from Railway to disable the gate.

2. **Client bundle audit:**
   ```bash
   # After building, check what VITE_ vars are in the bundle
   grep -r "VITE_" apps/web/.output/public/ --include="*.js" | grep -v node_modules
   ```
   Verify only `VITE_VAPID_PUBLIC_KEY` appears. VAPID public keys are safe to expose (they're public keys by definition).

## Acceptance Criteria

### Phase 1: Rate Limiting
- [ ] AC-1.1: `apps/web/server/middleware/rate-limit.ts` exists and is auto-loaded by Nitro as middleware.
- [ ] AC-1.2: Sending 11 requests to `/sse/coach` within 1 minute from the same user results in the 11th request receiving HTTP 429 with a `Retry-After` header.
- [ ] AC-1.3: Sending 6 requests to `/api/auth/sign-in` within 1 minute from the same IP results in the 6th request receiving HTTP 429.
- [ ] AC-1.4: Normal usage (1 coach message, 2 suggestions, 1 mood check within 1 minute) is NOT rate-limited.

### Phase 2: Security Headers
- [ ] AC-2.1: HTTP response from the web app includes `X-Frame-Options: DENY` header.
- [ ] AC-2.2: HTTP response includes `X-Content-Type-Options: nosniff` header.
- [ ] AC-2.3: HTTP response includes `Referrer-Policy: strict-origin-when-cross-origin` header.
- [ ] AC-2.4: In production (Railway), HTTP response includes `Strict-Transport-Security` header with `max-age` >= 31536000.
- [ ] AC-2.5: HTTP response includes a `Content-Security-Policy` header that allows `'self'` for default-src.

### Phase 3: CORS
- [ ] AC-3.1: A cross-origin request from an unauthorized origin (e.g., `http://evil.com`) to any API endpoint does NOT include `Access-Control-Allow-Origin` in the response.
- [ ] AC-3.2: A cross-origin request from the configured `WEB_APP_URL` includes `Access-Control-Allow-Origin` matching that URL.
- [ ] AC-3.3: Preflight OPTIONS requests from allowed origins return 204 with correct CORS headers.

### Phase 4: Input Validation
- [ ] AC-4.1: Sending a coach message longer than 5000 characters to `saveCoachExchange` returns a validation error (not a DB error or unhandled exception).
- [ ] AC-4.2: Sending an invalid mood value (e.g., `mood: "hacked"`) to `setMood` returns a validation error.
- [ ] AC-4.3: Sending a goal title longer than 255 characters to `createGoal` returns a validation error.
- [ ] AC-4.4: All new server functions from TICKET-001 through TICKET-005 have Zod schema validation on their inputs.

### Phase 5: Site Password & Bundle Audit
- [ ] AC-5.1: When `SITE_PASSWORD` env var is NOT set on Railway, the web app loads without any Basic Auth prompt.
- [ ] AC-5.2: When `SITE_PASSWORD` is set, the app requires Basic Auth (existing behavior preserved).
- [ ] AC-5.3: Running `grep -r "VITE_" apps/web/.output/public/ --include="*.js"` after build only shows `VITE_VAPID_PUBLIC_KEY`. No other secrets or API keys appear.

## Dependencies

- **TICKET-007** (Railway Deploy) — Security middleware deploys with the web app.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Rate limiting | 2-3 hours | Middleware + testing across endpoint tiers |
| Phase 2: Security headers | 30 min | Single middleware file |
| Phase 3: CORS | 30 min | Single middleware file |
| Phase 4: Input validation | 2-3 hours | Audit + add Zod schemas to ~10 server functions |
| Phase 5: Site password + audit | 30 min | Config change + grep check |
| **Total** | **5-7 hours** | |
