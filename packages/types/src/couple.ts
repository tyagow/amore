export type CoupleStatus = 'pending' | 'active' | 'paused'

export interface Couple {
  id: string
  status: CoupleStatus
  userAId: string
  userBId: string
  whatsappJid: string | null
  healthScore: number | null
  lastAnalyzed: Date | null
  messagesSinceAnalysis: number
  createdAt: Date
}
