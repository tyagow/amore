export type GoalSource = 'user' | 'ai_suggested'
export type GoalStatus = 'active' | 'completed' | 'dismissed'

export interface CoupleGoal {
  id: string
  coupleId: string
  title: string
  description: string | null
  source: GoalSource
  status: GoalStatus
  suggestedBy: string | null
  dueDate: Date | null
  createdAt: Date
}
