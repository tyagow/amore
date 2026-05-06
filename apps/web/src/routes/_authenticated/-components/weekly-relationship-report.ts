import type { PersonalizedRitual } from './personalized-ritual-engine'
import type { Locale } from '~/lib/i18n'

export type WeeklyReportInput = {
  dateKey: string
  partnerName: string
  healthScore: number | null
  messagesSinceAnalysis: number | null
  messageStats: {
    totalMessages: number
    dailyAverage: number
    last7Days: number[]
  } | null
  activeGoalCount: number
  recentCheckins: Array<{
    bothCheckedIn: boolean
    mineMood: string | null
    partnerMood: string | null
  }>
  ritual: PersonalizedRitual
  locale?: Locale
}

export type WeeklyRelationshipReport = {
  id: string
  weekKey: string
  generatedAt: string
  headline: string
  confidence: 'thin' | 'partial' | 'strong'
  scoreLine: string
  sharedSummary: string
  whatWorked: string
  watchPoint: string
  nextStep: string
  privateCoachPrompt: string
}

export function getWeekKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return dateKey
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

function confidenceFor(input: WeeklyReportInput): WeeklyRelationshipReport['confidence'] {
  const totalMessages = input.messageStats?.totalMessages ?? 0
  const checkinCount = input.recentCheckins.filter((day) => day.bothCheckedIn).length
  if (totalMessages >= 50 || checkinCount >= 4) return 'strong'
  if (totalMessages >= 5 || checkinCount >= 2 || input.healthScore !== null) return 'partial'
  return 'thin'
}

function scoreLineFor(input: WeeklyReportInput): string {
  const locale = input.locale ?? 'en'
  if (input.healthScore === null) {
    return locale === 'pt-BR'
      ? 'Ainda nao ha uma pontuacao precisa. O relatorio usa check-ins, metas e a atividade de mensagens disponivel.'
      : 'No precise score yet. The report is using check-ins, goals, and available message activity.'
  }

  if (input.healthScore < 70) {
    return locale === 'pt-BR'
      ? `A pontuacao mais recente esta aproximadamente na faixa de reparo (${input.healthScore}/100), entao trate como um sinal direcional, nao como veredito.`
      : `The latest score is roughly in the repair range (${input.healthScore}/100), so treat it as a directional signal, not a verdict.`
  }

  if (input.healthScore >= 85) {
    return locale === 'pt-BR'
      ? `A pontuacao mais recente esta aproximadamente em uma faixa forte (${input.healthScore}/100), mas a pergunta util e o que repetir.`
      : `The latest score is roughly in a strong range (${input.healthScore}/100), but the useful question is what to repeat.`
  }

  return locale === 'pt-BR'
    ? `A pontuacao mais recente esta aproximadamente estavel (${input.healthScore}/100). Use como convite para um pequeno ajuste, nao como nota.`
    : `The latest score is roughly stable (${input.healthScore}/100). Use it as a prompt for one small adjustment, not a grade.`
}

export function buildWeeklyRelationshipReport(input: WeeklyReportInput): WeeklyRelationshipReport {
  const locale = input.locale ?? 'en'
  const weekKey = getWeekKey(input.dateKey)
  const confidence = confidenceFor(input)
  const togetherCheckins = input.recentCheckins.filter((day) => day.bothCheckedIn).length
  const activeGoals = input.activeGoalCount
  const newMessages = input.messagesSinceAnalysis ?? 0
  const hasThinData = confidence === 'thin'

  const headline = locale === 'pt-BR'
    ? hasThinData
      ? 'Um reset semanal leve ja basta nesta semana'
      : input.healthScore !== null && input.healthScore < 70
        ? 'Reparo e clareza devem guiar esta semana'
        : 'Repitam uma coisa pequena que ja esta ajudando'
    : hasThinData
      ? 'A lightweight weekly reset is enough this week'
      : input.healthScore !== null && input.healthScore < 70
        ? 'Repair and clarity should lead this week'
        : 'Repeat one small thing that is already helping'

  const whatWorked = locale === 'pt-BR'
    ? togetherCheckins > 0
      ? `Voces dois fizeram check-in em ${togetherCheckins} dos ultimos 7 dias. Isso ja e sinal suficiente para manter o ritual mutuo.`
      : activeGoals > 0
        ? `Voces tem ${activeGoals} ${activeGoals === 1 ? 'meta ativa' : 'metas ativas'} de relacionamento, entao cumprir importa mais do que adicionar complexidade.`
        : 'O ganho util desta semana e manter uma pratica pequena o bastante para realmente repetir.'
    : togetherCheckins > 0
      ? `You both checked in on ${togetherCheckins} of the last 7 days. That is enough signal to keep the ritual mutual.`
      : activeGoals > 0
        ? `You have ${activeGoals} active relationship ${activeGoals === 1 ? 'goal' : 'goals'}, so follow-through matters more than adding complexity.`
        : 'The useful win this week is keeping one practice small enough to actually repeat.'

  const watchPoint = locale === 'pt-BR'
    ? newMessages >= 20
      ? `${newMessages} mensagens mais novas ainda nao foram analisadas, entao evite ler pontuacoes antigas demais.`
      : input.healthScore !== null && input.healthScore < 70
        ? 'Nao transforme o relatorio em mediacao. Use para escolher uma conversa de reparo mais calma.'
        : 'Nao transforme o relatorio em placar. Use para facilitar uma proxima acao.'
    : newMessages >= 20
      ? `${newMessages} newer messages have not been analyzed yet, so avoid over-reading old scores.`
      : input.healthScore !== null && input.healthScore < 70
        ? 'Do not turn the report into mediation. Use it to choose one calmer repair conversation.'
        : 'Do not turn the report into a scorecard. Use it to make one next action easier.'

  const nextStep = input.ritual.weeklyReportLine(input.partnerName, locale)
  const scoreLine = scoreLineFor(input)
  const nextSmallPracticeLabel = locale === 'pt-BR' ? 'Proxima pratica pequena' : 'Next small practice'

  return {
    id: `${weekKey}-${input.ritual.id}`,
    weekKey,
    generatedAt: new Date(`${input.dateKey}T12:00:00.000Z`).toISOString(),
    headline,
    confidence,
    scoreLine,
    sharedSummary: [
      headline,
      scoreLine,
      whatWorked,
      `${nextSmallPracticeLabel}: ${nextStep}`,
    ].join('\n\n'),
    whatWorked,
    watchPoint,
    nextStep,
    privateCoachPrompt: locale === 'pt-BR'
      ? `Me ajude a refletir em privado sobre este relatorio semanal antes de compartilhar qualquer coisa com ${input.partnerName}. Mantenha importacao privada ou detalhes do orientador fora de qualquer conteudo visivel para a parceria, a menos que eu escolha compartilhar explicitamente.\n\nTitulo do relatorio: ${headline}\n\nO que funcionou: ${whatWorked}\n\nPonto de atencao: ${watchPoint}\n\nProximo passo: ${nextStep}`
      : `Help me reflect privately on this weekly report before I share anything with ${input.partnerName}. Keep private import or coach details out of anything partner-visible unless I explicitly choose to share them.\n\nReport headline: ${headline}\n\nWhat worked: ${whatWorked}\n\nWatch point: ${watchPoint}\n\nNext step: ${nextStep}`,
  }
}
