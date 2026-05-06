import type { Locale } from '~/lib/i18n'

export function buildRespectNoDraft({
  noHeard,
  feeling,
  care,
  nextStep,
}: {
  noHeard?: string
  feeling?: string
  care?: string
  nextStep?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeNoHeard = normalize(noHeard, 'Obrigado(a) por ser honesto(a) comigo, mesmo que a resposta seja nao ou agora nao.')
    const safeFeeling = normalize(feeling, 'Estou decepcionado(a), e nao quero transformar isso em pressao sobre voce.')
    const safeCare = normalize(care, 'Eu me importo mais com a gente se sentir seguro do que com receber exatamente a resposta que eu queria.')
    const safeNextStep = normalize(nextStep, 'A gente poderia escolher uma versao menor, outro momento, ou simplesmente deixar isso como nao por hoje?')

    return [
      safeNoHeard,
      '',
      safeFeeling,
      '',
      safeCare,
      '',
      safeNextStep,
    ].join('\n')
  }

  const safeNoHeard = normalize(noHeard, 'Thank you for being honest with me, even if the answer is no or not right now.')
  const safeFeeling = normalize(feeling, 'I feel disappointed, and I do not want to turn that into pressure on you.')
  const safeCare = normalize(care, 'I care more about us feeling safe than about getting the exact answer I wanted.')
  const safeNextStep = normalize(nextStep, 'Could we choose a smaller version, another time, or simply let this be no for today?')

  return [
    safeNoHeard,
    '',
    safeFeeling,
    '',
    safeCare,
    '',
    safeNextStep,
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
