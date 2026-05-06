# Native Mobile Decision

Date: 2026-05-06
Status: Accepted for the overnight roadmap

## Decision

Amore will harden the mobile web/PWA shell before starting a native App Store product. The current shipped target is an installable, mobile-ready web app with safe-area layout, service worker support, offline fallback, and the same day-to-day relationship assistant flows as desktop.

Do not add a full Expo, React Native, Capacitor, or native iOS/Android build during the overnight run. A native shell can be evaluated later only after the PWA checks stay green and the team can prove the shell does not fork privacy, coach, import, billing, or safety behavior.

## Product Defaults

- Audience: busy/self-improvement couples using Amore day to day.
- Native scope now: architecture decision plus a minimal future workspace scaffold.
- Primary mobile delivery: authenticated PWA, not App Store submission.
- Safety behavior: crisis and abuse routing remains web/server owned and must not be reimplemented differently in a native client.
- Privacy behavior: private coach, WhatsApp import, and solo insight data must stay private unless a user explicitly shares it.
- AI behavior: mobile clients consume the same hybrid rule-first, AI-enhanced server behavior with deterministic fallbacks.

## Native Shell Evaluation Gate

A native shell is allowed only if all of these are true:

- `pnpm check-types`, `pnpm test`, and `pnpm build` are green before scaffolding.
- The shell reuses existing server APIs and shared packages instead of duplicating coach/import/business logic.
- Authentication, billing, safety routing, data deletion/export, and partner visibility rules have a written parity checklist.
- The dashboard, coach, upload, chat, connect, and goals routes already pass mobile smoke checks in the PWA.
- The first native milestone is a read-only authenticated shell, not a rewritten product surface.

## Out Of Scope

- Full native app submission.
- Push-notification entitlement setup for iOS/Android stores.
- Offline-first local data sync beyond the existing PWA service worker.
- Rewriting WhatsApp import, conflict repair, or coach flows in a separate native code path.
- Introducing new premium gates. Safety features remain ungated.

## Minimal Scaffold

The `apps/mobile/` directory is intentionally documentation-only for now. It reserves the future workspace boundary without adding a package to the pnpm graph, changing CI time, or creating a half-built native app.

The future native owner should add a package only after the evaluation gate above is met. When that happens, the first implementation must include:

- A README with exact run commands and platform prerequisites.
- A parity checklist for auth, privacy, safety, billing, and import visibility.
- A route map showing which screens are native wrappers and which remain web/PWA.
- A rollback path that removes the native package without affecting `apps/web`.

## Acceptance Criteria

- The repository records the PWA-first native decision.
- The future mobile workspace boundary exists without changing build behavior.
- No native dependencies, package graph changes, or store-submission assumptions are introduced.
- Full repo checks remain green after the documentation/scaffold change.

## Failure Fallback

If native scaffolding causes any check, build, or CI instability, remove the scaffold and keep only the architecture decision. Product work continues through the PWA/mobile web surface.
