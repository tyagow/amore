import type { Locale } from '~/lib/i18n'

export function buildLoveLanguageDraft(name: string, language: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return `Percebi que a linguagem do amor de ${name} nesta semana e ${language}.\n\nQuero demonstrar amor do jeito que realmente chega.\n\nPodemos escolher uma pequena forma de tornar isso real, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
  }
  return `I noticed ${name}'s love language is ${language} this week.\n\nI care about showing love in the way it actually lands.\n\nCould we choose one small way to make that feel real, or pick a smaller version later if now is not a good time?`
}

export function buildCommunicationStyleDraft(name: string, style: string, description?: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return `Quero me comunicar com ${name} de um jeito que seja mais facil de receber nesta semana.\n\nQuero tornar conversas dificeis mais seguras, nao so tecnicamente claras.\n\nO estilo que estou mantendo em mente e ${style}${description ? `: ${description}` : ''}.\n\nPodemos conversar sobre o que ajuda as conversas a parecerem seguras e claras para voce, ou escolher um momento menor mais tarde?`
  }
  return `I want to communicate with ${name} in a way that feels easier to receive this week.\n\nI care about making hard talks safer, not just being technically clear.\n\nThe style I am keeping in mind is ${style}${description ? `: ${description}` : ''}.\n\nCan we talk about what helps conversations feel safe and clear for you, or choose a smaller moment later?`
}

export function buildInterestDraft(name: string, interest: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return [
      `Percebi que ${interest} importa para ${name}.`,
      '',
      'Quero conhecer melhor essa parte de voce.',
      '',
      'Voce me contaria o que tem gostado nisso ultimamente?',
      '',
      'Podemos escolher uma versao pequena para compartilhar nesta semana, mesmo que sejam so 15 minutos, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?',
    ].join('\n')
  }
  return [
    `I noticed ${interest} matters to ${name}.`,
    '',
    'I care about knowing that part of you better.',
    '',
    'Would you tell me what you have been enjoying about it lately?',
    '',
    'Could we choose one tiny shared version this week, even if it is just 15 minutes, or pick a smaller version later if now is not a good time?',
  ].join('\n')
}

export function buildProfileBridgeDraft({
  partnerName,
  myLoveLanguage,
  partnerLoveLanguage,
  myCommunicationStyle,
  partnerCommunicationStyle,
}: {
  partnerName: string
  myLoveLanguage?: string | null
  partnerLoveLanguage?: string | null
  myCommunicationStyle?: string | null
  partnerCommunicationStyle?: string | null
}, locale: Locale = 'en') {
  const safeName = partnerName.trim() || (locale === 'pt-BR' ? 'voce' : 'you')
  const myCare = myLoveLanguage?.trim() || (locale === 'pt-BR' ? 'o que me ajuda a me sentir cuidado' : 'what helps me feel cared for')
  const partnerCare = partnerLoveLanguage?.trim() || (locale === 'pt-BR' ? `o que ajuda ${safeName} a se sentir cuidado` : `what helps ${safeName} feel cared for`)
  const myTalk = myCommunicationStyle?.trim() || (locale === 'pt-BR' ? 'como conversas ficam mais seguras para mim' : 'how conversations feel safer for me')
  const partnerTalk = partnerCommunicationStyle?.trim() || (locale === 'pt-BR' ? `como conversas ficam mais seguras para ${safeName}` : `how conversations feel safer for ${safeName}`)

  if (locale === 'pt-BR') {
    return `Quero que a gente use nossos perfis como instrucoes praticas, nao como rotulos.\n\nPara mim, cuidado pode chegar por: ${myCare}.\nPara ${safeName}, cuidado pode chegar por: ${partnerCare}.\n\nNas conversas, quero lembrar: ${myTalk}.\nPara ${safeName}, quero lembrar: ${partnerTalk}.\n\nPodemos cada um escolher um pequeno ajuste para esta semana, para que os dois se sintam mais faceis de amar e mais faceis de conversar?\n\nSe agora nao for uma boa hora, podemos escolher uma versao menor mais tarde?`
  }

  return `I want us to use our profiles as practical instructions, not labels.\n\nFor me, care may land through: ${myCare}.\nFor ${safeName}, care may land through: ${partnerCare}.\n\nFor conversations, I want to remember: ${myTalk}.\nFor ${safeName}, I want to remember: ${partnerTalk}.\n\nCould we each pick one small adjustment for this week so both of us feel easier to love and easier to talk to?\n\nIf now is not a good time, could we choose a smaller version later?`
}

export function getProfileInterestItems(value: unknown) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map(toInterestLabel).filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{')) return [toInterestLabel(trimmed)].filter(Boolean)

    return value.split(',').map(toInterestLabel).filter(Boolean)
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (Array.isArray(record.items)) {
      return record.items.map(toInterestLabel).filter(Boolean)
    }

    const direct = labelFromRecord(record)
    if (direct) {
      return [direct]
    }

    return Object.values(record).map(toInterestLabel).filter(Boolean)
  }

  return []
}

function toInterestLabel(value: unknown) {
  if (!value) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return labelFromRecord(parsed as Record<string, unknown>) || trimmed
        }
      } catch {
        return trimmed
      }
    }

    return trimmed
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return labelFromRecord(value as Record<string, unknown>)
  }

  return String(value).trim()
}

function labelFromRecord(record: Record<string, unknown>) {
  const value = record.topic ?? record.title ?? record.name ?? record.label ?? record.text
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}
