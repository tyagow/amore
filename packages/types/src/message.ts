export interface Message {
  id: string
  coupleId: string
  waMessageId: string | null
  senderId: string
  text: string | null
  timestamp: Date
  sentiment: number | null
  isMedia: boolean
  source: 'baileys'
  createdAt: Date
}
