# Single Database for Local Dev — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the two-database sync problem by pointing local dev at Railway Postgres, so messages written by wa-bridge are instantly available to the web app.

**Architecture:** Local dev `DATABASE_URL` switches from local Docker Postgres to Railway Postgres. All sync machinery (`syncMessagesFromProd`, `dev:sync`, `PROD_DATABASE_URL`) is removed since there's only one database. The Docker Postgres and Redis remain available but are no longer required for normal dev.

**Tech Stack:** Environment config (.env.local), TanStack Start, Drizzle ORM, Railway Postgres

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `.env.local` | Point `DATABASE_URL` to Railway, remove `PROD_DATABASE_URL` |
| Modify | `apps/web/server/routes/ws/chat.ts` | Remove `syncMessagesFromProd` function and all calls to it |
| Modify | `package.json` | Remove `dev:sync` script |
| Delete | `scripts/sync-messages-from-prod.ts` | No longer needed |
| Delete | `scripts/sync-analysis-from-prod.ts` | No longer needed |
| Modify | `docker-compose.yml` | Mark postgres as optional (comment, don't delete) |

---

### Task 1: Switch DATABASE_URL to Railway Postgres

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Update DATABASE_URL**

In `.env.local`, change:
```
DATABASE_URL=postgresql://amore-couples:amore_dev_password@localhost:5440/amore_couples
```
to:
```
DATABASE_URL=postgresql://<railway-user>:<railway-password>@<railway-host>:<railway-port>/<railway-db>
```

- [ ] **Step 2: Remove PROD_DATABASE_URL**

Delete this line from `.env.local`:
```
PROD_DATABASE_URL=postgresql://<railway-user>:<railway-password>@<railway-host>:<railway-port>/<railway-db>
```

It's now the same as DATABASE_URL — no need for two vars.

- [ ] **Step 3: Verify the web app connects to Railway DB**

```bash
pnpm run dev:restart
```

Wait for startup, then:
```bash
curl -s -X POST http://localhost:9941/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"heytyago@gmail.com","password":"test123"}'
```

Expected: successful login response (user exists in Railway DB because we copied them earlier).

If login fails: the accounts table on Railway may not have the password hash. Run:
```bash
# Generate hash and update Railway DB
NEW_HASH=$(npx tsx -e "import { hashPassword } from 'better-auth/crypto'; hashPassword('test123').then(h => process.stdout.write(h));")
docker exec amore-couples-postgres psql "postgresql://<railway-user>:<railway-password>@<railway-host>:<railway-port>/<railway-db>" \
  -c "INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
      VALUES ('acc_tyago', 'user_tyago', 'user_tyago', 'credential', '$NEW_HASH', now(), now())
      ON CONFLICT DO NOTHING;"
```
Repeat for jaluzagoulartt@gmail.com with the correct user_id.

- [ ] **Step 4: Verify messages are visible**

Login, navigate to `/chat`. Messages from the wa-bridge should appear because both services now read from the same database.

- [ ] **Step 5: No commit yet** — continue to Task 2.

---

### Task 2: Remove syncMessagesFromProd from WS proxy

**Files:**
- Modify: `apps/web/server/routes/ws/chat.ts`

- [ ] **Step 1: Remove the syncMessagesFromProd function**

Delete the entire function `syncMessagesFromProd` (lines ~298-426) and the `pg` import it uses. This is ~130 lines of cross-DB sync code.

- [ ] **Step 2: Remove calls to syncMessagesFromProd**

In the `handleBridgeMessage` function, update the `messages-persisted` and `resync-complete` cases:

Before:
```typescript
case 'messages-persisted':
  sendToPeer(peer, msg)
  syncMessagesFromProd(peer, state, 'incremental')
  break

case 'resync-complete':
  sendToPeer(peer, msg)
  syncMessagesFromProd(peer, state, 'full')
  break
```

After:
```typescript
case 'messages-persisted':
  sendToPeer(peer, msg)
  // Messages are in the same DB — just reload history for the client
  handleLoadHistory(peer, state, { limit: 50 })
  break

case 'resync-complete':
  sendToPeer(peer, msg)
  handleLoadHistory(peer, state, { limit: 50 })
  break
```

- [ ] **Step 3: Remove the initial sync-on-connect call**

Find where `syncMessagesFromProd` is called on WebSocket open (around line 633) and remove it. The history load on connect already reads from the DB directly.

- [ ] **Step 4: Remove the inline persistence for real-time messages**

The WS proxy currently also inserts messages inline when it receives them from the bridge (lines ~209-225). Since the wa-bridge already persists to the same DB, this creates duplicate writes. Remove the inline `db.insert(messages)` in the `message` case handler. The client will see messages via the history load or when the bridge emits `messages-persisted`.

Note: Keep the `sendToPeer(peer, msg)` call so the client sees real-time messages in the UI immediately.

- [ ] **Step 5: Verify build**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep chat.ts
```

Expected: no errors from chat.ts (pre-existing errors in other files are OK).

---

### Task 3: Remove sync scripts and dev:sync

**Files:**
- Delete: `scripts/sync-messages-from-prod.ts`
- Delete: `scripts/sync-analysis-from-prod.ts`
- Modify: `package.json`

- [ ] **Step 1: Delete sync scripts**

```bash
rm scripts/sync-messages-from-prod.ts
rm scripts/sync-analysis-from-prod.ts
```

- [ ] **Step 2: Remove dev:sync from package.json**

In the root `package.json`, remove the `dev:sync` script line:
```json
"dev:sync": "pnpm -C apps/wa-bridge exec tsx --env-file=../../.env.local ../../scripts/sync-messages-from-prod.ts",
```

---

### Task 4: Update docker-compose.yml and documentation

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add comment to docker-compose.yml**

Add a comment at the top of `docker-compose.yml`:

```yaml
# Local Postgres and Redis are optional for development.
# By default, DATABASE_URL in .env.local points to Railway Postgres.
# Only start these if you need a fully offline dev environment.
```

- [ ] **Step 2: Update MEMORY.md architecture notes**

Update the project memory to reflect the new single-DB architecture.

---

### Task 5: Ensure auth works on Railway DB

**Files:**
- None (DB operations only)

- [ ] **Step 1: Check accounts exist on Railway**

```bash
docker exec amore-couples-postgres psql "postgresql://<railway-user>:<railway-password>@<railway-host>:<railway-port>/<railway-db>" \
  -c "SELECT a.user_id, a.provider_id, length(a.password)>0 as has_password FROM accounts a;"
```

If accounts don't exist or have no password, create them using `better-auth/crypto` `hashPassword('test123')` and insert.

- [ ] **Step 2: Verify both users can login**

```bash
curl -s -X POST http://localhost:9941/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"heytyago@gmail.com","password":"test123"}'

curl -s -X POST http://localhost:9941/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"jaluzagoulartt@gmail.com","password":"test123"}'
```

Expected: both return valid tokens.

---

### Task 6: End-to-end verification

- [ ] **Step 1: Restart dev server**

```bash
pnpm run dev:restart
```

- [ ] **Step 2: Login as Tyago, check dashboard**

Navigate to http://localhost:9941/login, sign in as heytyago@gmail.com/test123. Dashboard should show the couple view (not SoloWelcome) because the couple exists in Railway DB.

- [ ] **Step 3: Check chat has messages**

Navigate to `/chat`. The "sync test from amore" message (and any others from the wa-bridge) should appear.

- [ ] **Step 4: Send a message from WhatsApp**

Send a WhatsApp message from Jaluza's phone. Within seconds it should:
- Appear in the Railway DB (wa-bridge persists it)
- Appear in the chat UI (WS proxy forwards it + history reload)

- [ ] **Step 5: Commit all changes**

```bash
git add -A
git commit -m "refactor: use Railway Postgres for local dev, remove two-DB sync

Local dev now reads/writes the same Railway Postgres that wa-bridge uses.
Removes syncMessagesFromProd, dev:sync, and PROD_DATABASE_URL — all
symptoms of the two-database split that caused message visibility bugs."
```

- [ ] **Step 6: Deploy web to Railway**

```bash
railway link -s web -w "filter-tiago's Projects" -p "amore-couples" && railway up --detach
```
