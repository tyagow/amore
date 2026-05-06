import type { Locale } from '~/lib/i18n'

export type DraftCareCheck = {
  label: string
  passed: boolean
  detail: string
}

export type DraftSendPreparation = {
  ready: boolean
  text: string
}

const GLOBAL_BLAME_PATTERN = /\byou\s+(never|always)\b|\byou\s+don'?t\s+care\b/i
const REQUEST_PATTERN = /\?|(?:\bcould we\b|\bcan we\b|\bwould you\b|\bi need\b|\bi would appreciate\b|\bpodemos\b|\ba gente poderia\b|\bvoce poderia\b|\beu preciso\b|\beu apreciaria\b)/i
const ROOM_FOR_NO_PATTERN = /\b(no|not right now|later|another time|smaller version|if not|if that does not work|if that doesn't work|only if|when you have space|nao|mais tarde|outro momento|versao menor|se agora nao|se isso nao funcionar|quando voce tiver espaco)\b/i
const SUPPORT_CHOICE_PATTERN = /\b(comfort|listening|problem-solving|problem solving|space|closeness|practical help|reassurance|conforto|escuta|resolver problema|espaco|proximidade|ajuda pratica|reasseguranca)\b.*\b(or|ou)\b/i
const SPECIFIC_CONTEXT_PATTERN = /\b(when|after|today|tonight|yesterday|this morning|this week|the call|the message|dinner|plans|quando|depois|hoje|esta noite|ontem|esta manha|esta semana|nesta semana|a ligacao|a mensagem|jantar|planos)\b/i
const WARMTH_PATTERN = /\b(i care|care about us|i love|i appreciate|thank you|grateful|on the same team|i want us|i want to support you|support you|follow your lead|eu me importo|me importo com a gente|eu amo|eu aprecio|obrigado|obrigada|sou grato|sou grata|no mesmo time|quero que a gente|quero nos|quero apoiar voce|apoiar voce|seguir seu ritmo)\b/i

export function getDraftCareChecks(text: string): DraftCareCheck[] {
  const draft = text.replace(/\s+/g, ' ').trim()
  const hasRequest = REQUEST_PATTERN.test(draft)

  return [
    {
      label: 'Specific moment',
      passed: SPECIFIC_CONTEXT_PATTERN.test(draft),
      detail: 'Name one real moment instead of making the whole relationship the problem.',
    },
    {
      label: 'Clear next ask',
      passed: REQUEST_PATTERN.test(draft),
      detail: 'Give your partner one answerable request or question.',
    },
    {
      label: 'No global blame',
      passed: !GLOBAL_BLAME_PATTERN.test(draft),
      detail: 'Avoid always, never, or do not care language when you want repair.',
    },
    {
      label: 'Warmth signal',
      passed: WARMTH_PATTERN.test(draft),
      detail: 'Add one line that tells your partner this is about closeness, not winning.',
    },
    {
      label: 'Room for no',
      passed: !hasRequest || ROOM_FOR_NO_PATTERN.test(draft) || SUPPORT_CHOICE_PATTERN.test(draft),
      detail: 'If you are asking for something, leave room for no, later, or a smaller version.',
    },
  ]
}

export function buildDraftWithClearAsk(text: string, locale: Locale = 'en') {
  const draft = text.trim()
  if (locale === 'pt-BR') {
    if (!draft) return 'A gente poderia conversar por 10 minutos hoje e escolher um proximo passo?'
    if (REQUEST_PATTERN.test(draft)) return draft

    const separator = /[.!?]$/.test(draft) ? '\n\n' : '.\n\n'
    return `${draft}${separator}A gente poderia conversar por 10 minutos hoje e escolher um proximo passo?`
  }

  if (!draft) return 'Could we talk for 10 minutes today and pick one next step?'
  if (REQUEST_PATTERN.test(draft)) return draft

  const separator = /[.!?]$/.test(draft) ? '\n\n' : '.\n\n'
  return `${draft}${separator}Could we talk for 10 minutes today and pick one next step?`
}

export function buildDraftWithSpecificMoment(text: string, locale: Locale = 'en') {
  const draft = text.trim()
  if (locale === 'pt-BR') {
    if (!draft) return 'Quando ____ aconteceu hoje, eu me senti ____.'
    if (SPECIFIC_CONTEXT_PATTERN.test(draft)) return draft

    return [
      'Quando ____ aconteceu hoje, eu me senti ____.',
      '',
      draft,
    ].join('\n')
  }

  if (!draft) return 'When ____ happened today, I felt ____.'
  if (SPECIFIC_CONTEXT_PATTERN.test(draft)) return draft

  return [
    'When ____ happened today, I felt ____.',
    '',
    draft,
  ].join('\n')
}

export function buildDraftWithOwnership(text: string, locale: Locale = 'en') {
  const draft = text.trim()
  if (locale === 'pt-BR') {
    const context = draft
      ? 'Quero dizer isso sem fazer de voce o problema inteiro.'
      : 'Quero dizer isso sem fazer de voce o problema inteiro.'

    return [
      'Quando ____ aconteceu hoje, eu me senti ____.',
      '',
      'Eu me importo com a gente, e quero que isso seja reparacao em vez de culpa.',
      '',
      context,
      '',
      'O impacto em mim foi: ____.',
      '',
      'A parte que posso assumir e: ____.',
      '',
      'O que quero que a gente entenda junto e: ____.',
    ].join('\n')
  }

  const context = draft
    ? 'I want to say this without making you the whole problem.'
    : 'I want to say this without making you the whole problem.'

  return [
    'When ____ happened today, I felt ____.',
    '',
    'I care about us, and I want this to be repair instead of blame.',
    '',
    context,
    '',
    'The impact on me was: ____.',
    '',
    'The part I can own is: ____.',
    '',
    'What I want us to understand together is: ____.',
  ].join('\n')
}

export function buildDraftWithWarmth(text: string, locale: Locale = 'en') {
  const draft = text.trim()
  if (locale === 'pt-BR') {
    if (!draft) return 'Eu me importo com a gente, e quero dizer isso de um jeito que mantenha a gente perto.'
    if (WARMTH_PATTERN.test(draft)) return draft

    return [
      'Eu me importo com a gente, e quero dizer isso de um jeito que mantenha a gente perto.',
      '',
      draft,
    ].join('\n')
  }

  if (!draft) return 'I care about us, and I want to say this in a way that keeps us close.'
  if (WARMTH_PATTERN.test(draft)) return draft

  return [
    'I care about us, and I want to say this in a way that keeps us close.',
    '',
    draft,
  ].join('\n')
}

export function buildDraftWithRoomForNo(text: string, locale: Locale = 'en') {
  const draft = text.trim()
  if (locale === 'pt-BR') {
    if (!draft) return 'A gente poderia conversar por 10 minutos hoje? Se nao, voce poderia sugerir uma versao menor ou outro momento?'
    if (!REQUEST_PATTERN.test(draft) || ROOM_FOR_NO_PATTERN.test(draft)) return draft

    const separator = /[.!?]$/.test(draft) ? '\n\n' : '.\n\n'
    return `${draft}${separator}Se isso nao funcionar para voce, poderia sugerir uma versao menor ou outro momento?`
  }

  if (!draft) return 'Could we talk for 10 minutes today? If not, could you suggest a smaller version or another time?'
  if (!REQUEST_PATTERN.test(draft) || ROOM_FOR_NO_PATTERN.test(draft)) return draft

  const separator = /[.!?]$/.test(draft) ? '\n\n' : '.\n\n'
  return `${draft}${separator}If that does not work for you, could you suggest a smaller version or another time?`
}

export function buildDraftReadyForSend(text: string, locale: Locale = 'en') {
  let draft = text.trim()
  if (!draft) return ''

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const checks = getDraftCareChecks(draft)
    if (checks.every((check) => check.passed)) return draft

    for (const check of checks) {
      if (check.passed) continue
      if (check.label === 'No global blame') {
        draft = buildDraftWithOwnership(draft, locale)
        break
      }
      if (check.label === 'Specific moment') {
        draft = buildDraftWithSpecificMoment(draft, locale)
        break
      }
      if (check.label === 'Clear next ask') {
        draft = buildDraftWithClearAsk(draft, locale)
        break
      }
      if (check.label === 'Warmth signal') {
        draft = buildDraftWithWarmth(draft, locale)
        break
      }
      if (check.label === 'Room for no') {
        draft = buildDraftWithRoomForNo(draft, locale)
        break
      }
    }
  }

  return draft
}

export function prepareDraftForSend(text: string, locale: Locale = 'en'): DraftSendPreparation {
  const draft = text.trim()
  if (!draft) return { ready: false, text: '' }

  const checks = getDraftCareChecks(draft)
  if (checks.every((check) => check.passed)) return { ready: true, text: draft }

  return {
    ready: false,
    text: buildDraftReadyForSend(draft, locale),
  }
}
