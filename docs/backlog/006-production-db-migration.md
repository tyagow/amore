# TICKET-006: Production Database Migration & Safety

## Priority: P0 — Critical (blocks all other launch tickets)

## Problem Statement

The codebase has grown from ~21 tables (deployed on Railway) to ~30 tables after implementing TICKET-001 through TICKET-005. The following tables exist in `packages/db/src/schema.ts` but have NOT been pushed to Railway Postgres:

**New tables (never deployed):**
- `push_subscriptions` — Web push notification subscriptions (TICKET-001)
- `notification_preferences` — Per-user notification settings (TICKET-001)
- `notification_deliveries` — Notification audit log (TICKET-001)
- `chat_exports` — WhatsApp chat export uploads (TICKET-002)
- `daily_checkins` — Daily engagement check-ins (TICKET-003)
- `engagement_streaks` — Streak tracking (TICKET-003)
- `feature_usage` — Monetization gating usage tracking (TICKET-005)
- `subscriptions` — Stripe subscription records (TICKET-005)

**Potential schema changes to existing tables:**
- `coach_threads.coupleId` — Changed to nullable (to support solo coaching in TICKET-002 onboarding)
- `coach_threads.userId` — Added for solo coach threads
- `users.plan` — Already existed with `default('free')`, no change needed

The current migration infrastructure uses `drizzle-kit` with a single baseline SQL file (`packages/db/drizzle/0000_parched_thunderbolt_ross.sql`). The `start.mjs` scripts for both services run `runMigrations()` from `packages/db/scripts/run-migrations.mjs` which uses `drizzle-orm/node-postgres/migrator` with advisory locking. The baseline detection logic (`maybeBaselineExistingSchema`) can handle existing schemas that predate the migration journal.

**Risk:** Railway Postgres has live data (Tiago + Jaluza's couple, WhatsApp messages, analyses, coach threads). A botched migration could corrupt or lose this data. There is currently NO backup strategy — Railway Postgres does not have automatic point-in-time recovery unless configured.

**Current deploy pattern:** Schema changes have been done via `drizzle-kit push` against the public Railway Postgres URL (`shuttle.proxy.rlwy.net:11432`). This creates tables but does NOT record in the Drizzle migration journal. The `run-migrations.mjs` baseline detection handles this mismatch, but mixing `push` and `migrate` is fragile.

## Technical Design

### Phase 1: Pre-Migration Backup & Validation

1. **Take a manual backup** of Railway Postgres using `pg_dump`:
   ```bash
   pg_dump "postgresql://postgres:<password>@shuttle.proxy.rlwy.net:11432/railway" > backup-pre-launch-$(date +%Y%m%d).sql
   ```

2. **Verify current production schema** against what `drizzle-kit` expects:
   ```bash
   cd packages/db
   DATABASE_URL="<public-url>" npx drizzle-kit push --dry-run
   ```
   This shows what changes drizzle-kit would make without applying them.

3. **Count existing rows** in critical tables to verify post-migration:
   ```sql
   SELECT 'couples' as t, count(*) FROM couples
   UNION ALL SELECT 'messages', count(*) FROM messages
   UNION ALL SELECT 'coach_threads', count(*) FROM coach_threads
   UNION ALL SELECT 'users', count(*) FROM users;
   ```

### Phase 2: Generate & Apply Migration

1. **Generate a migration** (not push) that captures all new tables:
   ```bash
   cd packages/db
   DATABASE_URL="<public-url>" npx drizzle-kit generate
   ```
   This creates a new SQL file in `packages/db/drizzle/` covering all schema diff.

2. **Review the generated SQL** — verify it only contains CREATE TABLE statements for new tables and ALTER TABLE for modified columns (like nullable `coach_threads.coupleId`). It must NOT contain DROP TABLE or destructive ALTER statements.

3. **Apply the migration** via the existing migration runner (deploy services or run manually):
   ```bash
   cd packages/db
   DATABASE_URL="<public-url>" npx drizzle-kit migrate
   ```

4. **Verify post-migration:**
   - All 8 new tables exist
   - Row counts in existing tables unchanged
   - `coach_threads.coupleId` is nullable
   - Drizzle migration journal has correct entries

### Phase 3: Establish Backup Strategy

1. **Enable Railway Postgres backups** — Railway provides daily automated backups on paid plans. Verify this is enabled in the Railway dashboard.

2. **Create a pre-deploy backup script** (`scripts/backup-prod-db.sh`):
   ```bash
   #!/bin/bash
   set -e
   BACKUP_DIR="backups"
   mkdir -p "$BACKUP_DIR"
   TIMESTAMP=$(date +%Y%m%d-%H%M%S)
   pg_dump "$PROD_DATABASE_URL" > "$BACKUP_DIR/pre-deploy-$TIMESTAMP.sql"
   echo "Backup saved: $BACKUP_DIR/pre-deploy-$TIMESTAMP.sql"
   ```

3. **Document rollback procedure:**
   - For additive changes (new tables): No rollback needed, new tables are empty
   - For destructive changes (if any): Restore from backup via `psql < backup.sql`
   - For column changes: Generate reverse migration via drizzle-kit

### Phase 4: Unify Migration Strategy

Standardize on `drizzle-kit generate` + `drizzle-kit migrate` (not `push`) for all future schema changes. The existing `run-migrations.mjs` already handles this — it runs `migrate()` on service startup with advisory locking.

1. **Stop using `drizzle-kit push`** — it bypasses the migration journal
2. **Always generate migrations** — `npx drizzle-kit generate` creates versioned SQL files
3. **Migrations auto-apply on deploy** — both `apps/web/scripts/start.mjs` and `apps/wa-bridge/scripts/start.mjs` call `runMigrations()` before starting

## Acceptance Criteria

### Phase 1: Pre-Migration Backup & Validation
- [ ] AC-1.1: A `pg_dump` backup file exists locally containing all Railway Postgres data. Running `grep -c "CREATE TABLE" backup.sql` returns a count matching the number of existing production tables (~21).
- [ ] AC-1.2: Running `drizzle-kit push --dry-run` against Railway Postgres outputs the list of new tables to be created. The output does NOT contain any DROP TABLE or DROP COLUMN statements.
- [ ] AC-1.3: Row counts for `couples`, `messages`, `coach_threads`, and `users` tables are recorded before migration.

### Phase 2: Generate & Apply Migration
- [ ] AC-2.1: A new migration SQL file exists in `packages/db/drizzle/` (e.g., `0001_*.sql`). Running `grep -c "CREATE TABLE" packages/db/drizzle/0001_*.sql` returns 8 (one for each new table: `push_subscriptions`, `notification_preferences`, `notification_deliveries`, `chat_exports`, `daily_checkins`, `engagement_streaks`, `feature_usage`, `subscriptions`).
- [ ] AC-2.2: After migration, running `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` on Railway Postgres returns all tables from `packages/db/src/schema.ts` (approximately 29 tables).
- [ ] AC-2.3: Row counts for `couples`, `messages`, `coach_threads`, and `users` are unchanged after migration.
- [ ] AC-2.4: `coach_threads.couple_id` column is nullable in production (verified via `SELECT is_nullable FROM information_schema.columns WHERE table_name='coach_threads' AND column_name='couple_id'` returning 'YES').
- [ ] AC-2.5: The Drizzle migration journal table (`drizzle.__drizzle_migrations`) has entries for all applied migrations.

### Phase 3: Backup Strategy
- [ ] AC-3.1: Railway Postgres backup settings show automated backups enabled (verified in Railway dashboard).
- [ ] AC-3.2: `scripts/backup-prod-db.sh` exists, is executable, requires `PROD_DATABASE_URL` env var, and outputs a timestamped SQL file to `backups/` directory.
- [ ] AC-3.3: Running the backup script with a valid `PROD_DATABASE_URL` produces a file that can be restored via `psql`.

### Phase 4: Unify Migration Strategy
- [ ] AC-4.1: `.env.example` documents the migration workflow: "Use `npx drizzle-kit generate` to create migrations, NOT `drizzle-kit push`."
- [ ] AC-4.2: Both `apps/web/scripts/start.mjs` and `apps/wa-bridge/scripts/start.mjs` call `runMigrations()` before starting the application (already true — verify no regression).

## Dependencies

- None — this ticket blocks all other launch tickets since services won't start correctly if new tables are missing.

## Estimated Scope

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Backup & validation | 30 min | Manual pg_dump + dry-run check |
| Phase 2: Generate & apply migration | 1 hour | Generate, review, apply, verify |
| Phase 3: Backup strategy | 30 min | Script + Railway config |
| Phase 4: Unify migration strategy | 15 min | Documentation update |
| **Total** | **~2 hours** | Low effort, high criticality |
