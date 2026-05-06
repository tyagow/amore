# Amore Couples Handoff

> Updated: 2026-04-08 01:40 UTC
> Scope: repo + Railway verification

## Executive Summary

Amore Couples is in a mostly launchable state:

- Local `pnpm test` passes: 7 tests across 2 files.
- Local `pnpm build` passes for both `web` and `wa-bridge`.
- Local `pnpm check-types` passes.
- Railway shows successful recent deployments for both services, and both public health endpoints return `200`.

The codebase is locally green on the standard root validation loop.

## Verified Current State

### Local Validation

Run from repo root:

```bash
pnpm test
pnpm build
pnpm check-types
```

Results:

- `pnpm test`: passed
  - `packages/ai/src/parse-export.test.ts`: 4 tests passed
  - `apps/web/src/server/plan.test.ts`: 3 tests passed
- `pnpm build`: passed
  - `@amore-couples/web` build completed successfully
  - `@amore-couples/wa-bridge` build completed successfully
- `pnpm check-types`: passed

Notes:

- The prior `/dashboard` route typing failure is fixed.
- `/dashboard` navigations now pass an explicit `search` object where needed, matching the route's `validateSearch` contract.

### Build Warning

`pnpm build` emits a non-blocking warning:

- `apps/web/src/server/connections.ts` is both dynamically and statically imported from authenticated route code, so it will not split into a separate chunk.

This is not currently breaking the build.

### Railway Verification

Verified on 2026-04-08 UTC:

- `web` latest deployment: `SUCCESS`, created at `2026-04-08T01:13:05.327Z`
- `wa-bridge` latest deployment: `SUCCESS`, created at `2026-04-08T01:09:02.355Z`

Public endpoints verified:

- Web health: `https://web-production-08d3b.up.railway.app/api/health`
  - Response: `{"ok":true,"service":"web","db":"connected",...}`
- WA bridge health: `https://wa-bridge-production-e26e.up.railway.app/health`
  - Response: `{"ok":true,"service":"wa-bridge","db":"connected",...}`
- Web login route: `https://web-production-08d3b.up.railway.app/login`
  - Returned `200`

Latest verified web deploy log lines:

```text
[db] web: waiting for migration lock
[db] web: ensuring pgcrypto extension
[db] web: applying migrations from /app/packages/db/drizzle
[db] web: migrations complete
➜ Listening on: http://localhost:8080/ (all interfaces)
```

## System Shape

This repo is a two-service monorepo:

- `apps/web`: TanStack Start app, auth, dashboard, coach, billing, SSE, WS proxy, PWA
- `apps/wa-bridge`: Hono + Baileys WhatsApp bridge, sync, media, analysis trigger surface
- `packages/ai`: conversation analysis, coaching, parsing, usage tracking
- `packages/db`: schema and Drizzle migrations
- `packages/notifications`: web push delivery

The app design is still coherent with the product goal: a day-to-day relationship assistant that ingests WhatsApp data, synthesizes patterns, and gives users coaching, prompts, and health signals.

## Feature State

Major work already present in the repo:

- PWA and service worker
- WhatsApp export upload onboarding
- Web push notifications
- Monetization gates and Stripe server wiring
- Daily check-ins and streak scaffolding
- Production security middleware
- Sentry wiring
- CI workflow and smoke tests

Useful supporting docs:

- `docs/deploy.md`
- `docs/env-vars.md`
- `docs/system-capabilities.md`

## Known Gaps And Risks

### 1. Stripe is code-wired, but operational setup is still external

The repo contains billing code, pricing UI, and webhook handling, but live Stripe account configuration was not re-verified in this handoff pass. Treat Stripe readiness as an ops item until env vars and webhook state are explicitly checked.

### 2. Sentry runtime is present, but DSN/setup was not re-verified

The code and prior deploy work are in place. Current production DSN/config presence was not re-checked in Railway variables during this handoff.

### 3. Working tree is dirty

`git status --short` currently shows multiple untracked docs paths, including:

- `docs/HANDOFF.md`
- `docs/backlog/`
- `docs/superpowers/`
- `docs/system-capabilities.md`
- several `docs/plans/*`
- `.superpowers/`

Do not assume the working tree is commit-ready without an explicit staging review.

## Recommended Next Steps

1. Keep the root validation loop green after any further changes:
   ```bash
   pnpm test
   pnpm build
   pnpm check-types
   ```
2. If billing launch matters now, verify live Railway env vars and Stripe webhook configuration before announcing paid plans.
3. If monitoring matters now, verify `SENTRY_DSN` is present and that production errors report correctly.
4. Before any commit, review untracked docs content and stage intentionally.

## Useful Commands

```bash
# Local validation
pnpm test
pnpm build
pnpm check-types

# Local dev
pnpm dev
pnpm dev:local

# Railway
railway service web
railway logs -n 50
railway service wa-bridge
railway logs -n 50

# Git hygiene
git status --short
git diff --stat
```

## Last Commit Slice

Recent repo history:

```text
a26fce0 fix(deploy): include web node_modules in Docker runner stage for externalized deps
29f02a1 fix(build): externalize @opentelemetry and @sentry from Nitro SSR bundle
6ccd36b feat(stripe): add pricing page and upgrade modal
fcabd79 feat(cicd): add ci workflow and smoke tests
09f3b29 feat(stripe): add Stripe checkout, webhook, and billing server functions
1b6e4be feat(monitoring): add sentry and delivery telemetry
30dde46 feat(security): production security hardening
b17b1e6 feat(deploy): add packages/notifications to Dockerfiles, health endpoint
58a502e feat(db): push schema to production and generate migration files
0dae134 refactor: code review fixes
```

## If Picking This Up Next

Start with:

1. `pnpm check-types`
2. `pnpm test`
3. `pnpm build`
4. Then move to ops follow-up such as Stripe or Sentry verification
