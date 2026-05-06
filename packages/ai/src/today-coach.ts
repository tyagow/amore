export type TodayCoachConfidence = 'high' | 'medium' | 'low'

export interface TodayCoachInsightInput {
  type: string
  severity: string | null
  content: Record<string, unknown>
}

export interface TodayCoachGoalInput {
  title?: string | null
  status?: string | null
}

export interface TodayCoachMoodInput {
  mood?: string | null
  note?: string | null
}

export interface TodayCoachCheckinInput {
  checkedIn: boolean
  partnerCheckedIn: boolean
  question: string
  streak?: number
}

export interface TodayCoachMessageStatsInput {
  totalMessages: number
  dailyAverage: number
  last7Days: number[]
}

export interface TodayCoachInput {
  healthScore: number | null
  whatsappConnected: boolean
  messageStats: TodayCoachMessageStatsInput | null
  recentInsights: TodayCoachInsightInput[]
  activeGoals: TodayCoachGoalInput[]
  myMood: TodayCoachMoodInput | null
  partnerMood: TodayCoachMoodInput | null
  dailyCheckin: TodayCoachCheckinInput | null
}

export interface TodayCoachBrief {
  priority: string
  action: string
  pattern: string
  coachPrompt: string
  source: string
  confidence: TodayCoachConfidence
}

const SUPPORT_MOODS = new Set(['low', 'struggling'])

function textFromInsight(insight: TodayCoachInsightInput): string {
  const content = insight.content
  const candidates = [
    content.title,
    content.summary,
    content.pattern,
    content.description,
    content.message,
    content.tip,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return insight.type.replaceAll('_', ' ')
}

function hasRecentMessages(input: TodayCoachInput): boolean {
  return (input.messageStats?.totalMessages ?? 0) >= 20
}

function formatScore(score: number | null): string {
  return score == null ? 'not scored yet' : `${score}/100`
}

export function buildTodayCoachBrief(input: TodayCoachInput): TodayCoachBrief {
  const importantInsight =
    input.recentInsights.find((insight) => insight.severity === 'high') ??
    input.recentInsights[0] ??
    null

  if (!input.whatsappConnected && !hasRecentMessages(input)) {
    return {
      priority: 'Get one real signal into Amore',
      action: 'Upload a WhatsApp export or connect WhatsApp before asking the coach for a relationship read.',
      pattern: 'There is not enough conversation data yet, so today should focus on first value instead of generic advice.',
      coachPrompt: 'Help me get my first useful relationship insight from a WhatsApp export. What should I look for before inviting my partner?',
      source: 'Solo setup',
      confidence: 'low',
    }
  }

  if (input.dailyCheckin && !input.dailyCheckin.checkedIn) {
    return {
      priority: 'Name today before reacting to it',
      action: `Do the daily check-in: "${input.dailyCheckin.question}"`,
      pattern: input.dailyCheckin.partnerCheckedIn
        ? 'Your partner has already checked in, so your answer can make today easier to compare.'
        : 'The day has not been anchored yet; a check-in gives the coach a fresher signal than message history alone.',
      coachPrompt: `Help me answer today's check-in in a way that is honest and useful: "${input.dailyCheckin.question}"`,
      source: 'Daily check-in',
      confidence: hasRecentMessages(input) ? 'medium' : 'low',
    }
  }

  if (input.partnerMood?.mood && SUPPORT_MOODS.has(input.partnerMood.mood)) {
    const note = input.partnerMood.note ? ` They wrote: "${input.partnerMood.note}".` : ''
    return {
      priority: 'Support your partner gently',
      action: 'Send one low-pressure message that acknowledges them without trying to fix everything.',
      pattern: `Your partner recently checked in as ${input.partnerMood.mood}.${note}`,
      coachPrompt: 'Help me write a short supportive message that does not pressure my partner or make this about me.',
      source: 'Partner mood',
      confidence: 'high',
    }
  }

  if (importantInsight) {
    const insightText = textFromInsight(importantInsight)
    return {
      priority: 'Act on the strongest recent pattern',
      action: 'Pick one small behavior you can change today and keep it visible for the next conversation.',
      pattern: insightText,
      coachPrompt: `Help me turn this relationship pattern into one small action today: ${insightText}`,
      source: 'Recent insight',
      confidence: hasRecentMessages(input) ? 'high' : 'medium',
    }
  }

  const firstGoal = input.activeGoals.find((goal) => goal.title)
  if (firstGoal?.title) {
    return {
      priority: 'Make progress on one shared goal',
      action: `Take a two-minute step toward "${firstGoal.title}" today.`,
      pattern: `Your active goal is still open, and small visible progress matters more than adding another discussion.`,
      coachPrompt: `Help me take one realistic step today on this shared goal: ${firstGoal.title}`,
      source: 'Shared goal',
      confidence: 'medium',
    }
  }

  if (input.healthScore != null) {
    const lowScore = input.healthScore < 60
    return {
      priority: lowScore ? 'Lower the temperature today' : 'Protect what is working',
      action: lowScore
        ? 'Start one conversation with curiosity instead of correction.'
        : 'Name one thing you appreciated recently and keep it specific.',
      pattern: `Your current relationship health score is ${formatScore(input.healthScore)}; use it as a directional signal, not a diagnosis.`,
      coachPrompt: `My relationship health score is ${formatScore(input.healthScore)}. Help me choose one useful action for today without overreading the score.`,
      source: 'Relationship score',
      confidence: hasRecentMessages(input) ? 'medium' : 'low',
    }
  }

  return {
    priority: 'Create a fresh signal today',
    action: 'Do one check-in or upload a recent WhatsApp export so coaching can use real context.',
    pattern: 'Amore has some setup context, but not enough recent relationship data for a confident daily read.',
    coachPrompt: 'Help me choose the best first step today with limited relationship data in Amore.',
    source: 'Fallback',
    confidence: 'low',
  }
}
