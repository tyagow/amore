import type { Locale } from '~/lib/i18n'

type Entity = {
  type: string
  status?: string | null
  content: unknown
}

type DiscoveryMove = {
  kind: 'wish' | 'important_date' | 'shared_interest' | 'partner_interest' | 'fallback'
  title: string
  detail: string
  chatDraft: string
  goalDraft: {
    title: string
    description: string
  }
}

export function getDiscoveryLabel(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{')) {
      try {
        return labelFromRecord(JSON.parse(trimmed) as Record<string, unknown>)
      } catch {
        return trimmed
      }
    }

    return trimmed
  }

  if (!value || typeof value !== 'object') {
    return String(value)
  }

  return labelFromRecord(value as Record<string, unknown>)
}

export function getDiscoveryList(value: unknown) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(getDiscoveryLabel).filter(Boolean)

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(getDiscoveryLabel).filter(Boolean)
  }

  return [getDiscoveryLabel(value)].filter(Boolean)
}

export function buildDiscoveryMove({
  myInterests,
  partnerInterests,
  entities,
  partnerName,
  locale = 'en',
}: {
  myInterests: unknown
  partnerInterests: unknown
  entities: Entity[]
  partnerName?: string
  locale?: Locale
}): DiscoveryMove {
  const activeWish = entities.find((entity) => entity.type === 'wish' && entity.status !== 'fulfilled')
  if (activeWish) {
    const wish = getEntityText(activeWish)
    return {
      kind: 'wish',
      title: 'There is a wish you can turn into care.',
      detail: wish,
      chatDraft: buildWishChatDraft(wish, locale),
      goalDraft: {
        title: locale === 'pt-BR' ? `Fazer uma coisa pequena por: ${wish}` : `Do one small thing for: ${wish}`,
        description: locale === 'pt-BR' ? 'Escolha uma forma realista de honrar esse desejo nesta semana. Mantenha cuidadoso e voluntario, nao outra fonte de pressao.' : 'Choose one realistic way to honor this wish this week. Keep it thoughtful and voluntary, not another source of pressure.',
      },
    }
  }

  const upcomingDate = entities.find((entity) => entity.type === 'important_date')
  if (upcomingDate) {
    const date = getEntityText(upcomingDate)
    return {
      kind: 'important_date',
      title: 'There is an important date worth protecting.',
      detail: date,
      chatDraft: buildImportantDateChatDraft(date, locale),
      goalDraft: {
        title: locale === 'pt-BR' ? `Planejar algo cuidadoso para ${date}` : `Plan something thoughtful for ${date}`,
        description: locale === 'pt-BR' ? 'Decidam com antecedencia como fazer essa data parecer cuidada, para que nao vire correria de ultima hora.' : 'Decide ahead of time how to make this date feel cared for, so it does not become a last-minute rush.',
      },
    }
  }

  const mine = getDiscoveryList(myInterests)
  const partner = getDiscoveryList(partnerInterests)
  const shared = mine.find((interest) =>
    partner.some((partnerInterest) => partnerInterest.toLowerCase() === interest.toLowerCase()),
  )

  if (shared) {
    return {
      kind: 'shared_interest',
      title: 'A shared interest can become quality time.',
      detail: shared,
      chatDraft: locale === 'pt-BR'
        ? `Percebi que ${shared} parece ser algo que conecta nos dois.\n\nQuero transformar interesses compartilhados em conexao facil, nao pressao.\n\nPodemos transformar isso em um pequeno momento juntos nesta semana, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
        : `I noticed ${shared} is something we both seem connected to.\n\nI care about turning shared interests into easy connection, not pressure.\n\nCould we turn it into one small moment together this week, or pick a smaller version later if now is not a good time?`,
      goalDraft: {
        title: locale === 'pt-BR' ? `Criar tempo para ${shared} juntos` : `Make time for ${shared} together`,
        description: locale === 'pt-BR' ? 'Planejem um momento facil em torno desse interesse compartilhado e perguntem o que o tornaria gostoso para os dois.' : 'Plan one easy moment around this shared interest and ask what would make it enjoyable for both of you.',
      },
    }
  }

  const partnerOnly = partner[0]
  if (partnerOnly) {
    return {
      kind: 'partner_interest',
      title: `${partnerName || 'Your partner'} has an interest you can follow up on.`,
      detail: partnerOnly,
      chatDraft: buildInterestChatDraft(partnerOnly, locale),
      goalDraft: {
        title: locale === 'pt-BR' ? `Perguntar sobre ${partnerOnly}` : `Ask about ${partnerOnly}`,
        description: locale === 'pt-BR' ? 'Pergunte com curiosidade, depois reflita uma coisa que aprendeu para sua parceria se sentir vista em vez de entrevistada.' : 'Ask with curiosity, then reflect back one thing you learned so your partner feels seen instead of interviewed.',
      },
    }
  }

  return {
    kind: 'fallback',
    title: 'Use one discovery as a real check-in.',
  detail: 'Pick one thing the app learned and ask about it with curiosity.',
  chatDraft: locale === 'pt-BR'
    ? `Quero te conhecer melhor nesta semana, nao so presumir que ja conheco.\n\nQuero continuar curioso sobre sua vida real.\n\nQual e uma pequena coisa que voce tem curtido, desejado ou pensado ultimamente?\n\nSe agora nao for uma boa hora, podemos voltar nisso depois?`
    : `I want to know you better this week, not just assume I already do.\n\nI care about staying curious about your real life.\n\nWhat is one small thing you have been enjoying, wanting, or thinking about lately?\n\nIf now is not a good time, could we come back to it later?`,
  goalDraft: {
    title: locale === 'pt-BR' ? 'Fazer uma pergunta curiosa nesta semana' : 'Ask one curiosity question this week',
    description: locale === 'pt-BR' ? 'Pergunte uma coisa que sua parceria esta curtindo, desejando ou pensando, depois escute sem corrigir nem direcionar a resposta.' : 'Ask one thing your partner is enjoying, wanting, or thinking about, then listen without correcting or steering the answer.',
  },
  }
}

export function buildWishChatDraft(wish: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') return `Percebi que este desejo importa: ${wish}.\n\nQuero honrar isso de um jeito cuidadoso, nao como mais uma tarefa.\n\nPodemos escolher uma forma pequena e realista de honrar isso nesta semana, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
  return `I noticed this wish matters: ${wish}.\n\nI care about honoring it in a way that feels thoughtful, not like another task.\n\nCould we choose one small, realistic way to honor it this week, or pick a smaller version later if now is not a good time?`
}

export function buildImportantDateChatDraft(date: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') return `Vi esta data importante no contexto do nosso relacionamento nesta semana: ${date}.\n\nQuero proteger isso antes que vire correria ou suposicao.\n\nPodemos decidir agora como queremos fazer essa data parecer cuidada, ou escolher um plano menor mais tarde se agora nao for uma boa hora?`
  return `I saw this important date in our relationship context this week: ${date}.\n\nI care about protecting it before it becomes rushed or assumed.\n\nCan we decide now how we want to make it feel cared for, or choose a smaller plan later if now is not a good time?`
}

export function buildInterestChatDraft(interest: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') return `Percebi que ${interest} continua aparecendo como algo significativo nesta semana.\n\nQuero conhecer melhor essa parte do seu mundo.\n\nVoce me contaria o que tem gostado nisso ultimamente, ou podemos voltar nisso depois se agora nao for uma boa hora?`
  return `I noticed ${interest} keeps showing up as something meaningful this week.\n\nI care about knowing that part of your world better.\n\nWould you tell me what you have been enjoying about it lately, or come back to it later if now is not a good time?`
}

function labelFromRecord(record: Record<string, unknown>) {
  return String(
    record.topic ??
      record.title ??
      record.name ??
      record.label ??
      record.item ??
      record.text ??
      record.description ??
      record.value ??
      'Discovery',
  )
}

export function getEntityText(entity: Entity) {
  const content = recordFromUnknown(entity.content)
  if (!content) return getDiscoveryLabel(entity.content || 'something meaningful')

  return String(
    content.text ??
      content.description ??
      content.item ??
      content.name ??
      content.title ??
      content.date ??
      'something meaningful',
  )
}

export function getEntityField(entity: Entity, field: string) {
  const content = recordFromUnknown(entity.content)
  if (!content) return ''

  const value = content[field]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function recordFromUnknown(value: unknown) {
  if (!value) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.startsWith('{')) return null

    try {
      const parsed = JSON.parse(trimmed) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null
    } catch {
      return null
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}
