import type { Locale } from '~/lib/i18n'

type LongingDraftInput = {
  complaint?: string
  longing?: string
  request?: string
  appreciation?: string
}

function clean(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export function buildLongingDraft(input: LongingDraftInput, locale: Locale = 'en') {
  const complaint = clean(input.complaint)
  const longing = clean(input.longing)
  const request = clean(input.request)
  const appreciation = clean(input.appreciation)

  if (locale === 'pt-BR') {
    return [
      'Estou tentando dizer a necessidade por baixo da reclamacao hoje, em vez de te culpar.',
      'Eu me importo em continuar conectado(a) enquanto digo isso.',
      complaint
        ? `Quando isso acontece: ${complaint}`
        : 'Quando isso acontece: ____.',
      longing
        ? `O que eu realmente estou desejando e: ${longing}`
        : 'O que eu realmente estou desejando e: ____.',
      request
        ? `A gente poderia tentar isso em vez disso: ${request}`
        : 'A gente poderia tentar isso em vez disso: ____.',
      appreciation
        ? `Uma coisa que ainda aprecio em voce e: ${appreciation}`
        : 'Uma coisa que ainda aprecio em voce e: ____.',
      'Se isso nao funcionar, podemos escolher uma versao menor ou outro momento?',
    ].join('\n')
  }

  return [
    'I am trying to say the need underneath the complaint today instead of blaming you.',
    'I care about staying connected while I say this.',
    complaint
      ? `When this happens: ${complaint}`
      : 'When this happens: ____.',
    longing
      ? `What I am really longing for is: ${longing}`
      : 'What I am really longing for is: ____.',
    request
      ? `Could we try this instead: ${request}`
      : 'Could we try this instead: ____.',
    appreciation
      ? `One thing I still appreciate about you is: ${appreciation}`
      : 'One thing I still appreciate about you is: ____.',
    'If that does not work, could we choose a smaller version or another time?',
  ].join('\n')
}
