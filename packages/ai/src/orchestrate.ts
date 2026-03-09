import { analyzeConversation } from './analyze'
import { extractEntities } from './extract'
import { generateCoachingTips } from './coach'
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
): NudgeTrigger[] {
  const nudges: NudgeTrigger[] = []

  if (previousScore != null && currentScore < previousScore - 10) {
    const drop = previousScore - currentScore
    nudges.push({
      trigger: 'score_drop',
      message: `Your relationship health dropped ${drop} points to ${currentScore}. Want to talk through what might be driving it?`,
    })
  }

  if (insights.some((insight) => insight.type === 'conflict_alert')) {
    nudges.push({
      trigger: 'conflict_alert',
      message: 'I noticed some tension in your recent conversations. Want help unpacking what happened?',
    })
  }

  if (previousScore != null && currentScore >= 80 && previousScore < 80) {
    nudges.push({
      trigger: 'milestone',
      message: `Your relationship health hit ${currentScore}. Want to capture what is working so you can keep it going?`,
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
): Promise<AnalysisOutput> {
  const [analysis, entities] = await Promise.all([
    analyzeConversation(messages, userSenderName),
    extractEntities(messages),
  ])

  const { healthScore, summary, patterns } = analysis
  const tips = await generateCoachingTips(summary, healthScore, userA, userB)

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
        message: 'Couple health is low. Consider having an open conversation about how you both are feeling.',
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
        title: 'Strengthen your communication',
        description: `Your health score is ${healthScore}/100. Try setting aside dedicated time each day to check in with each other.`,
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
