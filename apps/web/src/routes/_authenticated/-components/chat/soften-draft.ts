import type { Locale } from '~/lib/i18n'

export function buildSofterStartDraft(text: string, locale: Locale = 'en') {
  const topic = summarizeConcern(text)

  if (locale === 'pt-BR') {
    if (!topic) {
      return 'Quero dizer isso de um jeito que mantenha a gente no mesmo time.\n\nAlgo tem sido dificil para mim, e eu gostaria que a gente entendesse junto em vez de virar uma briga.\n\nA gente poderia conversar por 10 minutos quando voce tiver espaco?'
    }

    return `Quero dizer isso de um jeito que mantenha a gente no mesmo time.\n\nO que estou tentando conversar e: ${topic}.\n\nTenho me sentido magoado(a) ou estressado(a) com isso, e quero entender sem te culpar.\n\nA gente poderia conversar por 10 minutos quando voce tiver espaco?`
  }

  if (!topic) {
    return 'I want to say this in a way that keeps us on the same team.\n\nSomething has been feeling hard for me, and I would like to understand it together instead of turning it into a fight.\n\nCould we talk for 10 minutes when you have space?'
  }

  return `I want to say this in a way that keeps us on the same team.\n\nThe thing I am trying to talk about is: ${topic}.\n\nI have been feeling hurt or stressed about this, and I want to understand it without blaming you.\n\nCould we talk for 10 minutes when you have space?`
}

function summarizeConcern(text: string) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/^hey[, ]*/i, '')
    .trim()

  if (!clean) return ''

  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0]?.trim() ?? clean
  const withoutTrailingPunctuation = firstSentence.replace(/[.!?]+$/, '').trim()
  const softened = softenAccusatoryOpening(withoutTrailingPunctuation)

  if (softened.length <= 70) return softened

  return `${softened.slice(0, 67).trim()}...`
}

function softenAccusatoryOpening(text: string) {
  return text
    .replace(/^you never listen(?:\s+to\s+me)?\s+when\b/i, 'I have been feeling unheard when')
    .replace(/^you never listen to me\b/i, 'I have been feeling unheard')
    .replace(/^you never\s+(.+)/i, 'I have been feeling like $1 has not been happening')
    .replace(/^you always leave me\b/i, 'I have been feeling alone')
    .replace(/^you always\s+(.+)/i, 'I have been feeling a repeated pattern around $1')
    .replace(/^why do you\b/i, 'I am trying to understand why this happens when you')
    .replace(/^you do not\b/i, 'I have been feeling like I am missing')
    .replace(/^you don't\b/i, 'I have been feeling like I am missing')
    .trim()
}
