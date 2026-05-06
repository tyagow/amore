import type { Locale } from '~/lib/i18n'

export interface NeedDraftInput {
  need: string
  why: string
  request: string
  flexibility: string
}

export function buildNeedDraft({
  need,
  why,
  request,
  flexibility,
}: NeedDraftInput, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeNeed = need.trim() || 'mais apoio com ____'
    const safeWhy = why.trim() || 'isso me ajudaria a me sentir mais perto de voce e menos sozinho(a)'
    const safeRequest = request.trim() || 'a gente poderia tentar ____ esta semana?'
    const safeFlexibility = normalizeFlexibilityPt(flexibility)

    return `Quero pedir algo com clareza esta semana, nao te criticar.\n\nEu me importo que a gente encontre uma versao boa para nos dois.\n\nO que eu preciso e ${safeNeed}.\n\nPor que isso importa para mim: ${safeWhy}.\n\nMeu pedido: ${safeRequest}\n\n${safeFlexibility}.`
  }

  const safeNeed = need.trim() || 'more support with ____'
  const safeWhy = why.trim() || 'it would help me feel closer and less alone'
  const safeRequest = request.trim() || 'could we try ____ this week?'
  const safeFlexibility = normalizeFlexibility(flexibility)

  return `I want to ask for something clearly this week, not criticize you.\n\nI care about us finding a version that feels good for both of us.\n\nWhat I need is ${safeNeed}.\n\nWhy it matters to me: ${safeWhy}.\n\nMy request: ${safeRequest}\n\n${safeFlexibility}.`
}

function normalizeFlexibilityPt(value: string) {
  const clean = value.trim()
  if (!clean) return 'Se isso nao funcionar, estou aberto(a) a encontrar uma versao menor que funcione para nos dois'

  const withPeriod = /[.!?]$/.test(clean) ? clean : `${clean}.`
  if (/\b(nao|agora nao|depois|outro momento|versao menor|se isso nao funcionar)\b/i.test(withPeriod)) {
    return withPeriod.replace(/[.!?]$/, '')
  }

  return `${withPeriod} Se isso nao funcionar, podemos escolher uma versao menor ou outro momento?`.replace(/[.!?]$/, '')
}

function normalizeFlexibility(value: string) {
  const clean = value.trim()
  if (!clean) return 'If that does not work, I am open to finding a smaller version that works for both of us'

  const withPeriod = /[.!?]$/.test(clean) ? clean : `${clean}.`
  if (/\b(no|not right now|later|another time|smaller version|if that does not work|if that doesn't work)\b/i.test(withPeriod)) {
    return withPeriod.replace(/[.!?]$/, '')
  }

  return `${withPeriod} If that does not work, could we choose a smaller version or another time?`.replace(/[.!?]$/, '')
}
