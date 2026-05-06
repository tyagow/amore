# Amore Mobile

This directory is reserved for a future native mobile shell. It is intentionally not a pnpm package yet.

The accepted overnight decision is PWA-first:

- Keep `apps/web` as the mobile-ready production surface.
- Do not start Expo, React Native, Capacitor, or App Store submission work until the native evaluation gate in `docs/architecture/native-mobile-decision.md` is met.
- Reuse existing server APIs and shared packages when native work starts.
- Keep privacy, safety, billing, coach, and WhatsApp import behavior consistent with the web app.

First allowed native milestone: a read-only authenticated shell with parity checks, not a rewritten product.
