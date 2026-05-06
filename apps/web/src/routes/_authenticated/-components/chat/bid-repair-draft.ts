import type { Locale } from '~/lib/i18n'

export interface BidRepairDraftInput {
  missed?: string
  impact?: string
  wish?: string
  offer?: string
}

export function buildBidRepairDraft({
  missed,
  impact,
  wish,
  offer,
}: BidRepairDraftInput = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeMissed = normalizeSentence(missed, 'eu perdi um momento em que voce estava tentando se aproximar de mim')
    const safeImpact = normalizeSentence(impact, 'consigo ver que isso pode ter parecido solitario ou decepcionante')
    const safeWish = normalizeSentence(wish, 'eu queria ter pausado e me voltado para voce mais cedo')
    const safeOffer = normalizeQuestion(offer, 'Posso tentar de novo agora e dar a esse momento a atencao que ele merecia?')

    return `Tenho pensado em um momento que talvez eu tenha perdido hoje.\n\nEu me importo em me voltar melhor para voce, nao em fazer voce provar que o momento importou.\n\nO que eu perdi: ${safeMissed}\n\nComo isso pode ter chegado em voce: ${safeImpact}\n\nO que eu queria ter feito: ${safeWish}\n\n${safeOffer}\n\nSe isso nao funcionar, podemos escolher uma versao menor ou outro momento?`
  }

  const safeMissed = normalizeSentence(missed, 'I missed a moment when you were reaching for me')
  const safeImpact = normalizeSentence(impact, 'I can see that may have felt lonely or disappointing')
  const safeWish = normalizeSentence(wish, 'I wish I had paused and turned toward you sooner')
  const safeOffer = normalizeQuestion(
    offer,
    'Can I try again now and give that moment the attention it deserved?',
  )

  return `I have been thinking about a moment I may have missed today.\n\nI care about turning toward you better, not making you prove the moment mattered.\n\nWhat I missed: ${safeMissed}\n\nHow it may have landed: ${safeImpact}\n\nWhat I wish I had done: ${safeWish}\n\n${safeOffer}\n\nIf that does not work, could we choose a smaller version or another time?`
}

function normalizeSentence(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function normalizeQuestion(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /\?$/.test(clean) ? clean : `${clean}?`
}
