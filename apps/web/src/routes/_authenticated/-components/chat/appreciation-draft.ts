import type { Locale } from '~/lib/i18n'

export interface AppreciationDraftInput {
  noticed?: string
  quality?: string
  impact?: string
  invitation?: string
}

export function buildAppreciationDraft({
  noticed,
  quality,
  impact,
  invitation,
}: AppreciationDraftInput = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeNoticed = normalizeSentence(noticed, 'algo gentil ou significativo que voce fez')
    const safeQuality = normalizeSentence(quality, 'isso me mostrou seu cuidado')
    const safeImpact = normalizeSentence(impact, 'isso me ajudou a me sentir mais perto de voce')
    const safeInvitation = normalizeQuestion(invitation, 'A gente poderia abrir um pouco mais de espaco para momentos assim esta semana?')

    return `Quero agradecer algo especifico hoje, nao so dizer obrigado(a).\n\nEu me importo em notar o que ajuda a gente a se sentir perto.\n\nO que eu percebi: ${safeNoticed}\n\nO que isso me mostrou: ${safeQuality}\n\nComo isso chegou em mim: ${safeImpact}\n\n${safeInvitation}\n\nSe isso nao funcionar, podemos escolher uma versao menor ou outro momento?`
  }

  const safeNoticed = normalizeSentence(noticed, 'something kind or meaningful you did')
  const safeQuality = normalizeSentence(quality, 'it showed me your care')
  const safeImpact = normalizeSentence(impact, 'it helped me feel closer to you')
  const safeInvitation = normalizeQuestion(invitation, 'Could we make a little more space for moments like that this week?')

  return `I want to appreciate something specific today, not just say thank you.\n\nI care about noticing what helps us feel close.\n\nWhat I noticed: ${safeNoticed}\n\nWhat it showed me: ${safeQuality}\n\nHow it landed for me: ${safeImpact}\n\n${safeInvitation}\n\nIf that does not work, could we choose a smaller version or another time?`
}

function normalizeSentence(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function normalizeQuestion(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[?]$/.test(clean) ? clean : `${clean}?`
}
