# Environment Variables

All required and optional environment variables for Amore Couples services.

## Shared (used by multiple services)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. On Railway, use `${{Postgres.DATABASE_URL}}` reference. |
| `REDIS_URL` | Yes | Redis connection string for caching and pub/sub. |
| `WA_BRIDGE_JWT_SECRET` | Yes | Shared JWT secret between web and wa-bridge for service-to-service auth. |

## Web App (`apps/web`)

### Core

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Secret key for better-auth session signing. |
| `BETTER_AUTH_URL` | Yes | Public URL of the web service (e.g., `https://web-production-08d3b.up.railway.app`). Must match the deployed URL. |
| `WEB_APP_URL` | Yes | Public URL of the web app. Used for CORS and redirects. |
| `WA_BRIDGE_URL` | Yes | URL of the wa-bridge service. On Railway, prefer internal URL: `http://wa-bridge.railway.internal:3000`. |
| `PORT` | No | Server port. Default: `3000`. Set by Railway automatically. |
| `SITE_PASSWORD` | No | Beta gate password. If set, visitors must enter this to access the site. Remove to disable. |

### AI

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude (coach, analysis, mood detection). |

### Push Notifications (VAPID)

| Variable | Required | Description |
|----------|----------|-------------|
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for web push. Generate with `npx web-push generate-vapid-keys`. |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for web push. Keep secret. |
| `VAPID_SUBJECT` | Yes | VAPID subject (e.g., `mailto:you@example.com`). Required by web push spec. |
| `VITE_VAPID_PUBLIC_KEY` | Yes | Same value as `VAPID_PUBLIC_KEY`. Must be set at **build time** (Vite `import.meta.env`). |

### Stripe (future)

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | No | Stripe API secret key for server-side billing. |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook endpoint signing secret. |
| `STRIPE_PRICE_ID` | No | Stripe recurring price ID for the Amore Premium subscription. |
| `VITE_STRIPE_PUBLIC_KEY` | No | Stripe publishable key. Build-time variable for client. |

### Google OAuth (currently disabled)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID. Not currently used (email/password auth only). |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |

## WA Bridge (`apps/wa-bridge`)

| Variable | Required | Description |
|----------|----------|-------------|
| `WA_BRIDGE_PORT` | No | Server port. Default: `3000`. |
| `WEB_APP_URL` | Yes | Web app URL for CORS configuration. |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for AI analysis triggers. |

## Notes

- **Build-time vs runtime:** Variables prefixed with `VITE_` are embedded at build time by Vite. They must be set in Railway **before** the Docker build runs, not just at runtime.
- **Railway references:** Use Railway variable references (e.g., `${{Postgres.DATABASE_URL}}`) for database URLs to automatically pick up connection pooler settings.
- **Internal networking:** For service-to-service calls on Railway, use internal URLs (`*.railway.internal`) instead of public URLs to avoid egress and latency.
- **Generating VAPID keys:** Run `npx web-push generate-vapid-keys` once. Set the same public key for both `VAPID_PUBLIC_KEY` and `VITE_VAPID_PUBLIC_KEY`.
