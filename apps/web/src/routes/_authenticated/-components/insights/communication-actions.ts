import type { Locale } from '~/lib/i18n'

type SenderStat = {
  sender_id: string | null
  msg_count: unknown
}

type HourlyActivity = {
  dow: unknown
  hour: unknown
  count: unknown
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getConversationBalance(senderStats: SenderStat[], userId: string) {
  const myStats = senderStats.find((stat) => stat.sender_id === userId)
  const partnerStats = senderStats.find((stat) => stat.sender_id !== userId)
  const myCount = Number(myStats?.msg_count || 0)
  const partnerCount = Number(partnerStats?.msg_count || 0)
  const total = myCount + partnerCount

  if (total <= 0) {
    return {
      myCount,
      partnerCount,
      myPercent: 0,
      partnerPercent: 0,
      direction: 'balanced' as const,
    }
  }

  const myPercent = Math.round((myCount / total) * 100)
  const partnerPercent = 100 - myPercent
  const direction =
    Math.abs(myPercent - 50) <= 10
      ? 'balanced'
      : myPercent > 50
        ? 'user_leads'
        : 'partner_leads'

  return { myCount, partnerCount, myPercent, partnerPercent, direction }
}

export function getBestConversationWindow(hourlyActivity: HourlyActivity[]) {
  const best = hourlyActivity
    .map((entry) => ({
      dow: Number(entry.dow),
      hour: Number(entry.hour),
      count: Number(entry.count),
    }))
    .filter((entry) => entry.dow >= 0 && entry.dow <= 6 && entry.hour >= 0 && entry.hour <= 23)
    .sort((a, b) => b.count - a.count)[0]

  if (!best || best.count <= 0) {
    return null
  }

  const hourLabel = new Date(2026, 0, 1, best.hour).toLocaleTimeString('en-US', {
    hour: 'numeric',
  })

  return {
    dayName: DAY_NAMES[best.dow],
    hourLabel,
    label: `${DAY_NAMES[best.dow]} around ${hourLabel}`,
  }
}

export function buildBalanceChatDraft({
  direction,
  partnerName,
}: {
  direction: ReturnType<typeof getConversationBalance>['direction']
  partnerName?: string
}, locale: Locale = 'en') {
  if (direction === 'user_leads') {
    if (locale === 'pt-BR') return `Percebi que talvez eu esteja carregando mais a conversa ultimamente.\n\nQuero abrir mais espaco para o seu lado, nao so preencher o silencio com o meu.\n\nUma parte que posso assumir e: as vezes respondo antes de realmente fazer uma pergunta de continuidade.\n\nQual e uma coisa recente sobre a qual voce gostaria que eu perguntasse mais?\n\nSe agora nao for uma boa hora, podemos escolher um check-in menor mais tarde hoje?`
    return `I noticed I may be carrying more of the conversation lately.\n\nI care about making more room for your side, not just filling the space with mine.\n\nOne part I can own is: I sometimes respond before I have really asked a follow-up.\n\nWhat is one recent thing you wish I asked about more often?\n\nIf now is not a good time, could we choose a smaller check-in later today?`
  }

  if (direction === 'partner_leads') {
    if (locale === 'pt-BR') return `Percebi que ${partnerName || 'voce'} talvez esteja carregando mais a conversa ultimamente.\n\nQuero aparecer de forma mais ativa em vez de deixar voce fazer a maior parte do acompanhamento emocional.\n\nUma parte que posso assumir e: as vezes respondo sem fazer a proxima pergunta.\n\nTem uma coisa recente sobre a qual voce queria que eu perguntasse ou acompanhasse?\n\nSe agora nao for uma boa hora, podemos escolher um check-in menor mais tarde hoje?`
    return `I noticed ${partnerName || 'you'} may be carrying more of the conversation lately.\n\nI care about showing up more actively instead of letting you do most of the emotional tracking.\n\nOne part I can own is: I sometimes answer without asking the next question.\n\nIs there one recent thing you have been wanting me to ask about or follow up on?\n\nIf now is not a good time, could we choose a smaller check-in later today?`
  }

  if (locale === 'pt-BR') return `Gosto que nosso ritmo de conversa parece bem equilibrado agora.\n\nQuero proteger esse equilibrio antes que qualquer um de nos comece a se sentir sozinho com o acompanhamento.\n\nPodemos escolher uma pergunta de check-in para esta semana, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
  return `I like that our conversation rhythm looks pretty balanced right now.\n\nI care about protecting that balance before either of us starts feeling alone with the tracking.\n\nCould we choose one check-in question for this week, or pick a smaller version later if now is not a good time?`
}

export function buildConversationGoalTitle(windowLabel: string | null, locale: Locale = 'en') {
  if (!windowLabel) {
    if (locale === 'pt-BR') return 'Ter uma conversa intencional nesta semana'
    return 'Have one intentional conversation this week'
  }

  if (locale === 'pt-BR') return `Ter uma conversa intencional em ${windowLabel}`
  return `Have one intentional conversation ${windowLabel}`
}

export function buildConversationGoalDraft({
  windowLabel,
  direction,
}: {
  windowLabel: string | null
  direction: ReturnType<typeof getConversationBalance>['direction']
}, locale: Locale = 'en') {
  const title = buildConversationGoalTitle(windowLabel, locale)
  if (locale === 'pt-BR') {
    const timing = windowLabel
      ? `Use ${windowLabel} porque ja e uma janela forte de conversa.`
      : 'Escolha uma janela calma de 15 minutos que seja facil de cumprir.'
    const balancePractice =
      direction === 'user_leads'
        ? 'Abra mais espaco fazendo uma pergunta e esperando antes de acrescentar mais.'
        : direction === 'partner_leads'
          ? 'Apareca ativamente fazendo uma pergunta de continuidade e nomeando uma coisa que ouviu.'
          : 'Proteja o equilibrio respondendo a mesma pergunta de check-in.'
    return {
      title,
      description: `${timing} ${balancePractice} Mantenha pequeno o bastante para parecer conexao, nao tarefa.`,
    }
  }
  const timing = windowLabel
    ? `Use ${windowLabel} because it is already a strong conversation window.`
    : 'Choose one calm 15-minute window that is easy to keep.'
  const balancePractice =
    direction === 'user_leads'
      ? 'Make extra room by asking one question and waiting before adding more.'
      : direction === 'partner_leads'
        ? 'Show up actively by asking one follow-up and naming one thing you heard.'
        : 'Protect the balance by each answering the same check-in question.'

  return {
    title,
    description: `${timing} ${balancePractice} Keep it small enough that it feels like connection, not homework.`,
  }
}
