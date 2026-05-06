# TICKET-007: Railway Deploy Pipeline & Environment

## Priority: P0 — Critical

## Problem Statement

The Railway deployment is partially configured — web and wa-bridge services exist with Dockerfiles and environment variables, but the setup predates TICKET-001 through TICKET-005. Several critical gaps exist:

1. **Missing environment variables:** The new features require env vars not yet set on Railway:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — Required for web push notifications (TICKET-001). The `packages/notifications/src/channels/web-push.ts` gracefully degrades (warns and disables push) but notifications won't work without these.
   - `VITE_VAPID_PUBLIC_KEY` — Required client-side for push subscription in `apps/web/src/routes/_authenticated/-components/push-opt-in.tsx`. This is a build-time variable (Vite `import.meta.env`) that must be set BEFORE the Docker build, not at runtime.
   - `SITE_PASSWORD` — Currently set for beta protection. Needs a decision: keep, remove, or make configurable.

2. **Dockerfile issues:**
   - Web Dockerfile (`apps/web/Dockerfile`) copies `packages/db/drizzle` and `packages/db/scripts/run-migrations.mjs` but does NOT copy `packages/notifications/` into the runner stage. The web service depends on `@amore-couples/notifications` at runtime.
   - Web Dockerfile base image says `node:22-slim` but deployment.md mentions `node:20-slim` — inconsistency to verify.
   - Neither Dockerfile copies `.env.local` (correct — env vars come from Railway), but the `VITE_*` prefix vars need to be available at build time.

3. **No health check on web service:** wa-bridge has `GET /health` returning `{ ok: true }`. The web app (Nitro/TanStack Start) has no health endpoint. Railway health checks will use TCP by default, which doesn't catch application-level failures.

4. **Build verification:** No process to verify builds succeed on Railway before deploying to production. Current deploy method is `railway up` which uploads local code. No preview deployments.

5. **Service-to-service networking:** wa-bridge CORS is configured with `WEB_APP_URL` which may be set to localhost or the public Railway URL. Internal Railway networking (`*.railway.internal`) is more efficient for service-to-service calls but requires specific configuration.

6. **Deploy order matters:** DB migrations run on service startup (`start.mjs` calls `runMigrations()`). If both services start simultaneously and the migration hasn't run yet, one may fail. The advisory lock in `run-migrations.mjs` handles concurrent migrations, but the losing service may error on missing tables during its first requests.

## Technical Design

### Phase 1: Fix Dockerfiles for New Packages

**`apps/web/Dockerfile`** — The runner stage needs the notifications package:

```dockerfile
# In deps stage, add:
COPY packages/notifications/package.json packages/notifications/

# In runner stage, add:
COPY --from=deps /app/packages/notifications/node_modules ./packages/notifications/node_modules
COPY packages/notifications/ ./packages/notifications/
```

Also verify the build stage copies all workspace packages needed at build time (for Vite to resolve `@amore-couples/notifications` imports).

### Phase 2: Set Railway Environment Variables

Generate VAPID keys (one-time):
```bash
npx web-push generate-vapid-keys
```

Set on Railway web service:
| Variable | Value | Notes |
|----------|-------|-------|
| `VAPID_PUBLIC_KEY` | (generated) | Server-side, used by web-push library |
| `VAPID_PRIVATE_KEY` | (generated) | Server-side, NEVER expose to client |
| `VAPID_SUBJECT` | `mailto:tiago@amore.app` (or actual email) | Required by web-push spec |
| `VITE_VAPID_PUBLIC_KEY` | Same as VAPID_PUBLIC_KEY | Build-time variable for client |

Verify existing variables are correct:
| Variable | Check |
|----------|-------|
| `WA_BRIDGE_URL` | Should use Railway internal URL: `http://wa-bridge.railway.internal:8080` for efficiency. Currently may be public URL. |
| `WEB_APP_URL` | Should be `https://web-production-08d3b.up.railway.app` (or custom domain) |
| `BETTER_AUTH_URL` | Must match the public URL of the web service |
| `DATABASE_URL` | Should use `${{Postgres.DATABASE_URL}}` Railway reference |

### Phase 3: Add Health Check to Web Service

Create `apps/web/server/routes/api/health.ts`:
```typescript
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return { ok: true, service: 'web', timestamp: new Date().toISOString() }
})
```

This gives Railway a proper health check endpoint at `GET /api/health`.

### Phase 4: Build & Deploy Verification

1. **Local build test** before deploying:
   ```bash
   pnpm build  # Full turborepo build
   pnpm check-types  # TypeScript verification
   ```

2. **Docker build test:**
   ```bash
   docker build -f apps/web/Dockerfile -t amore-web .
   docker build -f apps/wa-bridge/Dockerfile -t amore-wa-bridge .
   ```

3. **Deploy to Railway:**
   ```bash
   # Deploy wa-bridge first (no frontend dependency)
   railway up --service wa-bridge
   # Verify wa-bridge health
   curl https://wa-bridge-production-e26e.up.railway.app/health
   # Deploy web
   railway up --service web
   # Verify web health
   curl https://web-production-08d3b.up.railway.app/api/health
   ```

4. **Post-deploy smoke test:**
   - Login page loads
   - Dashboard renders for authenticated user
   - WebSocket chat connects (checks wa-bridge connectivity)
   - Coach sidebar opens and streams (checks AI + DB)
   - Push notification opt-in prompt appears (checks VAPID config)

### Phase 5: Rollback Strategy

Railway supports instant rollback to previous deployments:
```bash
railway deployments list --service web
railway rollback --service web --deployment <previous-id>
```

Document the rollback process and verify it works before launch.

## Acceptance Criteria

### Phase 1: Dockerfiles
- [ ] AC-1.1: `apps/web/Dockerfile` copies `packages/notifications/package.json` in the deps stage and includes `packages/notifications/` content in the runner stage.
- [ ] AC-1.2: Running `docker build -f apps/web/Dockerfile -t amore-web .` from the repo root succeeds with exit code 0.
- [ ] AC-1.3: Running `docker build -f apps/wa-bridge/Dockerfile -t amore-wa-bridge .` from the repo root succeeds with exit code 0.
- [ ] AC-1.4: Running `docker run --rm amore-web node -e "require('./packages/notifications/src/channels/web-push.ts')"` does not throw a MODULE_NOT_FOUND error (or equivalent TSX check).

### Phase 2: Environment Variables
- [ ] AC-2.1: Railway web service has `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `VITE_VAPID_PUBLIC_KEY` set (verified via Railway MCP `list-variables` or dashboard).
- [ ] AC-2.2: `VITE_VAPID_PUBLIC_KEY` value matches `VAPID_PUBLIC_KEY` value.
- [ ] AC-2.3: `WA_BRIDGE_URL` on the web service is set to Railway internal URL (`http://wa-bridge.railway.internal:PORT`) or verified public URL.
- [ ] AC-2.4: `BETTER_AUTH_URL` matches the public URL of the web service on Railway.
- [ ] AC-2.5: `.env.example` is updated with all new env vars (VAPID keys, VITE_VAPID_PUBLIC_KEY) with placeholder values and comments.

### Phase 3: Health Checks
- [ ] AC-3.1: `GET /api/health` on the deployed web service returns HTTP 200 with JSON body containing `{ ok: true }`.
- [ ] AC-3.2: `GET /health` on the deployed wa-bridge service returns HTTP 200 with JSON body containing `{ ok: true }`.
- [ ] AC-3.3: Railway health check configuration for both services points to their respective health endpoints.

### Phase 4: Build & Deploy
- [ ] AC-4.1: `pnpm build` succeeds with exit code 0 from the repo root.
- [ ] AC-4.2: `pnpm check-types` succeeds with exit code 0 from the repo root.
- [ ] AC-4.3: Both services are deployed and running on Railway (verified via `railway status` or MCP tools).
- [ ] AC-4.4: The web app login page loads at the Railway public URL without errors.
- [ ] AC-4.5: The site-password gate works as expected (or is removed per decision in TICKET-008).

### Phase 5: Rollback
- [ ] AC-5.1: A previous deployment ID for each service is documented for quick rollback reference.
- [ ] AC-5.2: The rollback command is documented and verified to work (rollback to previous, then re-deploy current).

## Dependencies

- **TICKET-006** (DB Migration) — Must complete before deploying new code, since `start.mjs` runs migrations and new code references new tables.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Fix Dockerfiles | 1 hour | Modify + test Docker builds locally |
| Phase 2: Env vars | 30 min | Generate VAPID keys, set via Railway dashboard/MCP |
| Phase 3: Health check | 15 min | Single file + Railway config |
| Phase 4: Build & deploy | 1-2 hours | Build, deploy, smoke test |
| Phase 5: Rollback | 15 min | Document + verify |
| **Total** | **3-4 hours** | |
