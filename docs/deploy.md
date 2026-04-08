# Deploy

Amore Couples has two Railway services deployed from this monorepo:

| Railway service | Repo path | Purpose |
| --- | --- | --- |
| `web` | `apps/web` | Main TanStack Start app, API routes, auth, billing, SSE, media proxy |
| `wa-bridge` | `apps/wa-bridge` | WhatsApp bridge, background sync, WebSocket bridge, analysis triggers |

Shared packages under `packages/*` are consumed by both services, so pushes that touch shared code can affect both deploys.

## Deploy flow

1. Push to `main`.
2. GitHub Actions runs `.github/workflows/ci.yml` for typechecks, tests, and build.
3. Railway auto-deploys the affected services from `main` if auto-deploy is enabled.
4. If a manual deploy is needed, open Railway and trigger a redeploy for `web` and/or `wa-bridge` from the latest `main` commit.

## Rollback

1. Open the Railway project.
2. Select the affected service (`web` or `wa-bridge`).
3. Open the deploy history.
4. Redeploy the previous healthy deployment.
5. Re-run the smoke checklist below before declaring rollback complete.

## Environment variable checklist

### Shared

- `DATABASE_URL`
- `REDIS_URL`
- `WA_BRIDGE_JWT_SECRET`

### `web`

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `WEB_APP_URL`
- `WA_BRIDGE_URL`
- `ANTHROPIC_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `VITE_VAPID_PUBLIC_KEY`
- Optional if billing is enabled: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLIC_KEY`

### `wa-bridge`

- `WEB_APP_URL`
- `ANTHROPIC_API_KEY`
- Optional if overriding Railway defaults: `WA_BRIDGE_PORT`

Reference: `docs/env-vars.md`.

## Post-deploy smoke checklist

1. Open the latest deploy logs for the affected service and confirm startup completed without repeated crash loops.
2. Hit the web health endpoint: `GET /api/health`.
3. Hit the bridge health endpoint: `GET /health`.
4. Verify the web app loads and authenticated routes still boot.
5. If the deploy touched bridge or shared messaging code, verify the web app can still reach `wa-bridge`.
6. If the deploy touched auth or billing, run one real login and the relevant payment/auth flow smoke check.
