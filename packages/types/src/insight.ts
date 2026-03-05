export type InsightType =
  | 'health_score'
  | 'communication_pattern'
  | 'love_language'
  | 'coaching_tip'
  | 'conflict_alert'
  | 'goal_suggestion'

export interface Insight {
  id: string
  coupleId: string
  type: InsightType
  content: Record<string, unknown>
  severity: string | null
  generatedAt: Date
}
