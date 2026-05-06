import { analyzeConversation } from './analyze'
import { extractEntities } from './extract'
import { generateCoachingTips } from './coach'
import { localized, type AILocale } from './locale'
import type { Message, InsightType, User } from '@amore-couples/types'

export interface InsightRow {
  coupleId: string
  type: InsightType
  content: unknown
  severity: string | null
}

export interface AnalysisOutput {
  healthScore: number
  summary: string
  insightRows: InsightRow[]
  sentiments: Array<{ index: number; score: number }> | undefined
  profileData: {
    loveLanguages: Array<{ language: string; confidence: number }>
    interests: string[]
    wishlist: Array<{ text: string; date: string; speaker: string }>
    importantDates: Array<{ description: string; date: string }>
    communicationStyle: Record<string, Record<string, number>>
  }
}

export interface NudgeTrigger {
  trigger: 'score_drop' | 'conflict_alert' | 'goal_deadline' | 'milestone'
  message: string
}

export function detectNudgeTriggers(
  currentScore: number,
  previousScore: number | null,
  insights: Array<{ type: string }>,
  locale: AILocale = 'en',
): NudgeTrigger[] {
  const nudges: NudgeTrigger[] = []

  if (previousScore != null && currentScore < previousScore - 10) {
    const drop = previousScore - currentScore
    nudges.push({
      trigger: 'score_drop',
      message: localized(
        locale,
        `Your relationship health dropped ${drop} points to ${currentScore}. Want to talk through what might be driving it?`,
        `A saude do relacionamento caiu ${drop} pontos para ${currentScore}. Quer conversar sobre o que pode estar causando isso?`,
      ),
    })
  }

  if (insights.some((insight) => insight.type === 'conflict_alert')) {
    nudges.push({
      trigger: 'conflict_alert',
      message: localized(
        locale,
        'I noticed some tension in your recent conversations. Want help unpacking what happened?',
        'Percebi alguma tensao nas conversas recentes. Quer ajuda para entender o que aconteceu?',
      ),
    })
  }

  if (previousScore != null && currentScore >= 80 && previousScore < 80) {
    nudges.push({
      trigger: 'milestone',
      message: localized(
        locale,
        `Your relationship health hit ${currentScore}. Want to capture what is working so you can keep it going?`,
        `A saude do relacionamento chegou a ${currentScore}. Quer registrar o que esta funcionando para manter esse ritmo?`,
      ),
    })
  }

  return nudges
}

export async function runAnalysisPipeline(
  messages: Message[],
  coupleId: string,
  userSenderName = 'You',
  userA?: Pick<User, 'name'> | null,
  userB?: Pick<User, 'name'> | null,
  locale: AILocale = 'en',
): Promise<AnalysisOutput> {
  const [analysis, entities] = await Promise.all([
    analyzeConversation(messages, userSenderName, locale),
    extractEntities(messages, locale),
  ])

  const { healthScore, summary, patterns } = analysis
  const tips = await generateCoachingTips(summary, healthScore, userA, userB, locale)

  const insightRows: InsightRow[] = []

  insightRows.push({
    coupleId,
    type: 'health_score',
    content: { score: healthScore, summary },
    severity: null,
  })

  for (const [name, value] of Object.entries(patterns)) {
    insightRows.push({
      coupleId,
      type: 'communication_pattern',
      content: { pattern: name, value },
      severity: null,
    })
  }

  for (const lang of entities.loveLanguages) {
    insightRows.push({ coupleId, type: 'love_language', content: lang, severity: null })
  }

  for (const tip of tips) {
    insightRows.push({ coupleId, type: 'coaching_tip', content: tip, severity: null })
  }

  if (healthScore < 40) {
    insightRows.push({
      coupleId,
      type: 'conflict_alert',
      content: {
        score: healthScore,
        message: localized(
          locale,
          'Couple health is low. Consider having an open conversation about how you both are feeling.',
          'A saude do relacionamento esta baixa. Considerem ter uma conversa aberta sobre como voces dois estao se sentindo.',
        ),
      },
      severity: 'warning',
    })
  }

  // Suggest a goal when health is moderate
  if (healthScore >= 40 && healthScore < 70) {
    insightRows.push({
      coupleId,
      type: 'goal_suggestion',
      content: {
        title: localized(locale, 'Strengthen your communication', 'Fortalecer a comunicacao'),
        description: localized(
          locale,
          `Your health score is ${healthScore}/100. Try setting aside dedicated time each day to check in with each other.`,
          `A pontuacao de saude esta em ${healthScore}/100. Tentem separar um momento dedicado por dia para se checarem.`,
        ),
      },
      severity: null,
    })
  }

  return {
    healthScore,
    summary,
    insightRows,
    sentiments: analysis.sentiments,
    profileData: {
      loveLanguages: entities.loveLanguages,
      interests: entities.interests,
      wishlist: entities.wishes,
      importantDates: entities.importantDates,
      communicationStyle: patterns,
    },
  }
}
