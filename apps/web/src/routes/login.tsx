import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '~/lib/auth-client'
import { getAuthSession } from '~/server/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (session) {
      throw redirect({ to: '/dashboard' as string })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'Login failed')
    } else {
      navigate({ to: '/dashboard' as string })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-warm-50">
      <div className="w-full max-w-md bg-warm-100 rounded-2xl shadow-lg p-8">
        <h1 className="font-display text-3xl text-warm-900 mb-6 text-center">
          Sign In
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-warm-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-300 shadow-sm shadow-coral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-warm-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-coral-500 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
