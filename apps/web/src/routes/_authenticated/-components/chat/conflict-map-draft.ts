import type { Locale } from '~/lib/i18n'

export interface ConflictMapDraftInput {
  observation?: string
  feeling?: string
  story?: string
  request?: string
}

export function buildConflictMapDraft({
  observation,
  feeling,
  story,
  request,
}: ConflictMapDraftInput = {}, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const safeObservation = normalizeSentence(observation, 'o que aconteceu, sem acrescentar culpa ou motivo')
    const safeFeeling = normalizeSentence(feeling, 'eu me senti magoado(a), estressado(a) ou desconectado(a)')
    const safeStory = normalizeSentence(story, 'a historia que comecei a contar para mim talvez nao seja toda a verdade')
    const safeRequest = normalizeQuestion(request, 'A gente poderia desacelerar e entender o que aconteceu para cada um?')

    return `Quero falar sobre isso hoje de um jeito que mantenha a gente no mesmo time.\n\nO que eu percebi: ${safeObservation}\n\nO que eu senti: ${safeFeeling}\n\nA historia que comecei a contar para mim: ${safeStory}\n\n${safeRequest}\n\nSe isso nao funcionar, podemos escolher uma versao menor ou outro momento?`
  }

  const safeObservation = normalizeSentence(
    observation,
    'what happened, without adding blame or motive',
  )
  const safeFeeling = normalizeSentence(feeling, 'I felt hurt, stressed, or disconnected')
  const safeStory = normalizeSentence(
    story,
    'the story I started telling myself may not be the whole truth',
  )
  const safeRequest = normalizeQuestion(
    request,
    'Could we slow down and understand what happened for each of us?',
  )

  return `I want to talk about this today in a way that keeps us on the same team.\n\nWhat I noticed: ${safeObservation}\n\nWhat I felt: ${safeFeeling}\n\nThe story I started telling myself: ${safeStory}\n\n${safeRequest}\n\nIf that does not work, could we choose a smaller version or another time?`
}

function normalizeSentence(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function normalizeQuestion(value: string | undefined, fallback: string) {
  const clean = value?.trim() || fallback
  return /\?$/.test(clean) ? clean : `${clean}?`
}
