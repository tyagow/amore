import type { Locale } from '~/lib/i18n'

export function buildPauseBeforeSendDraft(text: string, locale: Locale = 'en') {
  const topic = summarizeDraftTopic(text)

  if (locale === 'pt-BR') {
    if (!topic) {
      return 'Estou ativado(a) hoje e nao quero dizer isso mal.\n\nEu me importo em voltar com mais gentileza, nao em desaparecer.\n\nPodemos pausar por 20 minutos e voltar quando eu conseguir escutar melhor?\n\nSe isso nao funcionar, podemos escolher outro horario claro para voltar?'
    }

    return `Estou ativado(a) hoje e nao quero dizer isso mal.\n\nEu me importo em voltar com mais gentileza, nao em desaparecer.\n\nO assunto que quero conversar e: ${topic}\n\nPodemos pausar por 20 minutos e voltar quando eu conseguir escutar melhor?\n\nSe isso nao funcionar, podemos escolher outro horario claro para voltar?`
  }

  if (!topic) {
    return 'I am feeling activated today and I do not want to say this badly.\n\nI care about coming back kinder, not disappearing.\n\nCan we pause for 20 minutes and come back when I can listen better?\n\nIf that does not work, could we choose another clear return time?'
  }

  return `I am feeling activated today and I do not want to say this badly.\n\nI care about coming back kinder, not disappearing.\n\nThe thing I want to talk about is: ${topic}\n\nCan we pause for 20 minutes and come back when I can listen better?\n\nIf that does not work, could we choose another clear return time?`
}

function summarizeDraftTopic(text: string) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/^hey[, ]*/i, '')
    .trim()

  if (!clean) return ''

  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0]?.trim() ?? clean
  const withoutTrailingPunctuation = firstSentence.replace(/[.!?]+$/, '').trim()
  const softened = withoutTrailingPunctuation
    .replace(/\byou\s+never\s+listen(?:\s+to\s+me)?\b/gi, 'I felt unheard')
    .replace(/\byou\s+always\b/gi, 'I felt a pattern where')
    .replace(/\byou\s+don'?t\s+care\b/gi, 'I felt uncared for')

  if (softened.length <= 80) return softened

  return `${softened.slice(0, 77).trim()}...`
}
