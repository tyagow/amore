# TICKET-010: Production Monitoring & Observability

## Priority: P1 — High

## Problem Statement

The application has zero production monitoring, error tracking, or alerting. When something breaks in production, the only way to discover it is:

1. A user reports it (Tiago or Jaluza notice something is wrong)
2. Manually checking Railway logs via dashboard or MCP (`get-logs`)
3. Manually querying the database for anomalies

Specific gaps:

1. **No error tracking:** Server-side errors (failed AI calls, DB query errors, WebSocket disconnects) are logged to stdout via `console.error` or Pino logger (wa-bridge). Railway captures these in its log viewer, but there is no aggregation, deduplication, or alerting. A spike in Anthropic API errors (rate limit, quota exceeded) would go unnoticed until users complain.

2. **No uptime monitoring:** If the web service crashes or becomes unresponsive, there is no external monitor to detect it. Railway restarts crashed containers, but sustained failures (OOM, infinite loops, stuck connections) may not trigger a restart.

3. **No AI cost visibility:** Anthropic API usage is not tracked per-couple or per-feature. The `feature_usage` table (TICKET-005) tracks free-tier limits but does NOT track actual API token usage or cost. A single premium couple using the coach heavily could consume $50+/month in Sonnet calls without anyone knowing.

4. **No push notification metrics:** The `notification_deliveries` table tracks delivery status, but there's no dashboard or alerting on delivery failure rates. If VAPID keys expire or web-push starts failing, it would be invisible.

5. **Health check coverage:** wa-bridge has `GET /health` but it only returns `{ ok: true }` — it doesn't verify DB connectivity or session manager health. The web service has no health endpoint at all (addressed in TICKET-007 Phase 3).

## Technical Design

### Phase 1: Structured Logging

Standardize logging across both services so Railway log viewer is useful for debugging.

**wa-bridge** already uses Pino (`apps/wa-bridge/src/logger.ts`). Keep as-is.

**Web app** uses `console.log/error/warn` throughout. Add a simple structured logger:

Create `apps/web/src/lib/logger.ts`:
```typescript
export function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    msg: message,
    time: new Date().toISOString(),
    service: 'web',
    ...meta,
  }
  if (level === 'error') console.error(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}
```

Replace raw `console.error` calls in server functions with structured log calls. This makes Railway logs searchable by level, service, and context fields.

### Phase 2: Error Tracking (Sentry)

Add Sentry to both services for error aggregation, deduplication, and alerting.

**Web app (`apps/web`):**
```bash
pnpm add @sentry/node
```

Initialize in `apps/web/server/plugins/sentry.ts` (Nitro auto-loads plugins):
```typescript
import * as Sentry from '@sentry/node'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.RAILWAY_ENVIRONMENT ?? 'development',
    tracesSampleRate: 0.1,  // 10% of transactions for performance
  })
}
```

Add error boundary in Nitro error handler to capture unhandled errors.

**wa-bridge (`apps/wa-bridge`):**
```bash
cd apps/wa-bridge && pnpm add @sentry/node
```

Initialize in `apps/wa-bridge/src/index.ts` before other setup.

**Environment variables:**
| Variable | Service | Value |
|----------|---------|-------|
| `SENTRY_DSN` | web | Sentry project DSN |
| `SENTRY_DSN` | wa-bridge | Same or separate Sentry project |
| `SENTRY_ENVIRONMENT` | Both | `production` (Railway sets `RAILWAY_ENVIRONMENT`) |

### Phase 3: AI Cost Monitoring

Track Anthropic API usage per call in a lightweight way.

**Option A: Anthropic API usage headers** — The Anthropic API returns usage in response headers (`anthropic-ratelimit-*`) and in the response body (`usage.input_tokens`, `usage.output_tokens`). Parse these in the AI package.

Add to `packages/ai/src/config.ts` (the shared retry/parsing layer):
```typescript
export function logAIUsage(
  fn: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  coupleId?: string,
) {
  console.log(JSON.stringify({
    level: 'info',
    msg: 'ai_usage',
    fn,
    model,
    inputTokens,
    outputTokens,
    estimatedCost: estimateCost(model, inputTokens, outputTokens),
    coupleId,
    time: new Date().toISOString(),
  }))
}

function estimateCost(model: string, input: number, output: number): number {
  // Approximate costs (update as pricing changes)
  if (model.includes('sonnet')) return (input * 3 + output * 15) / 1_000_000
  if (model.includes('haiku')) return (input * 0.25 + output * 1.25) / 1_000_000
  return 0
}
```

Call `logAIUsage()` after every Anthropic API call. This makes AI costs visible in Railway logs and Sentry breadcrumbs.

**Option B: DB tracking** — Insert usage into a new `ai_usage` table. Heavier but enables dashboards. Defer to a future iteration.

Recommendation: Start with Option A (log-based). Use Railway's log search to query `msg: "ai_usage"` and aggregate. Move to DB tracking only if needed.

### Phase 4: Health Check Depth

Enhance health endpoints to verify downstream dependencies:

**wa-bridge `GET /health`** (already exists, enhance):
```typescript
app.get('/health', async (c) => {
  const dbOk = await pool.query('SELECT 1').then(() => true).catch(() => false)
  const sessionsCount = manager.getActiveSessions().length
  return c.json({
    ok: dbOk,
    service: 'wa-bridge',
    db: dbOk ? 'connected' : 'disconnected',
    activeSessions: sessionsCount,
    uptime: process.uptime(),
  })
})
```

**Web `GET /api/health`** (created in TICKET-007, enhance):
```typescript
export default defineEventHandler(async () => {
  const dbOk = await db.execute(sql`SELECT 1`).then(() => true).catch(() => false)
  return {
    ok: dbOk,
    service: 'web',
    db: dbOk ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  }
})
```

### Phase 5: Uptime Monitoring & Alerting

Use an external uptime monitor (free tier options):

1. **BetterUptime / UptimeRobot / Railway's built-in monitors** — Ping health endpoints every 1-5 minutes.
2. Alert via email or Telegram when health check fails.

Configure monitors:
| Monitor | URL | Expected | Interval |
|---------|-----|----------|----------|
| Web health | `https://web-production-08d3b.up.railway.app/api/health` | HTTP 200 + `ok: true` | 3 min |
| WA-Bridge health | `https://wa-bridge-production-e26e.up.railway.app/health` | HTTP 200 + `ok: true` | 3 min |

### Phase 6: Notification Delivery Metrics

Add a simple metrics endpoint or log aggregation for push notification health:

```typescript
// In packages/notifications or apps/web
export async function getNotificationMetrics(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)
  const metrics = await db
    .select({
      status: notificationDeliveries.status,
      count: sql<number>`count(*)::int`,
    })
    .from(notificationDeliveries)
    .where(gte(notificationDeliveries.createdAt, since))
    .groupBy(notificationDeliveries.status)
  return metrics
}
```

Log notification delivery rates daily or expose via health endpoint extension.

## Acceptance Criteria

### Phase 1: Structured Logging
- [ ] AC-1.1: `apps/web/src/lib/logger.ts` exists and exports a `log()` function that outputs JSON with `level`, `msg`, `time`, and `service` fields.
- [ ] AC-1.2: At least 5 server function error paths in `apps/web/src/server/` use the structured logger instead of raw `console.error`.
- [ ] AC-1.3: Railway log viewer shows JSON-formatted log entries from the web service that are filterable by `level`.

### Phase 2: Error Tracking
- [ ] AC-2.1: `@sentry/node` is listed in both `apps/web/package.json` and `apps/wa-bridge/package.json` dependencies.
- [ ] AC-2.2: Sentry is initialized conditionally (only when `SENTRY_DSN` env var is set) in both services — no crash on startup when DSN is missing.
- [ ] AC-2.3: An unhandled error in a server function appears in the Sentry dashboard within 60 seconds.
- [ ] AC-2.4: Railway web and wa-bridge services have `SENTRY_DSN` environment variable set.

### Phase 3: AI Cost Monitoring
- [ ] AC-3.1: Every Anthropic API call in `packages/ai/src/` logs a structured entry with `msg: "ai_usage"`, `model`, `inputTokens`, `outputTokens`, and `estimatedCost`.
- [ ] AC-3.2: Searching Railway logs for `ai_usage` returns entries for coach conversations, analysis, tone review, and mood detection.
- [ ] AC-3.3: The `estimatedCost` field uses correct per-token pricing for Sonnet and Haiku models.

### Phase 4: Health Check Depth
- [ ] AC-4.1: `GET /health` on wa-bridge returns a JSON body with `db` field showing `'connected'` or `'disconnected'`.
- [ ] AC-4.2: `GET /api/health` on web returns a JSON body with `db` field showing `'connected'` or `'disconnected'`.
- [ ] AC-4.3: When the database is unreachable, health endpoints return `ok: false` (not a 500 error or timeout).

### Phase 5: Uptime Monitoring
- [ ] AC-5.1: An external uptime monitor is configured to ping both health endpoints at least every 5 minutes.
- [ ] AC-5.2: Alert notification (email or Telegram) fires when a health check fails 3 consecutive times.

### Phase 6: Notification Metrics
- [ ] AC-6.1: A function exists that returns notification delivery counts grouped by status (delivered, failed, pending) for the last 24 hours.
- [ ] AC-6.2: Push notification failure rate is visible either in Sentry (via logged errors) or in the health endpoint.

## Dependencies

- **TICKET-007** (Railway Deploy) — Health endpoints and env vars deploy with the application.
- **Sentry account** — Free tier is sufficient (5K errors/month, 10K transactions/month).

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Structured logging | 1-2 hours | Create logger, update ~10 files |
| Phase 2: Error tracking (Sentry) | 1-2 hours | Install, configure, test |
| Phase 3: AI cost monitoring | 1-2 hours | Add logging to all AI functions in `packages/ai/` |
| Phase 4: Health check depth | 30 min | Enhance existing endpoints |
| Phase 5: Uptime monitoring | 30 min | External service config |
| Phase 6: Notification metrics | 30 min | Query function + log/endpoint |
| **Total** | **5-7 hours** | |
