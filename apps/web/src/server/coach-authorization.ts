export type CoachThreadVisibility = 'private' | 'shared'

export interface CoachThreadAccessRow {
  coupleId: string | null
  userId: string | null
}

export interface CoachThreadAccessContext {
  userId: string
  coupleId: string | null
}

export function getCoachThreadVisibility(
  thread: CoachThreadAccessRow,
): CoachThreadVisibility {
  return thread.coupleId && !thread.userId ? 'shared' : 'private'
}

export function canAccessCoachThread(
  thread: CoachThreadAccessRow | null | undefined,
  context: CoachThreadAccessContext,
): boolean {
  if (!thread) return false

  if (getCoachThreadVisibility(thread) === 'shared') {
    return Boolean(context.coupleId && thread.coupleId === context.coupleId)
  }

  return thread.userId === context.userId
}
