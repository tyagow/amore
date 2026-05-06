import type { Locale } from '~/lib/i18n'

type ListenDraftInput = {
  heard?: string
  emotion?: string
  ownership?: string
  question?: string
}

function clean(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export function buildListenFirstDraft(input: ListenDraftInput, locale: Locale = 'en') {
  const heard = clean(input.heard)
  const emotion = clean(input.emotion)
  const ownership = clean(input.ownership)
  const question = clean(input.question)

  if (locale === 'pt-BR') {
    return [
      'Quero garantir que estou te escutando hoje antes de responder.',
      'Eu me importo em te entender, nao em montar minha defesa.',
      heard ? `O que eu ouvi: ${heard}` : 'O que eu ouvi: ____.',
      emotion ? `Faz sentido que voce tenha sentido ${emotion}.` : 'Faz sentido que voce tenha sentido ____.',
      ownership ? `Uma parte que posso assumir: ${ownership}` : 'Uma parte que posso assumir: ____.',
      question
        ? `Posso fazer uma pergunta para entender melhor: ${question}`
        : 'Posso fazer uma pergunta para entender melhor: ____?',
      'Se isso nao funcionar agora, posso so escutar primeiro e perguntar depois.',
    ].join('\n')
  }

  return [
    'I want to make sure I am hearing you today before I respond.',
    'I care about understanding you, not building my defense.',
    heard ? `What I heard: ${heard}` : 'What I heard: ____.',
    emotion ? `It makes sense that you felt ${emotion}.` : 'It makes sense that you felt ____.',
    ownership ? `One part I can own: ${ownership}` : 'One part I can own: ____.',
    question
      ? `Can I ask one question so I understand better: ${question}`
      : 'Can I ask one question so I understand better: ____?',
    'If that does not work right now, I can just listen first and ask later.',
  ].join('\n')
}
