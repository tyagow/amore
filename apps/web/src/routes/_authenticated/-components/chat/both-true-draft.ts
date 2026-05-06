import type { Locale } from '~/lib/i18n'

export function buildBothTrueDraft({
  partnerTruth,
  myTruth,
  sharedCare,
  nextQuestion,
}: {
  partnerTruth?: string
  myTruth?: string
  sharedCare?: string
  nextQuestion?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safePartnerTruth = normalize(partnerTruth, 'Quando falamos sobre esse momento hoje, consigo ver que a sua experiencia e real, mesmo que eu tenha vivido diferente.')
    const safeMyTruth = normalize(myTruth, 'A minha experiencia tambem e real, e quero dizer isso sem apagar a sua.')
    const safeSharedCare = normalize(sharedCare, 'Eu me importo mais em entendermos os dois lados do que em provar quem esta certo.')
    const safeNextQuestion = normalize(nextQuestion, 'A gente poderia dizer o que cada um mais precisa que o outro entenda antes de tentar resolver, ou pausar e voltar depois se isso for demais agora?')

    return [
      safePartnerTruth,
      '',
      safeMyTruth,
      '',
      safeSharedCare,
      '',
      safeNextQuestion,
    ].join('\n')
  }

  const safePartnerTruth = normalize(partnerTruth, 'When we talk about this moment today, I can see that your experience is real, even if I experienced it differently.')
  const safeMyTruth = normalize(myTruth, 'My experience is also real, and I want to say it without erasing yours.')
  const safeSharedCare = normalize(sharedCare, 'I care about us understanding both sides more than proving one of us right.')
  const safeNextQuestion = normalize(nextQuestion, 'Could we each say what we most need the other to understand before we try to solve it, or pause and come back later if that is too much right now?')

  return [
    safePartnerTruth,
    '',
    safeMyTruth,
    '',
    safeSharedCare,
    '',
    safeNextQuestion,
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
