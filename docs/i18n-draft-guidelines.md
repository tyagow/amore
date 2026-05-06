# Locale-aware action drafts

When an action sends the user to chat or goals with a prefilled draft, the draft must be generated in the current UI locale.

- Read the locale with `useI18n()`.
- Build draft helpers with a `locale: Locale = 'en'` parameter when the helper produces user-visible copy.
- Store chat drafts with `storeChatDraft(draft, locale)` from `apps/web/src/lib/chat-draft-storage.ts`.
- Store goal drafts with `storeGoalDraft(draft, locale)` from the same helper.
- Do not call `localStorage.setItem('amore-chat-draft', ...)` or `localStorage.setItem('amore-goal-draft', ...)` directly.

Run `pnpm i18n:draft-audit` before finishing i18n work. It blocks direct draft writes so future action buttons cannot silently fall back to English.
