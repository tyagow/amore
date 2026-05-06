import type { Locale } from '~/lib/i18n'

export function buildReassuranceDraft({
  care,
  worry,
  nextStep,
}: {
  care?: string
  worry?: string
  nextStep?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeCare = normalize(care, 'Eu me importo com a gente e ainda estou aqui.')
    const safeWorry = normalize(worry, 'Nao quero que a distancia entre nos fique maior.')
    const safeNextStep = normalize(nextStep, 'A gente poderia dar um pequeno passo de volta um para o outro hoje?')

    return [
      safeCare,
      '',
      safeWorry,
      '',
      safeNextStep,
      '',
      'Se isso nao funcionar, podemos escolher uma versao menor ou outro momento?',
    ].join('\n')
  }

  const safeCare = normalize(care, 'I care about us and I am still here.')
  const safeWorry = normalize(worry, 'I do not want the distance between us to get bigger.')
  const safeNextStep = normalize(nextStep, 'Could we take one small step back toward each other today?')

  return [
    safeCare,
    '',
    safeWorry,
    '',
    safeNextStep,
    '',
    'If that does not work, could we choose a smaller version or another time?',
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
