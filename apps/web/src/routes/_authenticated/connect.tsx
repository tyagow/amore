import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  searchAndSendRequest,
  getPendingRequests,
  getSentRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  getMyCouple,
} from '~/server/connections'

export const Route = createFileRoute('/_authenticated/connect')({
  component: ConnectPage,
  loader: async () => {
    const [coupleData, pendingRequests, sentRequests] = await Promise.all([
      getMyCouple(),
      getPendingRequests(),
      getSentRequests(),
    ])
    return { coupleData, pendingRequests, sentRequests }
  },
})

function ConnectPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const {
    coupleData,
    pendingRequests: initialPending,
    sentRequests: initialSent,
  } = Route.useLoaderData()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(initialPending)
  const [sentRequests, setSentRequests] = useState(initialSent)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // SSE: listen for real-time connection events
  useEffect(() => {
    if (coupleData) return

    const source = new EventSource('/sse/user-events')

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'connection_request_received') {
          getPendingRequests().then(setPendingRequests)
        } else if (event.type === 'connection_request_accepted') {
          router.invalidate()
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => source.close()
  }, [coupleData, router])

  // Poll every 30s as fallback
  useEffect(() => {
    if (coupleData) return

    const interval = setInterval(async () => {
      const [pending, sent] = await Promise.all([
        getPendingRequests(),
        getSentRequests(),
      ])
      setPendingRequests(pending)
      setSentRequests(sent)
    }, 30_000)

    return () => clearInterval(interval)
  }, [coupleData])

  // Connected state
  if (coupleData) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-warm-100 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-warm-900 mb-2">Connected</h1>
          <p className="text-warm-600 mb-1">
            You are connected with{' '}
            <span className="font-semibold text-warm-900">
              {coupleData.partner?.name ?? coupleData.partner?.email}
            </span>
          </p>
          <p className="text-sm text-warm-400 mb-6">{coupleData.partner?.email}</p>
          <button
            onClick={() => navigate({ to: '/dashboard' as string })}
            className="px-6 py-2.5 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Handlers
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
      const updated = await getSentRequests()
      setSentRequests(updated)
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
      await router.invalidate()
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

  // Not connected state
  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl text-warm-900 mb-2">
          Connect with your partner
        </h1>
        <p className="text-warm-500 text-sm">
          Send a connection request to start using Amore together.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Pending incoming requests — shown FIRST and prominently */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <h2 className="text-lg font-bold text-warm-900">
              {pendingRequests.length === 1
                ? 'You have a connection request!'
                : `You have ${pendingRequests.length} connection requests!`}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-warm-100 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-warm-900">
                      {request.fromUserName ?? 'Someone'}
                    </p>
                    <p className="text-sm text-warm-500">{request.fromUserEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
                    >
                      {processingId === request.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 border border-warm-300 text-warm-600 text-sm rounded-lg font-medium hover:bg-warm-100 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send request form */}
      <div className="bg-warm-100 rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-warm-900 mb-1">
          Invite your partner
        </h2>
        <p className="text-warm-500 text-sm mb-4">
          Enter their email address. They&apos;ll need an Amore account to accept.
        </p>

        <form onSubmit={handleSendRequest} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            placeholder="partner@example.com"
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full py-2.5 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-300 shadow-sm shadow-coral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        {message && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Sent requests */}
      {sentRequests.length > 0 && (
        <div className="bg-warm-100 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-warm-900 mb-3">
            Sent invitations
          </h2>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-warm-50"
              >
                <span className="text-sm text-warm-700">{request.toUserEmail}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-warm-200 text-warm-500'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
