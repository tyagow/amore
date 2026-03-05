import { useEffect } from 'react'

type DashboardEvent =
  | { type: 'mood_update'; data: { userId: string; mood: string; visibility: string } }
  | { type: 'goal_update'; data: { goalId: string; status: string } }
  | { type: 'insight_update'; data: { insightId: string; type: string } }
  | { type: 'analysis_complete'; data: { coupleId: string } }

export type { DashboardEvent }

export function useDashboardEvents(onEvent: (event: DashboardEvent) => void) {
  useEffect(() => {
    const source = new EventSource('/sse/updates')

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as DashboardEvent
        onEvent(event)
      } catch {
        /* ignore parse errors */
      }
    }

    source.onerror = () => {
      // EventSource auto-reconnects
    }

    return () => source.close()
  }, [onEvent])
}
