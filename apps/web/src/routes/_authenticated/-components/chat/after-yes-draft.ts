import type { Locale } from '~/lib/i18n'

export function buildAfterYesDraft({
  agreement,
  care,
  nextStep,
  checkIn,
}: {
  agreement?: string
  care?: string
  nextStep?: string
  checkIn?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeAgreement = normalize(agreement, 'Fico feliz que encontramos um sim, mesmo que seja pequeno.')
    const safeCare = normalize(care, 'Eu me importo em transformar isso em algo gentil e possivel, nao em outro ponto de pressao.')
    const safeNextStep = normalize(nextStep, 'Podemos deixar o proximo passo concreto: o que cada um vai fazer e ate quando?')
    const safeCheckIn = normalize(checkIn, 'Se isso nao funcionar ou comecar a pesar demais, podemos ajustar em vez de abandonar em silencio?')

    return [
      safeAgreement,
      '',
      safeCare,
      '',
      safeNextStep,
      '',
      safeCheckIn,
    ].join('\n')
  }

  const safeAgreement = normalize(agreement, 'I am glad we found a yes, even if it is a small one.')
  const safeCare = normalize(care, 'I care about us turning it into something kind and doable, not another pressure point.')
  const safeNextStep = normalize(nextStep, 'Can we make the next step concrete: what each of us will do, and by when?')
  const safeCheckIn = normalize(checkIn, 'If that does not work or starts feeling too much, can we adjust it instead of silently dropping it?')

  return [
    safeAgreement,
    '',
    safeCare,
    '',
    safeNextStep,
    '',
    safeCheckIn,
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
