import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getAuthSession } from '~/server/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-stone-900 tracking-tight">
          Amore Couples
        </h1>
        <p className="mt-4 text-stone-600">
          Relationship intelligence, together.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/login"
            className="px-6 py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-100 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
