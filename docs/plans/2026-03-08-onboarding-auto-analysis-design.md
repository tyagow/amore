# Onboarding Auto-Analysis Flow

**Date**: 2026-03-08
**Status**: Approved

## Problem
After WhatsApp pairing and partner contact selection, users land on dashboard with a manual "Analyze" button. No feedback during sync/analysis. No auto-trigger on first load.

## Design

### State Machine (DB-driven, no new columns)
- `whatsapp_jid = null` → Step 1: "Connect WhatsApp" (link to /whatsapp)
- `whatsapp_jid set + msg_count = 0` → Step 1: "Syncing messages..." (spinner)
- `msg_count > 0 + health_score = null` → Step 2: "Analyzing patterns..." (auto-trigger)
- `health_score != null` → Step 3: Done! Show results

### UX
- Step indicator card on dashboard replaces the old "Analyze" button
- Dashboard polls every 5s while onboarding incomplete
- Auto-triggers analysis when in "analyzing" state (no manual button)
- After contact selection on /whatsapp, redirect to /dashboard

### Changes
1. `dashboard.tsx` — OnboardingCard with step indicator + polling
2. `whatsapp.tsx` — Redirect to /dashboard after contact selection
3. `scripts/trigger-analysis.ts` — CLI script to trigger analysis by email

### Manual Trigger
Script to trigger analysis for a specific user email, useful for testing.
