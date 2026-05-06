import type { Locale } from './i18n'

export const CHAT_DRAFT_STORAGE_KEY = 'amore-chat-draft'
export const CHAT_DRAFT_LOCALE_STORAGE_KEY = 'amore-chat-draft-locale'
export const GOAL_DRAFT_STORAGE_KEY = 'amore-goal-draft'
export const GOAL_DRAFT_LOCALE_STORAGE_KEY = 'amore-goal-draft-locale'

export function storeChatDraft(draft: string, locale: Locale) {
  window.localStorage.setItem(CHAT_DRAFT_STORAGE_KEY, draft)
  window.localStorage.setItem(CHAT_DRAFT_LOCALE_STORAGE_KEY, locale)
}

export function consumeStoredChatDraft() {
  const draft = window.localStorage.getItem(CHAT_DRAFT_STORAGE_KEY)
  if (!draft) return null

  const locale = window.localStorage.getItem(CHAT_DRAFT_LOCALE_STORAGE_KEY) as Locale | null
  window.localStorage.removeItem(CHAT_DRAFT_STORAGE_KEY)
  window.localStorage.removeItem(CHAT_DRAFT_LOCALE_STORAGE_KEY)

  return {
    draft,
    locale: locale === 'pt-BR' ? locale : 'en',
  }
}

export function storeGoalDraft(draft: unknown, locale: Locale) {
  window.localStorage.setItem(
    GOAL_DRAFT_STORAGE_KEY,
    typeof draft === 'string' ? draft : JSON.stringify(draft),
  )
  window.localStorage.setItem(GOAL_DRAFT_LOCALE_STORAGE_KEY, locale)
}
