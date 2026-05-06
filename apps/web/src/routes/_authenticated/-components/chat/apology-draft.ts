import type { Locale } from '~/lib/i18n'

export interface ApologyDraftInput {
  action?: string
  impact?: string
  ownership?: string
  repair?: string
}

export function buildApologyDraft({
  action,
  impact,
  ownership,
  repair,
}: ApologyDraftInput = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeAction = normalizeSentence(action, 'o que eu fiz ou deixei de fazer')
    const safeImpact = normalizeSentence(impact, 'consigo ver que isso pode ter te machucado ou dificultado as coisas')
    const safeOwnership = normalizeSentence(ownership, 'quero assumir minha parte sem justificar')
    const safeRepair = normalizeQuestion(repair, 'O que ajudaria a reparar isso daqui para frente?')

    return `Quero pedir desculpas com clareza e nao fazer voce cuidar dos meus sentimentos.\n\nEu me importo em reparar isso com comportamento diferente, nao so palavras melhores.\n\nO momento especifico que eu quero olhar foi quando: ${safeAction}\n\nO impacto que consigo enxergar: ${safeImpact}\n\nO que eu assumo: ${safeOwnership}\n\nO que vou fazer diferente da proxima vez: ____.\n\nVoce nao precisa me tranquilizar nem me perdoar rapidamente.\n\n${safeRepair}`
  }

  const safeAction = normalizeSentence(action, 'what I did or did not do')
  const safeImpact = normalizeSentence(impact, 'I can see it may have hurt you or made things harder')
  const safeOwnership = normalizeSentence(ownership, 'I want to own my part without explaining it away')
  const safeRepair = normalizeQuestion(repair, 'What would help repair this from here?')

  return `I want to apologize clearly and not make you take care of my feelings.\n\nI care about repairing this with changed behavior, not just better words.\n\nThe specific moment I mean is when: ${safeAction}\n\nThe impact I can see: ${safeImpact}\n\nWhat I own: ${safeOwnership}\n\nWhat I will do differently next time: ____.\n\nYou do not have to reassure me or forgive me quickly.\n\n${safeRepair}`
}

function normalizeSentence(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function normalizeQuestion(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[?]$/.test(clean) ? clean : `${clean}?`
}
