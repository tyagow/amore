import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { signOut } from '~/lib/auth-client'
import { getAuthSession } from '~/server/auth'

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
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { session }
  },
  component: AuthenticatedLayout,
  errorComponent: AuthErrorComponent,
})

function AuthenticatedLayout() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky nav bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to={'/dashboard' as string}
              className="text-xl font-bold text-stone-900 tracking-tight"
            >
              Amore
            </Link>

            <div className="flex items-center gap-1">
              <Link
                to={'/dashboard' as string}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                activeProps={{ className: 'bg-stone-100 text-stone-900' }}
              >
                Dashboard
              </Link>
              <Link
                to={'/connect' as string}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                activeProps={{ className: 'bg-stone-100 text-stone-900' }}
              >
                Connect
              </Link>
              <Link
                to={'/whatsapp' as string}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                activeProps={{ className: 'bg-stone-100 text-stone-900' }}
              >
                WhatsApp
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session?.user?.name && (
              <span className="text-sm text-stone-600">{session.user.name}</span>
            )}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <Outlet />
    </div>
  )
}
