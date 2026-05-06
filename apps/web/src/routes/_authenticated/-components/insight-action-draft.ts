import { getInsightText } from './insight-text'
import type { Locale } from '~/lib/i18n'

type InsightAction = {
  label: string
  to: '/chat' | '/goals'
  storageKey: 'amore-chat-draft' | 'amore-goal-draft'
  draft: string
}

const LOVE_LANGUAGE_CARE: Record<string, string> = {
  acts_of_service: 'take one small thing off your plate without making you manage it',
  quality_time: 'protect a short no-phone pocket where I am fully present with you',
  words_of_affirmation: 'name one specific thing I appreciate instead of assuming you know',
  physical_touch: 'ask what kind of closeness would feel good and respect the answer',
  receiving_gifts: 'bring or make one small thing that shows I was thinking about you',
}

const LOVE_LANGUAGE_CARE_PT_BR: Record<string, string> = {
  acts_of_service: 'tirar uma pequena coisa da sua lista sem fazer voce gerenciar isso',
  quality_time: 'proteger um momento curto sem celular em que eu esteja plenamente presente com voce',
  words_of_affirmation: 'nomear uma coisa especifica que eu aprecio em vez de assumir que voce ja sabe',
  physical_touch: 'perguntar que tipo de proximidade seria boa e respeitar a resposta',
  receiving_gifts: 'trazer ou fazer uma coisa pequena que mostre que pensei em voce',
}

const COMMUNICATION_PATTERN_CARE: Record<string, string> = {
  avgResponseMinutes: 'agree on when a slower reply means busy, not distant',
  avgLengthBySender: 'make room for both a quick check-in and a fuller answer',
  initiationBalance: 'share who starts connection so it does not quietly become one person carrying it',
  messageCountBySender: 'pause and ask whether both of us have had enough space to say what matters',
  lateNightRepairAttempts: 'move repair attempts earlier, before we are tired and more reactive',
}

const COMMUNICATION_PATTERN_CARE_PT_BR: Record<string, string> = {
  avgResponseMinutes: 'combinar quando uma resposta mais lenta significa ocupacao, nao distancia',
  avgLengthBySender: 'abrir espaco tanto para um check-in rapido quanto para uma resposta mais completa',
  initiationBalance: 'dividir quem comeca a conexao para isso nao virar silenciosamente uma carga de uma pessoa so',
  messageCountBySender: 'pausar e perguntar se nos dois tivemos espaco suficiente para dizer o que importa',
  lateNightRepairAttempts: 'mover tentativas de reparo para mais cedo, antes de estarmos cansados e mais reativos',
}

export function getDashboardInsightAction({
  type,
  content,
  partnerName,
  locale = 'en',
}: {
  type: string
  content: unknown
  partnerName: string
  locale?: Locale
}): InsightAction | null {
  const isPt = locale === 'pt-BR'
  const text = getInsightText(content, locale)

  if (type === 'health_score' || type === 'conflict_alert') {
    return {
      label: 'Turn into a repair message',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? [
            `${partnerName}, li algo que me fez querer ser mais intencional com a gente.`,
            '',
            text,
            '',
            'Eu me importo com a gente reparando hoje, antes que distancia ou tensao comecem a parecer normais.',
            '',
            'Podemos tirar 10 minutos para conversar sobre o que ficou pesado?',
            '',
            'Uma parte que posso assumir e: ____.',
            '',
            'Um reparo que me ajudaria a me sentir mais perto de voce e: ____.',
            '',
            'Se agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?',
          ].join('\n')
        : [
            `Hey ${partnerName}, I read something that made me want to be more intentional with us.`,
            '',
            text,
            '',
            'I care about us repairing today before distance or tension starts to feel normal.',
            '',
            'Can we take 10 minutes to talk about what has felt heavy?',
            '',
            'One part I can own is: ____.',
            '',
            'One repair that would help me feel closer to you is: ____.',
            '',
            'If now is not a good time, could we choose a smaller moment later today?',
          ].join('\n'),
    }
  }

  if (type === 'goal_suggestion') {
    const record = content && typeof content === 'object' && !Array.isArray(content)
      ? content as Record<string, unknown>
      : null
    const title = record?.title
      ? isPt
        ? getInsightText({ title: String(record.title) }, locale)
        : String(record.title)
      : text
    const detail = record?.description || record?.summary || record?.message || record?.text
    const description = detail
      ? isPt
        ? getInsightText({ description: String(detail) }, locale)
        : String(detail)
      : isPt
        ? 'Escolham uma versao pequena que voces realmente conseguem tentar esta semana e depois confiram juntos se ajudou.'
        : 'Pick one tiny version you can actually try this week, then check together whether it helped.'

    return {
      label: 'Make it a goal',
      to: '/goals',
      storageKey: 'amore-goal-draft',
      draft: JSON.stringify({
        title,
        description: isPt
          ? `${description} Mantenha o objetivo pequeno, observavel e gentil o bastante para convidar continuidade em vez de pressao.`
          : `${description} Keep the goal small, observable, and kind enough that it invites follow-through instead of pressure.`,
      }),
    }
  }

  if (type === 'communication_pattern') {
    const record = content && typeof content === 'object' && !Array.isArray(content)
      ? content as Record<string, unknown>
      : null
    const pattern = record?.pattern ? String(record.pattern) : ''
    const careMove = isPt
      ? (COMMUNICATION_PATTERN_CARE_PT_BR[pattern] ?? 'escolher um ajuste pequeno e observavel que nos dois consigamos reconhecer')
      : (COMMUNICATION_PATTERN_CARE[pattern] ?? 'pick one small, observable adjustment we can both recognize')

    return {
      label: 'Discuss this pattern',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Percebi um padrao de comunicacao hoje que a gente poderia conversar: ${text}.\n\nEu me importo em fazer isso parecer mais seguro para nos dois, nao em culpar alguem.\n\nPodemos olhar para isso juntos? Um ajuste pequeno que poderiamos tentar e ${careMove}.\n\nIsso deixaria a comunicacao mais segura para voce, ou existe outro ajuste que voce preferiria?\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`
        : `I noticed a communication pattern today that we could talk about: ${text}.\n\nI care about making this feel safer for both of us, not blaming either person.\n\nCould we look at this together? One small adjustment we could try is to ${careMove}.\n\nWould that make communication feel safer for you, or is there a different adjustment you would prefer?\n\nIf now is not a good time, could we choose a smaller moment later today?`,
    }
  }

  if (type === 'sentiment_trend') {
    return {
      label: 'Send emotional check-in',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Percebi um padrao emocional entre a gente hoje: ${text}.\n\nEu me importo em entender isso em vez de exagerar a leitura ou ignorar.\n\nComo voce tem se sentido sobre a gente ultimamente?\n\nSe agora nao for um bom momento, podemos voltar nisso mais tarde?`
        : `I noticed an emotional pattern between us today: ${text}.\n\nI care about understanding it instead of overreading it or ignoring it.\n\nHow have you been feeling about us lately?\n\nIf now is not a good time, could we come back to it later?`,
    }
  }

  if (type === 'wish') {
    return {
      label: 'Honor this wish',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Percebi que este desejo importa nesta semana: ${text}.\n\nEu me importo em honrar isso de um jeito cuidadoso, nao transformado em pressao.\n\nPodemos escolher uma forma pequena e realista de honrar isso, ou pegar uma versao menor mais tarde se agora nao for um bom momento?`
        : `I noticed this wish matters this week: ${text}.\n\nI care about honoring it in a way that feels thoughtful, not turned into pressure.\n\nCould we choose one small, realistic way to honor it, or pick a smaller version later if now is not a good time?`,
    }
  }

  if (type === 'important_date') {
    return {
      label: 'Plan with care',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Percebi que esta data importa hoje: ${text}.\n\nEu me importo em proteger isso antes que fique corrido ou assumido.\n\nPodemos decidir agora como queremos cuidar desse momento, ou escolher um plano menor mais tarde se agora nao for um bom momento?`
        : `I noticed this date matters today: ${text}.\n\nI care about protecting it before it becomes rushed or assumed.\n\nCan we decide now how we want to make it feel cared for, or choose a smaller plan later if now is not a good time?`,
    }
  }

  if (type === 'love_language') {
    const record = content && typeof content === 'object' && !Array.isArray(content)
      ? content as Record<string, unknown>
      : null
    const language = record?.language ? String(record.language) : ''
    const careMove = isPt
      ? (LOVE_LANGUAGE_CARE_PT_BR[language] ?? 'escolher uma forma pequena de tornar o cuidado visivel')
      : (LOVE_LANGUAGE_CARE[language] ?? 'choose one small way to make care feel visible')

    return {
      label: 'Act on this',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Percebi este sinal de linguagem de amor nesta semana: ${text}.\n\nEu me importo em agir de um jeito que realmente chegue ate voce. Uma coisa pequena que posso fazer e: ${careMove}.\n\nIsso pareceria cuidado para voce, ou algo diferente chegaria melhor?\n\nSe agora nao for um bom momento, podemos escolher uma versao menor mais tarde?`
        : `I noticed this love-language signal this week: ${text}.\n\nI care about acting on it in a way that actually lands. One small thing I can do is: ${careMove}.\n\nWould that feel caring to you, or would something else land better?\n\nIf now is not a good time, could we choose a smaller version later?`,
    }
  }

  if (type === 'coaching_tip') {
    return {
      label: 'Talk it through',
      to: '/chat',
      storageKey: 'amore-chat-draft',
      draft: isPt
        ? `Vi esta nota de coaching hoje e quero usar isso com voce, nao apenas ler: ${text}.\n\nEu me importo em transformar isso em algo gentil e possivel para nos dois.\n\nQual e uma versao pequena que poderiamos tentar esta semana?\n\nSe agora nao for um bom momento, podemos escolher uma versao menor mais tarde?`
        : `I saw this coaching note today and I want to use it with you, not just read it: ${text}.\n\nI care about turning it into something kind and doable for both of us.\n\nWhat is one small version we could try this week?\n\nIf now is not a good time, could we choose a smaller version later?`,
    }
  }

  return null
}
