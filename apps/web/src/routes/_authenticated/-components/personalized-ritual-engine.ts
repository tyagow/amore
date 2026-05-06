import type { Locale } from '~/lib/i18n'

export type RitualMood = 'great' | 'good' | 'neutral' | 'low' | 'struggling'

export type RitualCheckinDay = {
  bothCheckedIn: boolean
  mineMood: RitualMood | string | null
  partnerMood: RitualMood | string | null
}

export type RitualSignals = {
  dateKey: string
  healthScore: number | null
  messagesSinceAnalysis: number | null
  hasActiveGoals: boolean
  partnerMoodSet: boolean
  myMood: RitualMood | string | null
  partnerMood: RitualMood | string | null
  partnerInterests: string[] | null | undefined
  recentCheckins: RitualCheckinDay[]
}

export type RitualHistoryEntry = {
  id: string
  dateKey: string
}

export type PersonalizedRitual = {
  id: string
  title: string
  body: string
  reason: string
  actionLabel: string
  cooldownDays: number
  coachPrompt: (partnerName: string) => string
  chatDraft: (partnerName: string, locale: Locale) => string
  weeklyReportLine: (partnerName: string) => string
}

const RITUALS: PersonalizedRitual[] = [
  {
    id: 'repair-window',
    title: '10-minute repair window',
    body: 'Start with one appreciation, own one part, and ask what would help the repair land.',
    reason: 'Your latest pattern suggests repair matters more than adding a new habit.',
    actionLabel: 'Draft repair',
    cooldownDays: 4,
    coachPrompt: (partnerName) =>
      `Coach me through a 10-minute repair with ${partnerName}. Keep it calm, specific, and blame-free.`,
    chatDraft: (partnerName, locale) =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, quero reparar uma coisa pequena antes que fique maior.\n\nUma coisa que aprecio em voce e ____.\n\nUma parte que posso assumir e ____.\n\nPodemos tirar 10 minutos para eu entender o que ficou pesado e o que ajudaria agora?`
        : `Hey ${partnerName}, I want to repair one small thing before it gets bigger.\n\nOne thing I appreciate about you is ____.\n\nOne part I can own is ____.\n\nCould we take 10 minutes so I can understand what felt heavy and what would help now?`,
    weeklyReportLine: (partnerName) =>
      `Practice one short repair with ${partnerName}: appreciation first, one owned part, then one question about what would help.`,
  },
  {
    id: 'same-question-checkin',
    title: 'Same-question check-in',
    body: 'Both answer one gentle question, then compare only after both of you have answered.',
    reason: 'The current signal is to make emotional tracking mutual, not one-sided.',
    actionLabel: 'Draft check-in',
    cooldownDays: 3,
    coachPrompt: (partnerName) =>
      `Help me invite ${partnerName} into one same-question check-in without pressure.`,
    chatDraft: (partnerName, locale) =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, podemos responder a mesma pergunta hoje?\n\nPergunta: o que ajudaria voce a se sentir um pouco mais apoiado(a) esta noite?\n\nEu respondo tambem, e a gente so compara depois que os dois tiverem respondido.`
        : `Hey ${partnerName}, could we answer the same question today?\n\nQuestion: what would help you feel a little more supported tonight?\n\nI will answer too, and we only compare after both of us have answered.`,
    weeklyReportLine: (partnerName) =>
      `Use one same-question check-in with ${partnerName} and compare only after both answers exist.`,
  },
  {
    id: 'specific-appreciation',
    title: 'Specific appreciation',
    body: 'Name one thing you noticed, what it showed you about your partner, and how it affected you.',
    reason: 'Things look stable enough to reinforce what is already working.',
    actionLabel: 'Draft appreciation',
    cooldownDays: 2,
    coachPrompt: (partnerName) =>
      `Help me write one specific appreciation for ${partnerName} that does not sound generic.`,
    chatDraft: (partnerName, locale) =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, uma coisa especifica que notei e apreciei hoje foi ____.\n\nIsso me mostrou ____ sobre voce, e me fez sentir ____.`
        : `Hey ${partnerName}, one specific thing I noticed and appreciated today was ____.\n\nIt showed me ____ about you, and it made me feel ____.`,
    weeklyReportLine: (partnerName) =>
      `Send ${partnerName} one specific appreciation that names what you noticed and why it mattered.`,
  },
  {
    id: 'close-the-loop',
    title: 'Close the loop',
    body: 'Pick one existing promise or goal and send a simple follow-through update.',
    reason: 'An active goal is already in motion, so the useful ritual is follow-through.',
    actionLabel: 'Draft follow-through',
    cooldownDays: 3,
    coachPrompt: (partnerName) =>
      `Help me close the loop with ${partnerName} on one promise without overexplaining.`,
    chatDraft: (partnerName, locale) =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, quero fechar o ciclo sobre uma coisa que combinamos.\n\nO que eu fiz: ____.\n\nO que ainda falta: ____.\n\nA proxima versao pequena que consigo manter e ____.`
        : `Hey ${partnerName}, I want to close the loop on one thing we agreed to.\n\nWhat I did: ____.\n\nWhat is still left: ____.\n\nThe next small version I can keep is ____.`,
    weeklyReportLine: (partnerName) =>
      `Close the loop with ${partnerName} on one existing goal before adding another practice.`,
  },
  {
    id: 'phone-free-pocket',
    title: '20-minute phone-free pocket',
    body: 'Create one short protected pocket for a question, an appreciation, and no multitasking.',
    reason: 'The useful move is a lightweight shared moment, not a larger relationship project.',
    actionLabel: 'Draft invite',
    cooldownDays: 5,
    coachPrompt: (partnerName) =>
      `Help me invite ${partnerName} into a 20-minute phone-free pocket that feels light.`,
    chatDraft: (partnerName, locale) =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, topa proteger 20 minutos sem celular esta semana?\n\nNada pesado: uma pergunta, uma apreciacao e um tempo curto em que a gente nao faz multitarefa.`
        : `Hey ${partnerName}, would you be up for protecting 20 phone-free minutes this week?\n\nNothing heavy: one question, one appreciation, and a short pocket where we do not multitask.`,
    weeklyReportLine: (partnerName) =>
      `Try one 20-minute phone-free pocket with ${partnerName}: one question, one appreciation, no multitasking.`,
  },
]

function dayNumber(dateKey: string): number {
  const time = Date.parse(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(time)) return 0
  return Math.floor(time / 86_400_000)
}

function recentHistoryIds(history: RitualHistoryEntry[], dateKey: string, cooldownDays: number): Set<string> {
  const today = dayNumber(dateKey)
  return new Set(
    history
      .filter((entry) => {
        const age = today - dayNumber(entry.dateKey)
        return age >= 0 && age < cooldownDays
      })
      .map((entry) => entry.id),
  )
}

function scoreRitual(ritual: PersonalizedRitual, signals: RitualSignals): number {
  const score = signals.healthScore ?? 76
  const togetherDays = signals.recentCheckins.filter((day) => day.bothCheckedIn).length
  const hasLowMood = [signals.myMood, signals.partnerMood].some((mood) =>
    mood === 'low' || mood === 'struggling',
  )

  if (ritual.id === 'repair-window') {
    return score < 70 || hasLowMood ? 100 : 20
  }

  if (ritual.id === 'same-question-checkin') {
    if (!signals.partnerMoodSet) return 95
    return togetherDays < 3 ? 88 : 45
  }

  if (ritual.id === 'close-the-loop') {
    return signals.hasActiveGoals ? 86 : 35
  }

  if (ritual.id === 'phone-free-pocket') {
    return (signals.partnerInterests?.length ?? 0) > 0 || score >= 75 ? 76 : 42
  }

  return score >= 72 ? 80 : 48
}

export function selectPersonalizedRitual(
  signals: RitualSignals,
  history: RitualHistoryEntry[] = [],
): PersonalizedRitual {
  const ranked = RITUALS
    .map((ritual) => ({ ritual, score: scoreRitual(ritual, signals) }))
    .sort((a, b) => b.score - a.score || a.ritual.id.localeCompare(b.ritual.id))

  const cooldownIds = recentHistoryIds(history, signals.dateKey, Math.max(...RITUALS.map((ritual) => ritual.cooldownDays)))
  return ranked.find(({ ritual }) => !cooldownIds.has(ritual.id))?.ritual ?? ranked[0].ritual
}

export function canRevealRitualComparison(checkin: {
  checkin: { answer?: string | null } | null
  partnerCheckin: { answer?: string | null } | null
}): boolean {
  return Boolean(checkin.checkin?.answer?.trim() && checkin.partnerCheckin?.answer?.trim())
}

export function getRitualLibraryForTests(): PersonalizedRitual[] {
  return RITUALS
}
