import type { Locale } from '~/lib/i18n'

export function buildGoalTitleFromChatDraft(text: string, locale: Locale = 'en') {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/^hey\s+[^,]+,\s*/i, '')
    .trim()

  const fallbackTitle = locale === 'pt-BR' ? 'Escolher uma pequena promessa do relacionamento' : 'Choose one tiny relationship promise'
  if (!clean) return fallbackTitle

  const requestSentence =
    clean.match(/(?:could|can|would)\s+we\b[^.!?]*/i)?.[0] ??
    clean.match(/\b(?:i|we)\s+(?:will|want|need|can)\b[^.!?]*/i)?.[0] ??
    clean.split(/(?<=[.!?])\s+/)[0] ??
    clean

  const normalized = requestSentence
    .replace(/[.!?]+$/, '')
    .replace(/^could we\s+/i, '')
    .replace(/^can we\s+/i, '')
    .replace(/^would we\s+/i, '')
    .replace(/^would you\s+/i, '')
    .trim()

  const title = normalized || fallbackTitle
  if (title.length <= 80) return title

  return `${title.slice(0, 77).trim()}...`
}

export function buildGoalDraftFromChatDraft(text: string, locale: Locale = 'en') {
  const title = buildGoalTitleFromChatDraft(text, locale)
  const clean = text
    .replace(/\s+/g, ' ')
    .trim()
  const summary = clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean

  if (locale === 'pt-BR') {
    return {
      title,
      description: summary
        ? `Praticar a promessa deste rascunho: ${summary} Checar se ajudou e ajustar juntos, em vez de tratar como um teste.`
        : 'Escolher uma pequena promessa do relacionamento, tentar uma vez e checar se ajudou.',
    }
  }

  return {
    title,
    description: summary
      ? `Practice the promise from this draft: ${summary} Check whether it helped, then adjust together instead of treating it as a test.`
      : 'Choose one tiny relationship promise, try it once, and check whether it helped.',
  }
}
