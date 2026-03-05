import { EventEmitter } from 'events'

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export type CoupleEventType = 'mood_update' | 'goal_update' | 'insight_update' | 'analysis_complete'

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
