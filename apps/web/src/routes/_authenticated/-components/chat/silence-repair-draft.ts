import type { Locale } from '~/lib/i18n'

export function buildSilenceRepairDraft({
  care,
  ownership,
  invitation,
}: {
  care?: string
  ownership?: string
  invitation?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeCare = normalize(care, 'Eu me importo com a gente, e fiquei quieto(a), mas nao quero que a distancia vire nossa resposta.')
    const safeOwnership = normalize(ownership, 'Posso assumir que nao facilitei a reconexao.')
    const safeInvitation = normalize(invitation, 'A gente poderia recomecar com um check-in gentil hoje?')

    return [
      safeCare,
      '',
      safeOwnership,
      '',
      safeInvitation,
      '',
      'Se isso nao funcionar, podemos escolher uma versao menor ou outro momento?',
    ].join('\n')
  }

  const safeCare = normalize(care, 'I care about us, and I have been quiet, but I do not want distance to become our answer.')
  const safeOwnership = normalize(ownership, 'I can own that I did not make it easy to reconnect.')
  const safeInvitation = normalize(invitation, 'Could we restart with one gentle check-in today?')

  return [
    safeCare,
    '',
    safeOwnership,
    '',
    safeInvitation,
    '',
    'If that does not work, could we choose a smaller version or another time?',
  ].join('\n')
}

export function buildNoReplyFollowupDraft({
  originalBid,
  reassurance,
  clearAsk,
}: {
  originalBid?: string
  reassurance?: string
  clearAsk?: string
} = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeBid = normalize(originalBid, 'Enviei algo vulneravel e percebi que comecei a preencher o silencio com historias.')
    const safeReassurance = normalize(reassurance, 'Eu me importo em continuar conectado(a), e nao estou tentando te pressionar nem comecar uma briga.')
    const safeAsk = normalize(clearAsk, 'Voce poderia me dizer quando tiver espaco para responder, mesmo que seja mais tarde hoje?')

    return [
      safeBid,
      '',
      safeReassurance,
      '',
      safeAsk,
    ].join('\n')
  }

  const safeBid = normalize(originalBid, 'I sent something vulnerable and noticed I started filling in the silence with stories.')
  const safeReassurance = normalize(reassurance, 'I care about staying connected, and I am not trying to pressure you or start a fight.')
  const safeAsk = normalize(clearAsk, 'Could you let me know when you have space to respond, even if the answer is later today?')

  return [
    safeBid,
    '',
    safeReassurance,
    '',
    safeAsk,
  ].join('\n')
}

function normalize(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, ' ').trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}
