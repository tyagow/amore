import type { Locale } from '~/lib/i18n'

type SentimentDay = {
  day: string
  avg_sentiment: unknown
  msg_count: unknown
}

type MoodEntry = {
  userId: string
  mood: string
  createdAt: unknown
}

const LOW_MOODS = new Set(['low', 'struggling'])

export function getEmotionalResetSignal({
  sentimentByDay,
  moodHistory,
  userId,
  partnerName,
}: {
  sentimentByDay: SentimentDay[]
  moodHistory: MoodEntry[]
  userId: string
  partnerName?: string
}) {
  const worstSentiment = sentimentByDay
    .map((day) => ({
      day: String(day.day),
      score: Number(day.avg_sentiment),
      messageCount: Number(day.msg_count || 0),
    }))
    .filter((day) => Number.isFinite(day.score))
    .sort((a, b) => a.score - b.score)[0]
  const latestLowMood = moodHistory.find((mood) => LOW_MOODS.has(String(mood.mood).toLowerCase()))

  if (worstSentiment && worstSentiment.score < -0.2) {
    return {
      kind: 'sentiment_drop' as const,
      title: 'There was a harder emotional day in the pattern.',
      detail: `${formatDay(worstSentiment.day)} had the lowest tone across ${worstSentiment.messageCount} messages.`,
      partnerName,
    }
  }

  if (latestLowMood) {
    const owner = latestLowMood.userId === userId ? 'you' : partnerName || 'your partner'
    return {
      kind: 'low_mood' as const,
      title: 'A low mood needs a gentle follow-up.',
      detail: `${capitalize(owner)} logged ${latestLowMood.mood}.`,
      partnerName,
    }
  }

  return {
    kind: 'steady' as const,
    title: 'Your emotional pattern looks steady enough to reinforce.',
    detail: 'Use the steadier moment to name what is working before the next hard day.',
    partnerName,
  }
}

export function buildEmotionalResetDraft(signal: ReturnType<typeof getEmotionalResetSignal>, locale: Locale = 'en') {
  if (signal.kind === 'sentiment_drop') {
    if (locale === 'pt-BR') return `Quando penso em um dos nossos dias recentes de conversa, fico imaginando se ele pareceu mais pesado.\n\nQuero reparar qualquer coisa que tenha ficado com voce sem analisar demais.\n\nO que foi mais dificil para voce naquele dia?\n\nUma parte que posso assumir e: ____.\n\nO que ajudaria agora?\n\nSe agora nao for uma boa hora, podemos escolher um momento menor mais tarde hoje?`
    return `When I think about one of our recent conversation days, I wonder if it felt heavier.\n\nI care about repairing anything that stayed with you without over-analyzing it.\n\nWhat felt hardest for you that day?\n\nOne part I can own is: ____.\n\nWhat would help now?\n\nIf now is not a good time, could we choose a smaller moment later today?`
  }

  if (signal.kind === 'low_mood') {
    if (locale === 'pt-BR') return `Vi que houve um humor mais baixo ultimamente.\n\nEu me importo com como voce esta.\n\nO que tem parecido mais pesado hoje?\n\nSe alguma parte envolveu a mim, quero entender sem me defender.\n\nO apoio seria melhor como escuta, conforto, ajuda pratica ou um pouco de espaco hoje?`
    return `I saw there has been a lower mood lately.\n\nI care about how you are doing.\n\nWhat has felt heaviest today?\n\nIf any part of it involved me, I want to understand that without defending.\n\nWould support feel better as listening, comfort, practical help, or a little space today?`
  }

  if (locale === 'pt-BR') return `Gosto que as coisas parecem emocionalmente mais estaveis nesta semana.\n\nQuero perceber o que ajuda a gente a se sentir seguro antes de outro dia dificil.\n\nPodemos cada um nomear uma coisa que o outro fez recentemente e que ajudou a gente a se sentir mais seguro ou mais perto?\n\nSe agora nao for uma boa hora, podemos escolher um momento menor mais tarde?`
  return `I like that things feel emotionally steadier this week.\n\nI care about noticing what helps us feel safe before another hard day.\n\nCan we each name one thing the other did recently that helped us feel safer or closer?\n\nIf now is not a good time, could we choose a smaller moment later?`
}

export function buildEmotionalResetGoalTitle(signal: ReturnType<typeof getEmotionalResetSignal>, locale: Locale = 'en') {
  if (signal.kind === 'steady') {
    if (locale === 'pt-BR') return 'Nomear uma coisa que ajudou a gente a se sentir perto nesta semana'
    return 'Name one thing that helped us feel close this week'
  }

  if (locale === 'pt-BR') return 'Fazer um reset emocional gentil nesta semana'
  return 'Do one gentle emotional reset this week'
}

export function buildEmotionalResetGoalDraft(signal: ReturnType<typeof getEmotionalResetSignal>, locale: Locale = 'en') {
  const title = buildEmotionalResetGoalTitle(signal, locale)

  if (signal.kind === 'sentiment_drop') {
    return {
      title,
      description: locale === 'pt-BR'
        ? `${signal.detail} Tire 10 minutos para perguntar o que foi mais dificil, nomear uma coisa que voce pode assumir e escolher um reparo que ajudaria agora.`
        : `${signal.detail} Take 10 minutes to ask what felt hardest, name one thing you can own, and choose one repair that would help now.`,
    }
  }

  if (signal.kind === 'low_mood') {
    return {
      title,
      description: locale === 'pt-BR'
        ? `${signal.detail} Pergunte o que pareceu mais pesado, escute qualquer parte que voce pode assumir sem se defender e depois faca a forma de apoio que a pessoa escolher.`
        : `${signal.detail} Ask what felt heaviest, listen for any part you can own without defending, then do the support version they choose.`,
    }
  }

  return {
    title,
    description: locale === 'pt-BR'
      ? 'Use o momento mais estavel para nomear uma coisa que funcionou, agradecer um ao outro por isso e decidir como repetir a menor versao nesta semana.'
      : 'Use the steadier moment to name one thing that worked, thank each other for it, and decide how to repeat the smallest version this week.',
  }
}

function formatDay(day: string) {
  const dateOnly = day.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    const [, year, month, date] = dateOnly
    return new Date(Number(year), Number(month) - 1, Number(date)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const date = new Date(day)

  if (Number.isNaN(date.getTime())) {
    return day
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function capitalize(value: string) {
  if (!value) return value
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}
