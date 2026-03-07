import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { getAuthSession } from '~/server/auth'
import { getMyCouple } from '~/server/connections'
import { Nav } from './_authenticated/-components/nav'

function AuthErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-stone-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Something went wrong</h1>
        <p className="text-stone-600 mb-6">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/login')}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }

    // Check if user has a couple
    const coupleData = await getMyCouple()
    const hasCouple = !!coupleData

    // If no couple and not already on a public path, redirect to /connect
    const publicPaths = ['/connect', '/setup']
    if (!hasCouple && !publicPaths.includes(location.pathname)) {
      throw redirect({ to: '/connect' })
    }

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
  const { pendingRequestCount } = Route.useRouteContext()

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav pendingRequestCount={pendingRequestCount} />

      {/* Page content — offset for desktop sidebar, bottom padding for mobile nav */}
      <div className="md:ml-64 pb-20 md:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
