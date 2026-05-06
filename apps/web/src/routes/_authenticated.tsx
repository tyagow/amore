import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
  useLocation,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getAuthSession } from '~/server/auth'
import { getMyCouple } from '~/server/connections'
import { getCoachNudges } from '~/server/coach'
import { Nav } from './_authenticated/-components/nav'
import { CoachSidebar } from './_authenticated/-components/coach-sidebar'
import { OfflineIndicator } from './_authenticated/-components/offline-indicator'
import { UpgradeModal } from './_authenticated/-components/upgrade-modal'

function AuthErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-warm-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Something went wrong</h1>
        <p className="text-warm-600 mb-6">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/login')}
            className="px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }

    // Check if user has a couple
    const coupleData = await getMyCouple()
    const hasCouple = !!coupleData

    // Allow solo access — no hard redirect to /connect
    // Components show contextual empty states when no couple exists

    let pendingRequestCount = 0
    if (!hasCouple) {
      const { getPendingRequests } = await import('~/server/connections')
      const requests = await getPendingRequests()
      pendingRequestCount = requests.length
    }

    return { session, hasCouple, pendingRequestCount }
  },
  component: AuthenticatedLayout,
  errorComponent: AuthErrorComponent,
})

function AuthenticatedLayout() {
  const { pendingRequestCount, hasCouple } = Route.useRouteContext()
  const location = useLocation()
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachPrompt, setCoachPrompt] = useState<string | null>(null)
  const [hasNudges, setHasNudges] = useState(false)

  // Listen for coach open events from child components (e.g. SoloOnboarding CTA)
  useEffect(() => {
    const handler = (event: Event) => {
      const prompt =
        event instanceof CustomEvent && typeof event.detail?.prompt === 'string'
          ? event.detail.prompt
          : null
      setCoachPrompt(prompt)
      setCoachOpen(true)
    }
    window.addEventListener('amore:open-coach', handler)
    return () => window.removeEventListener('amore:open-coach', handler)
  }, [])

  useEffect(() => {
    // Load nudges — works for both solo and coupled users (solo returns empty)
    getCoachNudges()
      .then((nudges) => {
        setHasNudges(nudges.length > 0)
      })
      .catch(() => {
        setHasNudges(false)
      })
  }, [hasCouple, coachOpen, location.pathname])

  const currentPage =
    location.pathname.split('/').filter(Boolean).pop() ?? 'dashboard'

  return (
    <div className="min-h-screen bg-warm-50">
      <OfflineIndicator />
      <Nav
        pendingRequestCount={pendingRequestCount}
        coachOpen={coachOpen}
        hasNudges={hasNudges}
        onCoachToggle={() => setCoachOpen((open) => !open)}
      />

      {/* Page content — offset for desktop sidebar, bottom padding for mobile nav */}
      <div className={`md:ml-64 pb-24 md:pb-0 transition-[margin] duration-300 ${coachOpen ? 'lg:mr-[22rem]' : ''}`}>
        <Outlet />
      </div>

      {coachOpen && (
        <div className="fixed inset-y-0 right-0 z-40 hidden w-[22rem] lg:block">
          <CoachSidebar
            currentPage={currentPage}
            initialPrompt={coachPrompt}
            onClose={() => setCoachOpen(false)}
          />
        </div>
      )}

      {coachOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CoachSidebar
            currentPage={currentPage}
            initialPrompt={coachPrompt}
            onClose={() => setCoachOpen(false)}
          />
        </div>
      )}

      {!coachOpen && (
        <button
          onClick={() => setCoachOpen(true)}
          className="fixed bottom-28 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-all hover:bg-coral-600 active:scale-95 lg:hidden"
          aria-label="Open coach"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.895-.356-1.755-.988-2.387l-.547-.547Z" />
          </svg>
          {hasNudges && (
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          )}
        </button>
      )}

      <UpgradeModal />
    </div>
  )
}
