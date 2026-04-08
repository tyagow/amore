import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  setResponseHeader,
  setResponseStatus,
} from 'h3'

// ── Rate limit buckets ──────────────────────────────────

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}, 60_000)

// ── Tier definitions ────────────────────────────────────

interface Tier {
  limit: number
  windowMs: number
}

const TIERS: { pattern: RegExp; tier: Tier }[] = [
  // SSE coach — expensive Sonnet streaming
  { pattern: /^\/sse\/coach/, tier: { limit: 10, windowMs: 60_000 } },
  // API routes (auth, etc.)
  { pattern: /^\/api\//, tier: { limit: 60, windowMs: 60_000 } },
  // TanStack RPC (_server)
  { pattern: /^\/_server\//, tier: { limit: 120, windowMs: 60_000 } },
]

const DEFAULT_TIER: Tier = { limit: 200, windowMs: 60_000 }

// ── Skip paths ──────────────────────────────────────────

const SKIP_PATHS = ['/api/health', '/health', '/_health']

function getTier(path: string): Tier {
  for (const { pattern, tier } of TIERS) {
    if (pattern.test(path)) return tier
  }
  return DEFAULT_TIER
}

function getClientIP(event: Parameters<typeof getRequestHeader>[0]): string {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (client) IP
    return forwarded.split(',')[0].trim()
  }
  return getRequestIP(event) ?? 'unknown'
}

export default defineEventHandler((event) => {
  const path = event.path

  // Skip health checks
  if (SKIP_PATHS.some((p) => path === p)) return

  // Skip non-API paths (static assets, pages)
  // Only rate-limit /sse/, /api/, /_server/ and let the default tier catch others
  // But we still want the default tier for page loads, so we apply to everything
  // except static assets
  if (path.startsWith('/_build/') || path.startsWith('/assets/') || path.match(/\.\w{2,5}$/)) {
    return
  }

  const ip = getClientIP(event)
  const tier = getTier(path)

  // Use IP + tier pattern as key (so limits are per-tier, not global)
  const tierKey = TIERS.find((t) => t.pattern.test(path))?.pattern.source ?? 'default'
  const key = `${ip}:${tierKey}`

  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + tier.windowMs }
    buckets.set(key, bucket)
  }

  bucket.count++

  // Set rate limit headers
  const remaining = Math.max(0, tier.limit - bucket.count)
  setResponseHeader(event, 'X-RateLimit-Limit', String(tier.limit))
  setResponseHeader(event, 'X-RateLimit-Remaining', String(remaining))
  setResponseHeader(event, 'X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

  if (bucket.count > tier.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', String(retryAfter))
    setResponseStatus(event, 429, 'Too Many Requests')
    return { error: 'Too many requests. Please try again later.', retryAfter }
  }
})
