import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/_authenticated/setup')({
  component: SetupPage,
})

function SetupPage() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const [displayName, setDisplayName] = useState(session?.user?.name ?? '')
  const [loading, setLoading] = useState(false)

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authClient.updateUser({ name: displayName.trim() })
      navigate({ to: '/connect' as string })
    } catch {
      // If update fails, still navigate -- name can be updated later
      navigate({ to: '/connect' as string })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Welcome to Amore
        </h1>
        <p className="text-stone-600 mb-8">
          Let&apos;s get you set up. How would you like to be called?
        </p>

        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Continuing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
