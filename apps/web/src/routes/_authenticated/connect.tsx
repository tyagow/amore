import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  searchAndSendRequest,
  getPendingRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  getMyCouple,
} from '~/server/connections'

export const Route = createFileRoute('/_authenticated/connect')({
  component: ConnectPage,
  loader: async () => {
    const [coupleData, pendingRequests] = await Promise.all([
      getMyCouple(),
      getPendingRequests(),
    ])
    return { coupleData, pendingRequests }
  },
})

function ConnectPage() {
  const navigate = useNavigate()
  const { coupleData, pendingRequests: initialRequests } = Route.useLoaderData()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(initialRequests)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // If already connected, show the connected state
  if (coupleData) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Connected
          </h1>
          <p className="text-stone-600 mb-1">
            You are connected with{' '}
            <span className="font-semibold text-stone-900">
              {coupleData.partner?.name ?? coupleData.partner?.email}
            </span>
          </p>
          <p className="text-sm text-stone-400 mb-6">
            {coupleData.partner?.email}
          </p>
          <button
            onClick={() => navigate({ to: '/dashboard' as string })}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    setMessage(null)
    setError(null)

    try {
      const result = await searchAndSendRequest({ data: { email: email.trim() } })
      setMessage(result.message)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await acceptConnectionRequest({ data: { requestId } })
      // Refresh the page to show connected state
      navigate({ to: '/connect' as string, replace: true })
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await declineConnectionRequest({ data: { requestId } })
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-8">
      {/* Send Request Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Connect with your partner
        </h1>
        <p className="text-stone-600 mb-6">
          Enter your partner&apos;s email address to send a connection request.
        </p>

        <form onSubmit={handleSendRequest} className="space-y-4">
          <div>
            <label
              htmlFor="partnerEmail"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Partner&apos;s Email
            </label>
            <input
              id="partnerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              placeholder="partner@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Request'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-stone-100 rounded-lg text-sm text-stone-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Pending Incoming Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            Pending Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {request.fromUserName ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-stone-500">
                    {request.fromUserEmail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-1.5 bg-stone-900 text-white text-sm rounded-lg font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-1.5 border border-stone-300 text-stone-700 text-sm rounded-lg font-medium hover:bg-stone-100 disabled:opacity-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
