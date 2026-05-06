# TICKET-011: Dev-to-Prod Workflow & CI/CD

## Priority: P2 — Medium

## Problem Statement

The current development-to-production workflow has no automation, no safety nets, and no consistency:

1. **No CI/CD pipeline:** There are no GitHub Actions workflows. The project repo lives at `github-tyagow:tyagow/amore` (personal GitHub, SSH). Pushes to `main` do NOT trigger any automated checks or deploys. A broken commit can be pushed to main without any build or type-check verification.

2. **Manual deploy process:** Deployment is `railway up` from the local machine. This means:
   - Deploys depend on Tiago's local machine state
   - No audit trail of what was deployed when
   - No verification before deploy (build could fail on Railway even if it passes locally due to env differences)
   - Deploy order (DB first, wa-bridge, then web) is manual and error-prone

3. **No test infrastructure:** There is no vitest/jest configuration. No unit tests, no integration tests, no E2E tests. `pnpm test` runs turbo's test script which would find nothing. The only verification is `pnpm check-types` (TypeScript type checking) and `pnpm build` (build succeeds).

4. **Schema migration strategy unclear:** The project has both `drizzle-kit push` (direct schema sync) and `drizzle-kit generate` + `migrate` (versioned migrations). The `start.mjs` scripts run `migrate()` on startup. But schema changes have historically been done via `push`, leading to journal mismatches. TICKET-006 Phase 4 addresses the strategy, but CI should enforce it.

5. **No environment separation:** The same Railway Postgres is used for dev and prod. There's no staging environment. A broken schema change during development affects production immediately.

6. **No feature flag system:** New features go live for all users on deploy. There's no way to gradually roll out features or disable them if problems are found. The `SITE_PASSWORD` gate is the only "feature flag" (all or nothing access).

## Technical Design

### Phase 1: GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm check-types
      - run: pnpm build
```

This ensures every push to main and every PR is type-checked and builds successfully. No secrets needed for this job.

**Future additions (Phase 2+):**
- Test job (when tests exist)
- Lint job
- Schema validation (verify `drizzle-kit generate` produces no diff)

### Phase 2: Automated Deploy on Main

**Option A: Railway GitHub integration** — Railway's GitHub app can auto-deploy on push to main. However, per deployment.md, the GitHub app is NOT linked (`deploy via railway up`). Link it:
1. In Railway dashboard, connect the GitHub repo
2. Set root directory and Dockerfile path per service
3. Configure auto-deploy on push to `main`

**Option B: GitHub Actions deploy** — If Railway GitHub integration isn't desired, add a deploy job to the CI workflow:
```yaml
  deploy:
    needs: check
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy wa-bridge
        run: railway up --service wa-bridge
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      - name: Deploy web
        run: railway up --service web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Recommendation: **Option A** (Railway GitHub integration) is simpler and gives Railway's build cache advantages. Use Option B only if you need deploy gates (like requiring CI pass before deploy).

### Phase 3: Post-Deploy Smoke Test

Add a smoke test script that verifies critical endpoints after deploy:

Create `scripts/smoke-test.sh`:
```bash
#!/bin/bash
set -e

WEB_URL="${1:-https://web-production-08d3b.up.railway.app}"
BRIDGE_URL="${2:-https://wa-bridge-production-e26e.up.railway.app}"

echo "Smoke testing web: $WEB_URL"
curl -sf "$WEB_URL/api/health" | jq -e '.ok == true' || { echo "FAIL: web health"; exit 1; }

echo "Smoke testing wa-bridge: $BRIDGE_URL"
curl -sf "$BRIDGE_URL/health" | jq -e '.ok == true' || { echo "FAIL: wa-bridge health"; exit 1; }

echo "Checking web login page loads"
STATUS=$(curl -so /dev/null -w '%{http_code}' "$WEB_URL/login")
[ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || { echo "FAIL: login page returned $STATUS"; exit 1; }

echo "All smoke tests passed"
```

Add to CI as a post-deploy step, or run manually after `railway up`.

### Phase 4: Environment Variable Management

Create a documented env var manifest that tracks all variables across environments:

Update `.env.example` with ALL variables needed by all services:
```bash
# === Database ===
DATABASE_URL=postgresql://user:pass@host:5432/db

# === Auth ===
BETTER_AUTH_SECRET=random-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:9941
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === AI ===
ANTHROPIC_API_KEY=sk-ant-...

# === WhatsApp Bridge ===
WA_BRIDGE_URL=http://localhost:9945
WA_BRIDGE_JWT_SECRET=shared-jwt-secret-min-32-chars
WA_BRIDGE_PORT=9945
WEB_APP_URL=http://localhost:9941

# === Push Notifications ===
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
VITE_VAPID_PUBLIC_KEY=  # Must match VAPID_PUBLIC_KEY (build-time)

# === Stripe (optional — Stripe routes disabled without these) ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# === Monitoring (optional) ===
SENTRY_DSN=https://...@sentry.io/...

# === Security (optional) ===
SITE_PASSWORD=  # Set to enable HTTP Basic Auth gate

# === Redis (optional) ===
REDIS_URL=redis://localhost:6381

# === Migration Strategy ===
# Use `npx drizzle-kit generate` to create migrations, NOT `drizzle-kit push`
# Migrations auto-apply on service startup via start.mjs
```

### Phase 5: Basic Test Infrastructure

Set up vitest for the packages that have testable logic:

1. **Install vitest** at root:
   ```bash
   pnpm add -Dw vitest
   ```

2. **Add initial tests** for critical business logic:
   - `packages/ai/src/__tests__/schemas.test.ts` — Verify Zod schemas parse expected AI responses
   - `apps/web/src/server/__tests__/plan.test.ts` — Verify plan limits, feature window calculations
   - `packages/notifications/src/__tests__/dispatch.test.ts` — Verify preference checking logic

3. **Add test script** to root `package.json`:
   ```json
   "test": "vitest run"
   ```

4. **Add to CI:**
   ```yaml
   - run: pnpm test
   ```

Start with 5-10 tests covering the most critical paths. Don't aim for coverage targets — aim for confidence in plan gating, notification dispatch, and AI schema parsing.

### Phase 6: Feature Flags (Simple)

For gradual rollout without a full feature flag service, use environment variables:

```typescript
// apps/web/src/lib/flags.ts
export const flags = {
  pushNotifications: process.env.FF_PUSH_NOTIFICATIONS !== 'false',
  dailyCheckins: process.env.FF_DAILY_CHECKINS !== 'false',
  stripePayments: process.env.FF_STRIPE !== 'false',
}
```

Default all flags to `true` (features enabled). Set `FF_X=false` on Railway to disable a feature without redeploying code.

Check flags in server functions:
```typescript
if (!flags.stripePayments) {
  return { error: 'Payments are temporarily disabled' }
}
```

## Acceptance Criteria

### Phase 1: CI
- [ ] AC-1.1: `.github/workflows/ci.yml` exists and defines a `check` job that runs `pnpm install`, `pnpm check-types`, and `pnpm build`.
- [ ] AC-1.2: Pushing to `main` triggers the CI workflow (verified via GitHub Actions tab).
- [ ] AC-1.3: A PR with a TypeScript error fails the CI check (red status on PR).
- [ ] AC-1.4: A PR with a passing build shows green CI status.

### Phase 2: Automated Deploy
- [ ] AC-2.1: Merging a PR to `main` triggers an automatic deploy to Railway (via GitHub integration or CI deploy job).
- [ ] AC-2.2: The deploy process deploys both services (web + wa-bridge) without manual intervention.
- [ ] AC-2.3: A Railway deploy token is stored as a GitHub secret (if using Option B) or Railway GitHub app is connected (if using Option A).

### Phase 3: Smoke Test
- [ ] AC-3.1: `scripts/smoke-test.sh` exists, is executable, and accepts web and bridge URLs as arguments.
- [ ] AC-3.2: Running the smoke test against deployed Railway services exits with code 0 when both services are healthy.
- [ ] AC-3.3: The smoke test exits with code 1 and a descriptive error when a health check fails.

### Phase 4: Env Var Management
- [ ] AC-4.1: `.env.example` lists ALL environment variables used by any service, grouped by purpose, with comments explaining each.
- [ ] AC-4.2: `.env.example` includes VAPID, Stripe, Sentry, and feature flag variables (with placeholder values).
- [ ] AC-4.3: No actual secret values appear in `.env.example` or any committed file.

### Phase 5: Test Infrastructure
- [ ] AC-5.1: `vitest` is installed as a devDependency at the root.
- [ ] AC-5.2: At least 3 test files exist covering: plan limit logic, notification preference filtering, and AI schema validation.
- [ ] AC-5.3: `pnpm test` runs all tests and exits with code 0.
- [ ] AC-5.4: The CI workflow includes a test step that runs `pnpm test`.

### Phase 6: Feature Flags
- [ ] AC-6.1: `apps/web/src/lib/flags.ts` exists and exports a `flags` object with boolean values for push notifications, daily check-ins, and Stripe payments.
- [ ] AC-6.2: Setting `FF_STRIPE=false` on Railway disables the Stripe checkout endpoint (returns an error instead of creating a session).
- [ ] AC-6.3: All feature flags default to `true` (enabled) when the env var is not set.

## Dependencies

- **TICKET-007** (Railway Deploy) — Health endpoints needed for smoke tests.
- **TICKET-010** (Monitoring) — Sentry DSN needed for CI secret management.
- **GitHub repo access** — CI workflows need push access to trigger. Currently `github-tyagow:tyagow/amore`.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: CI | 1 hour | Single YAML file + verify on push |
| Phase 2: Automated deploy | 1 hour | Railway GitHub integration or deploy job |
| Phase 3: Smoke test | 30 min | Shell script + manual verification |
| Phase 4: Env var management | 30 min | Update .env.example |
| Phase 5: Test infrastructure | 3-4 hours | Setup + write 5-10 initial tests |
| Phase 6: Feature flags | 30 min | Single file + wire into 3 endpoints |
| **Total** | **6-8 hours** | Phase 5 is the bulk; others are quick |

## Open Questions

1. **Railway GitHub integration vs CI deploy:** Railway's auto-deploy is simpler but deploys on EVERY push (no gate). CI deploy allows requiring checks to pass first. Recommendation: Use Railway auto-deploy initially, add CI gating later.

2. **Staging environment:** Should we create a separate Railway environment for staging? This adds cost (~$5-10/month for a second set of services + DB). Recommendation: Defer until after launch. Use feature flags for safe rollout instead.

3. **DB migration in CI:** Should CI verify that `drizzle-kit generate` produces no diff (i.e., schema.ts matches the latest migration)? This prevents deploying code with schema changes that haven't been captured in a migration file. Recommendation: Add after the migration strategy is unified (TICKET-006 Phase 4).
