export interface ChatMessage {
  id: string
  sender: string
  text: string | null
  timestamp: string | Date
  fromMe: boolean
  isMedia?: boolean
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker' | null
  waMessageId?: string
  thumbnail?: string | null
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'queued'
  clientId?: string
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'logged-out'
  | 'session-expired'
