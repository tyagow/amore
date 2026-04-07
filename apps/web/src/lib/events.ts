import { EventEmitter } from 'events'

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export type CoupleEventType = 'mood_update' | 'goal_update' | 'insight_update' | 'analysis_complete' | 'checkin_update'

export interface CoupleEvent {
  type: CoupleEventType
  data: Record<string, unknown>
}

export function emitCoupleEvent(coupleId: string, event: CoupleEvent) {
  emitter.emit(`couple:${coupleId}`, event)
}

export function subscribeCoupleEvents(
  coupleId: string,
  callback: (event: CoupleEvent) => void,
): () => void {
  const handler = (event: CoupleEvent) => callback(event)
  emitter.on(`couple:${coupleId}`, handler)
  return () => emitter.off(`couple:${coupleId}`, handler)
}

// ── User-scoped events (for pre-couple notifications) ────

export type UserEventType = 'connection_request_received' | 'connection_request_accepted'

export interface UserEvent {
  type: UserEventType
  data: Record<string, unknown>
}

export function emitUserEvent(userId: string, event: UserEvent) {
  emitter.emit(`user:${userId}`, event)
}

export function subscribeUserEvents(
  userId: string,
  callback: (event: UserEvent) => void,
): () => void {
  const handler = (event: UserEvent) => callback(event)
  emitter.on(`user:${userId}`, handler)
  return () => emitter.off(`user:${userId}`, handler)
}
