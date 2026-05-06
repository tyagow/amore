import type { Locale } from '~/lib/i18n'

export function buildFollowUpDraft(text: string, locale: Locale = 'en') {
  const topic = summarizeFollowUpTopic(text)

  if (locale === 'pt-BR') {
    if (!topic) {
      return 'Quero checar como minha mensagem chegou hoje, em vez de presumir que estamos bem.\n\nEu me importo em te entender, nao em pedir que voce me tranquilize.\n\nTem algo que voce precisa que eu entenda, repare ou diga de outro jeito? Posso escutar primeiro, e se agora nao for um bom momento podemos voltar a isso depois.'
    }

    return `Quero checar como isso chegou, em vez de presumir que estamos bem.\n\nEu me importo em te entender, nao em pedir que voce me tranquilize.\n\nSobre isso: ${topic}\n\nTem algo que voce precisa que eu entenda, repare ou diga de outro jeito? Posso escutar primeiro, e se agora nao for um bom momento podemos voltar a isso depois.`
  }

  if (!topic) {
    return 'I want to check how my message landed today instead of assuming we are okay.\n\nI care about understanding you, not asking you to reassure me.\n\nIs there anything you need me to understand, repair, or say differently? I can listen first, and if now is not a good time we can come back to it later.'
  }

  return `I want to check how that landed instead of assuming we are okay.\n\nI care about understanding you, not asking you to reassure me.\n\nAbout this: ${topic}\n\nIs there anything you need me to understand, repair, or say differently? I can listen first, and if now is not a good time we can come back to it later.`
}

function summarizeFollowUpTopic(text: string) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/^hey[, ]*/i, '')
    .trim()

  if (!clean) return ''

  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0]?.trim() ?? clean
  const withoutTrailingPunctuation = firstSentence.replace(/[.!?]+$/, '').trim()

  if (withoutTrailingPunctuation.length <= 90) return withoutTrailingPunctuation

  return `${withoutTrailingPunctuation.slice(0, 87).trim()}...`
}
