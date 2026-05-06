import type { Locale } from '~/lib/i18n'

export function buildRedoMessageDraft({
  toneOwnership,
  underlyingNeed,
  resetAsk,
}: {
  toneOwnership?: string
  underlyingNeed?: string
  resetAsk?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeToneOwnership = normalize(toneOwnership, 'Nao gosto de como minha ultima mensagem saiu hoje.')
    const safeUnderlyingNeed = normalize(underlyingNeed, 'Por baixo do tom duro, o que eu estava tentando dizer e que quero que a gente se entenda melhor.')
    const safeResetAsk = normalize(resetAsk, 'Posso tentar de novo com uma versao mais calma, em vez de te fazer responder a pior versao disso?')

    return [
      safeToneOwnership,
      '',
      safeUnderlyingNeed,
      '',
      safeResetAsk,
      '',
      'Se isso nao funcionar agora, posso dar espaco e tentar de novo mais tarde.',
    ].join('\n')
  }

  const safeToneOwnership = normalize(toneOwnership, 'I do not like how my last message came out today.')
  const safeUnderlyingNeed = normalize(underlyingNeed, 'Under the sharpness, what I was trying to say is that I want us to understand each other better.')
  const safeResetAsk = normalize(resetAsk, 'Can I try again with a calmer version instead of making you respond to the worst version of it?')

  return [
    safeToneOwnership,
    '',
    safeUnderlyingNeed,
    '',
    safeResetAsk,
    '',
    'If that does not work right now, I can give this room and try again later.',
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
