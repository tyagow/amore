---
tracker:
  kind: local
  path: "thoughts/shared/plans/2026-05-06-autonomous-symphony-overnight-tracker.md"
  active_states: ["Ready for Agent", "In Progress"]
  terminal_states: ["Done", "Failed", "Skipped", "Cancelled"]
polling:
  interval_ms: 30000
workspace:
  root: ".worktrees/autonomous"
hooks:
  timeout_ms: 60000
  after_create: |
    git fetch origin main
  before_run: |
    git status --short
    pnpm install --frozen-lockfile
  after_run: |
    git status --short
agent:
  max_concurrent_agents: 1
  max_concurrent_agents_by_state:
    ready for agent: 1
  max_turns: 20
  max_retry_backoff_ms: 300000
codex:
  command: "codex app-server"
  approval_policy: "never"
  turn_timeout_ms: 3600000
  read_timeout_ms: 5000
  stall_timeout_ms: 300000
---

# Amore Overnight Product Workflow

This workflow governs the overnight Amore product-shine run. It is intentionally conservative because the base checkout may contain unrelated dirty work and the roadmap phases touch overlapping authenticated app surfaces.

## Hard Rules

- Do not pause for user input during a phase. Use the locked defaults in the relevant child ledger `## Phase Packet`, record the assumption, or skip the phase if safety/data loss risk appears.
- Do not push directly to `main`.
- Do not commit partial or failed phase work.
- Do not stage unrelated dirty work.
- Do not expose private coach or imported WhatsApp data to a partner without an explicit user action.
- Do not gate safety, crisis routing, or privacy controls.

## Required Preflight

Before product phases start, verify all Phase Packets:

```bash
for f in thoughts/ledgers/CONTINUITY_CLAUDE-amore-{today-coach-home,ui-ux-redesign,whatsapp-import-ttv,conflict-repair,safety-trust-layer,private-shared-coach,personalized-ritual-engine,weekly-relationship-report,partner-invite-value-loop,native-mobile-app}.md; do
  rg -q '^## Phase Packet$' "$f" || { echo "missing packet: $f"; exit 1; }
  for h in '### User-Facing Outcome' '### Exact Default Product Decisions' '### Owned Files/Modules' '### Out-of-Scope Boundaries' '### UI/Data Behavior' '### Test Cases' '### Commit Criteria' '### Deploy/Smoke Criteria' '### Failure Fallback'; do
    rg -q "^$h$" "$f" || { echo "missing $h in $f"; exit 1; }
  done
done
```

## Phase Execution

1. Create an isolated branch/worktree under `.worktrees/autonomous/<phase-slug>`.
2. Read the master ledger, overnight plan, and the phase child ledger before editing.
3. Implement only files owned by the phase packet.
4. Run the phase's focused tests plus:
   ```bash
   pnpm install --frozen-lockfile
   pnpm check-types
   pnpm test
   pnpm build
   ```
5. For UI phases, capture mobile and desktop screenshots.
6. Commit only if every required gate passes.
7. Push a phase branch, open a PR, wait for CI, merge only after CI passes, then verify Railway deploy and smoke endpoints.
8. Update the overnight report with branch, commit, PR, CI, deploy, health, local checks, files changed, ledger updates, and risks.

## Failure Handling

If a phase fails, keep its workspace intact, write a failure note in `thoughts/shared/plans/2026-05-06-autonomous-symphony-overnight-report.md`, do not commit, and continue only with later phases that do not depend on the failed work.
