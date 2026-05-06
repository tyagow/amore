import type { Locale } from '~/lib/i18n'

export function buildBeforeAdviceDraft({
  care,
  consentQuestion,
  offer,
}: {
  care?: string
  consentQuestion?: string
  offer?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeCare = normalize(care, 'Quero te apoiar hoje do jeito que realmente ajuda, nao so pular para consertar.')
    const safeConsentQuestion = normalize(consentQuestion, 'Voce quer acolhimento, escuta, solucao pratica, ou um pouco de espaco agora?')
    const safeOffer = normalize(offer, 'Posso seguir o seu ritmo em vez de adivinhar.')

    return [
      safeCare,
      '',
      safeConsentQuestion,
      '',
      safeOffer,
    ].join('\n')
  }

  const safeCare = normalize(care, 'I want to support you today in the way that actually helps, not just jump into fixing.')
  const safeConsentQuestion = normalize(consentQuestion, 'Do you want comfort, listening, problem-solving, or a little space right now?')
  const safeOffer = normalize(offer, 'I can follow your lead instead of guessing.')

  return [
    safeCare,
    '',
    safeConsentQuestion,
    '',
    safeOffer,
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
