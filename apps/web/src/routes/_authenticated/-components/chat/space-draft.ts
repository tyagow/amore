import type { Locale } from '~/lib/i18n'

export interface SpaceDraftInput {
  capacity?: string
  reassurance?: string
  returnTime?: string
  request?: string
}

export function buildSpaceDraft({
  capacity,
  reassurance,
  returnTime,
  request,
}: SpaceDraftInput = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeCapacity = normalizeSentence(capacity, 'estou ficando sobrecarregado(a) e nao quero continuar falando desse lugar')
    const safeReassurance = normalizeSentence(reassurance, 'eu me importo com a gente e nao estou abandonando a conversa')
    const safeReturnTime = normalizeSentence(returnTime, 'posso voltar em 30 minutos')
    const safeRequest = normalizeQuestion(request, 'A gente poderia pausar ate la e recomecar com mais cuidado?')

    return `${safeReassurance}\n\n${safeCapacity}\n\nO que eu preciso: ${safeReturnTime}\n\n${safeRequest}\n\nSe isso nao funcionar, podemos escolher outro horario claro para voltar?`
  }

  const safeCapacity = normalizeSentence(
    capacity,
    'I am getting overwhelmed and I do not want to keep talking from that place',
  )
  const safeReassurance = normalizeSentence(
    reassurance,
    'I care about us and I am not leaving the conversation',
  )
  const safeReturnTime = normalizeSentence(returnTime, 'I can come back in 30 minutes')
  const safeRequest = normalizeQuestion(
    request,
    'Could we pause until then and restart more gently?',
  )

  return `${safeReassurance}\n\n${safeCapacity}\n\nWhat I need: ${safeReturnTime}\n\n${safeRequest}\n\nIf that does not work, could we choose another clear return time?`
}

function normalizeSentence(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function normalizeQuestion(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /\?$/.test(clean) ? clean : `${clean}?`
}
