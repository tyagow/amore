import type { Locale } from '~/lib/i18n'

export type HotMomentState = 'sharp' | 'shutdown' | 'flooded' | 'spiraling'

export const HOT_MOMENT_STATES: Record<HotMomentState, { label: string; body: string }> = {
  sharp: {
    label: 'I am getting sharp',
    body: 'I can feel my words getting pointed.',
  },
  shutdown: {
    label: 'I am shutting down',
    body: 'I am going quiet and I do not want that to feel like punishment.',
  },
  flooded: {
    label: 'I feel flooded',
    body: 'My body is too activated for me to listen well right now.',
  },
  spiraling: {
    label: 'We are spiraling',
    body: 'We are repeating the same loop and I want to stop before we hurt each other more.',
  },
}

const PT_HOT_MOMENT_BODY: Record<HotMomentState, string> = {
  sharp: 'Consigo sentir minhas palavras ficando pontudas.',
  shutdown: 'Estou ficando quieto(a) e nao quero que isso pareca punicao.',
  flooded: 'Meu corpo esta ativado demais para eu escutar bem agora.',
  spiraling: 'Estamos repetindo o mesmo ciclo e quero parar antes que a gente se machuque mais.',
}

function clean(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export function buildHotMomentResetDraft({
  state,
  returnTime,
  resetAction,
  locale = 'en',
}: {
  state: HotMomentState
  returnTime?: string
  resetAction?: string
  locale?: Locale
}) {
  const moment = HOT_MOMENT_STATES[state]
  const time = clean(returnTime) || '20 minutes'
  const action = clean(resetAction) || 'breathe, cool down, and come back ready to listen'

  if (locale === 'pt-BR') {
    const ptMomentBody = PT_HOT_MOMENT_BODY[state]
    return [
      `${ptMomentBody} Eu me importo com a gente e nao quero que essa conversa vire dano.`,
      '',
      `Preciso de ${time} para me regular. Nao estou saindo do relacionamento nem evitando voce.`,
      `Enquanto eu pauso, eu vou ${action}.`,
      '',
      'Quando eu voltar, quero comecar por uma coisa que entendi de voce antes de explicar meu lado.',
      '',
      'Se esse horario nao funcionar para voce, podemos escolher uma pausa menor ou outro momento para continuar?',
    ].join('\n')
  }

  return [
    `${moment.body} I care about us, and I do not want this conversation to become damage.`,
    '',
    `I need ${time} to reset. I am not leaving the relationship or avoiding you.`,
    `While I pause, I will ${action}.`,
    '',
    'When I come back, I want to start with one thing I understood from you before I explain my side.',
    '',
    'If that timing does not work for you, could we choose a smaller pause or another time to continue?',
  ].join('\n')
}

export function buildHotMomentReturnDraft({
  state,
  returnTime,
  locale = 'en',
}: {
  state: HotMomentState
  returnTime?: string
  locale?: Locale
}) {
  const moment = HOT_MOMENT_STATES[state]
  const time = clean(returnTime) || '20 minutes'

  if (locale === 'pt-BR') {
    const ptMomentBody = PT_HOT_MOMENT_BODY[state]
    return [
      `Voltei depois da pausa de ${time}. Obrigado por dar espaco para a conversa esfriar.`,
      '',
      `Antes da pausa, o que estava acontecendo comigo: ${ptMomentBody}`,
      '',
      'Uma coisa que eu entendi de voce e: ____.',
      '',
      'Uma coisa que quero assumir antes de explicar meu lado e: ____.',
      '',
      'Parece ok continuar agora, ou devemos escolher um proximo passo menor ou outro momento?',
    ].join('\n')
  }

  return [
    `I am back after the ${time} pause. Thank you for giving the conversation room to cool down.`,
    '',
    `Before the pause, what was happening for me: ${moment.body}`,
    '',
    'One thing I understood from you is: ____.',
    '',
    'One thing I want to own before I explain my side is: ____.',
    '',
    'Would it feel okay to continue now, or should we choose a smaller next step or another time?',
  ].join('\n')
}
