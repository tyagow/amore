import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import {
  createWaSession,
  pollWaSession,
  getWaSessionStatus,
  disconnectWaSession,
} from '~/server/wa-session'

export const Route = createFileRoute('/_authenticated/whatsapp')({
  component: WhatsAppPage,
  loader: async () => {
    const data = await getWaSessionStatus()
    return data
  },
})

type SessionState =
  | { phase: 'idle' }
  | { phase: 'connecting'; waSessionId: string }
  | { phase: 'qr'; waSessionId: string; qr: string }
  | { phase: 'connected'; waSessionId: string }
  | { phase: 'error'; message: string }

function WhatsAppPage() {
  const { waSession } = Route.useLoaderData()
  const [state, setState] = useState<SessionState>(() => {
    if (waSession && waSession.status === 'connected') {
      return { phase: 'connected', waSessionId: waSession.id }
    }
    if (waSession && waSession.status === 'connecting') {
      return { phase: 'connecting', waSessionId: waSession.id }
    }
    return { phase: 'idle' }
  })
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (waSessionId: string) => {
      stopPolling()
      pollRef.current = setInterval(async () => {
        try {
          const result = await pollWaSession({ data: { waSessionId } })
          if (result.status === 'connected') {
            stopPolling()
            setState({ phase: 'connected', waSessionId })
          } else if (result.qr) {
            setState({ phase: 'qr', waSessionId, qr: result.qr })
          }
        } catch {
          // keep polling -- bridge may be temporarily unreachable
        }
      }, 2000)
    },
    [stopPolling],
  )

  // Convert raw QR string to data URL for display
  useEffect(() => {
    if (state.phase === 'qr') {
      QRCode.toDataURL(state.qr, { width: 256, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [state.phase === 'qr' ? (state as { qr: string }).qr : null])

  // If we loaded with a connecting state, start polling immediately
  useEffect(() => {
    if (state.phase === 'connecting') {
      startPolling(state.waSessionId)
    }
    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await createWaSession()
      if (result.status === 'connected') {
        setState({ phase: 'connected', waSessionId: result.waSessionId })
      } else {
        setState({ phase: 'connecting', waSessionId: result.waSessionId })
        startPolling(result.waSessionId)
      }
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to connect',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (state.phase !== 'connected') return
    setLoading(true)
    try {
      await disconnectWaSession({ data: { waSessionId: state.waSessionId } })
      stopPolling()
      setState({ phase: 'idle' })
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to disconnect',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          WhatsApp Integration
        </h1>
        <p className="text-stone-600 mb-6">
          Connect your WhatsApp to sync messages with Amore. Scan the QR code
          with your phone to pair.
        </p>

        {/* ── Status indicator ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              state.phase === 'connected'
                ? 'bg-emerald-500'
                : state.phase === 'connecting' || state.phase === 'qr'
                  ? 'bg-amber-500 animate-pulse'
                  : state.phase === 'error'
                    ? 'bg-red-500'
                    : 'bg-stone-300'
            }`}
          />
          <span className="text-sm font-medium text-stone-700">
            {state.phase === 'connected'
              ? 'Connected'
              : state.phase === 'connecting'
                ? 'Connecting...'
                : state.phase === 'qr'
                  ? 'Scan QR Code'
                  : state.phase === 'error'
                    ? 'Error'
                    : 'Disconnected'}
          </span>
        </div>

        {/* ── QR code display ────────────────────────────────────── */}
        {state.phase === 'qr' && (
          <div className="mb-6 flex flex-col items-center">
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-sm text-stone-500 text-center">
              Open WhatsApp on your phone, go to{' '}
              <span className="font-medium">Settings &gt; Linked Devices</span>
              , and scan this code.
            </p>
          </div>
        )}

        {/* ── Connecting spinner ─────────────────────────────────── */}
        {state.phase === 'connecting' && (
          <div className="mb-6 flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-3" />
            <p className="text-sm text-stone-500">
              Waiting for QR code from bridge...
            </p>
          </div>
        )}

        {/* ── Connected state ────────────────────────────────────── */}
        {state.phase === 'connected' && (
          <div className="mb-6 flex flex-col items-center py-4">
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-stone-700 font-medium">
              WhatsApp is connected and syncing messages.
            </p>
          </div>
        )}

        {/* ── Error state ────────────────────────────────────────── */}
        {state.phase === 'error' && (
          <div className="mb-6 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            {state.message}
          </div>
        )}

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div className="flex gap-3">
          {(state.phase === 'idle' || state.phase === 'error') && (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect WhatsApp'}
            </button>
          )}

          {state.phase === 'connected' && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}

          {(state.phase === 'connecting' || state.phase === 'qr') && (
            <button
              onClick={() => {
                stopPolling()
                setState({ phase: 'idle' })
              }}
              className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Instructions ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-lg font-bold text-stone-900 mb-4">
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-stone-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-700">
              1
            </span>
            <span>
              Click <strong>Connect WhatsApp</strong> to start a new session.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-700">
              2
            </span>
            <span>
              Scan the QR code with your phone (WhatsApp &gt; Settings &gt;
              Linked Devices &gt; Link a Device).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-700">
              3
            </span>
            <span>
              Once connected, Amore will sync your messages and provide
              relationship insights on the dashboard.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-700">
              4
            </span>
            <span>
              Your messages are encrypted and processed securely. Only
              aggregated insights are stored.
            </span>
          </li>
        </ol>
      </div>
    </div>
  )
}
