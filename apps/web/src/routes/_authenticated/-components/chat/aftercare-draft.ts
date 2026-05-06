import type { Locale } from '~/lib/i18n'

const SHORT_CONTEXT_LENGTH = 90
const LONG_CONTEXT_LENGTH = 30

function cleanDraft(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function trimContext(text: string) {
  const cleaned = cleanDraft(text)
  if (cleaned.length <= SHORT_CONTEXT_LENGTH) return cleaned
  return `${cleaned.slice(0, LONG_CONTEXT_LENGTH).trim()}...`
}

export function buildAftercareDraft(text: string, locale: Locale = 'en') {
  const context = trimContext(text)

  if (locale === 'pt-BR') {
    const lines = [
      'Depois que a gente conversar sobre isso, nao quero que a gente simplesmente se separe e adivinhe onde ficou.',
      'Eu me importo em terminar de um jeito claro e gentil, mesmo que nem tudo esteja resolvido.',
      'A gente poderia terminar com tres coisas pequenas?',
      '1. Uma coisa que cada um entendeu.',
      '2. Um reparo ou tranquilizacao que precisamos hoje.',
      '3. Um proximo passo pequeno para as proximas 24 horas.',
      'Se isso parecer demais, podemos escolher so a menor parte e voltar ao resto depois?',
    ]

    if (context) {
      lines.push(`O assunto para usar isso e: ${context}`)
    }

    return lines.join('\n')
  }

  const lines = [
    'After we talk about this, I do not want us to just separate and guess where we stand.',
    'I care about us ending in a way that feels clear and kind, even if everything is not solved.',
    'Could we end with three small things?',
    '1. One thing each of us understood.',
    '2. One repair or reassurance we need tonight.',
    '3. One tiny next step for the next 24 hours.',
    'If that feels like too much, could we choose the smallest one and come back to the rest later?',
  ]

  if (context) {
    lines.push(`The thing I want us to use this for is: ${context}`)
  }

  return lines.join('\n')
}
