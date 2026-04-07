import { useEffect, useRef } from 'react'

type DashboardEvent =
  | { type: 'mood_update'; data: { userId: string; mood: string; visibility: string } }
  | { type: 'goal_update'; data: { goalId: string; status: string } }
  | { type: 'insight_update'; data: { insightId: string; type: string } }
  | { type: 'analysis_complete'; data: { coupleId: string } }

export type { DashboardEvent }

export function useDashboardEvents(onEvent: (event: DashboardEvent) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let source: EventSource | null = null

    function connect() {
      if (!navigator.onLine) return
      if (source) {
        source.close()
        source = null
      }

      source = new EventSource('/sse/updates')

      source.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as DashboardEvent
          onEventRef.current(event)
        } catch {
          /* ignore parse errors */
        }
      }

      source.onerror = () => {
        // EventSource auto-reconnects
      }
    }

    function handleOffline() {
      if (source) {
        source.close()
        source = null
      }
    }

    function handleOnline() {
      connect()
    }

    connect()

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (source) source.close()
    }
  }, [])
}
