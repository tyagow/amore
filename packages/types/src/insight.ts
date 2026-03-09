export type InsightType =
  | 'health_score'
  | 'communication_pattern'
  | 'love_language'
  | 'coaching_tip'
  | 'conflict_alert'
  | 'goal_suggestion'
  | 'sentiment_trend'
  | 'conversation_highlight'
  | 'conflict_pattern'
  | 'shared_interest'
  | 'wish'
  | 'important_date'

export interface Insight {
  id: string
  coupleId: string
  type: InsightType
  content: Record<string, unknown>
  severity: string | null
  generatedAt: Date
}
