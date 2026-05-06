import type { Locale } from '~/lib/i18n'

type RepairDraftInput = {
  feeling?: string
  ownership?: string
  need?: string
  request?: string
}

const FALLBACK_REQUEST = 'talk for 10 minutes and understand each other before deciding what to do next'

export function buildRepairDraft({ feeling, ownership, need, request }: RepairDraftInput, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    const felt = normalizeFragment(feeling, 'algo ficou dificil para mim')
    const own = normalizeFragment(ownership, 'eu poderia ter cuidado melhor da minha parte')
    const supportNeed = normalizeFragment(need, 'eu preciso que a gente desacelere e sinta que esta no mesmo time')
    const ask = normalizeFragment(request, 'conversar por 10 minutos e entender um ao outro antes de decidir o proximo passo')

    return [
      'Quero reparar isso, nao vencer a discussao.',
      'Eu me importo com a gente continuar no mesmo time enquanto conversamos.',
      '',
      'O momento especifico que eu quero olhar e hoje ou o ultimo momento dificil entre nos.',
      `O que eu senti: ${felt}.`,
      `O que eu posso assumir: ${own}.`,
      `O que eu preciso: ${supportNeed}.`,
      '',
      `A gente poderia ${ask}?`,
      '',
      'Se isso nao funcionar, podemos escolher uma versao menor ou outro momento?',
    ].join('\n')
  }

  const felt = normalizeFragment(feeling, 'something felt hard for me')
  const own = normalizeFragment(ownership, 'I could have handled part of it more gently')
  const supportNeed = normalizeFragment(need, 'I need us to slow down and feel like we are on the same team')
  const ask = normalizeFragment(request, FALLBACK_REQUEST)

  return [
    'I want to repair this, not win it.',
    'I care about us staying on the same team while we talk about it.',
    '',
    'The specific moment I mean is today or the last hard moment between us.',
    `What I felt: ${felt}.`,
    `What I can own: ${own}.`,
    `What I need: ${supportNeed}.`,
    '',
    `Could we ${ask}?`,
    '',
    'If that does not work, could we choose a smaller version or another time?',
  ].join('\n')
}

function normalizeFragment(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  if (!trimmed) return fallback

  return trimmed.replace(/[.!?]+$/g, '')
}
