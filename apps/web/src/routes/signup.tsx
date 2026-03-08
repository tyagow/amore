import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signUp } from '~/lib/auth-client'
import { getAuthSession } from '~/server/auth'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (session) {
      throw redirect({ to: '/dashboard' as string })
    }
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signUp.email({ name, email, password })
    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'Signup failed')
    } else {
      navigate({ to: '/connect' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-warm-50">
      <div className="w-full max-w-md bg-warm-100 rounded-2xl shadow-lg p-8">
        <h1 className="font-display text-3xl text-warm-900 mb-6 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-warm-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-warm-500">
          Already have an account?{' '}
          <Link to="/login" className="text-coral-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
