export type MoodLevel = 'great' | 'good' | 'neutral' | 'low' | 'struggling'
export type MoodSource = 'manual' | 'ai_detected'
export type MoodVisibility = 'silent' | 'visible' | 'alert'

export interface MoodState {
  id: string
  coupleId: string
  userId: string
  mood: MoodLevel
  source: MoodSource
  visibility: MoodVisibility
  note: string | null
  createdAt: Date
  expiresAt: Date | null
}
