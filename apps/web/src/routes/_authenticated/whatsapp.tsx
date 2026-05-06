import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import QRCode from 'qrcode'
import {
  createWaSession,
  pollWaSession,
  getWaSessionStatus,
  disconnectWaSession,
  fetchWaContacts,
  selectWaContact,
} from '~/server/wa-session'
import type { WaContact } from '~/lib/wa-bridge'

export const Route = createFileRoute('/_authenticated/whatsapp')({
  component: WhatsAppPage,
  loader: async ({ context }) => {
    if (!context.hasCouple) throw redirect({ to: '/connect' })
    const data = await getWaSessionStatus()
    return data
  },
})

type SessionState =
  | { phase: 'idle' }
  | { phase: 'connecting'; waSessionId: string }
  | { phase: 'qr'; waSessionId: string; qr: string }
  | { phase: 'select-contact'; waSessionId: string; contacts: WaContact[] }
  | { phase: 'connected'; waSessionId: string }
  | { phase: 'error'; message: string }

function WhatsAppPage() {
  const { waSession, whatsappJid } = Route.useLoaderData()
  const navigate = useNavigate()
  const [state, setState] = useState<SessionState>(() => {
    if (waSession && waSession.status === 'connected') {
      // If partner JID is already set, go to connected; otherwise start as idle
      // and the effect below will trigger contact selection
      if (whatsappJid) {
        return { phase: 'connected', waSessionId: waSession.id }
      }
      // Temporarily show connecting while we fetch contacts
      return { phase: 'connecting', waSessionId: waSession.id }
    }
    if (waSession && waSession.status === 'connecting') {
      return { phase: 'connecting', waSessionId: waSession.id }
    }
    return { phase: 'idle' }
  })
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [selectingContact, setSelectingContact] = useState(false)
  const hasPartnerJid = useRef(!!whatsappJid)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const loadContactsAndShowSelection = useCallback(async (waSessionId: string) => {
    try {
      const result = await fetchWaContacts({ data: { waSessionId } })
      setState({ phase: 'select-contact', waSessionId, contacts: result.contacts })
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch contacts',
      })
    }
  }, [])

  const transitionToConnected = useCallback(
    (waSessionId: string) => {
      if (hasPartnerJid.current) {
        setState({ phase: 'connected', waSessionId })
      } else {
        loadContactsAndShowSelection(waSessionId)
      }
    },
    [loadContactsAndShowSelection],
  )

  const startPolling = useCallback(
    (waSessionId: string) => {
      stopPolling()
      pollRef.current = setInterval(async () => {
        try {
          const result = await pollWaSession({ data: { waSessionId } })
          if (result.status === 'connected') {
            stopPolling()
            transitionToConnected(waSessionId)
          } else if (result.qr) {
            setState({ phase: 'qr', waSessionId, qr: result.qr })
          }
        } catch {
          // keep polling -- bridge may be temporarily unreachable
        }
      }, 2000)
    },
    [stopPolling, transitionToConnected],
  )

  // Convert raw QR string to data URL for display
  useEffect(() => {
    if (state.phase === 'qr') {
      QRCode.toDataURL(state.qr, { width: 256, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [state.phase === 'qr' ? (state as { qr: string }).qr : null])

  // On mount: if connected but no partner JID, fetch contacts for selection
  // If connecting state, start polling
  useEffect(() => {
    if (waSession && waSession.status === 'connected' && !whatsappJid) {
      loadContactsAndShowSelection(waSession.id)
    } else if (state.phase === 'connecting' && waSession) {
      startPolling(waSession.id)
    }
    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await createWaSession()
      if (result.status === 'connected') {
        transitionToConnected(result.waSessionId)
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

  const handleSelectContact = async (contact: WaContact) => {
    if (state.phase !== 'select-contact') return
    setSelectingContact(true)
    try {
      await selectWaContact({ data: { waSessionId: state.waSessionId, contactJid: contact.jid } })
      hasPartnerJid.current = true
      setState({ phase: 'connected', waSessionId: state.waSessionId })
      navigate({ to: '/dashboard', search: { upgraded: false } })
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to select contact',
      })
    } finally {
      setSelectingContact(false)
    }
  }

  // Filter and sort contacts for the selection list
  const filteredContacts = useMemo(() => {
    if (state.phase !== 'select-contact') return []
    const query = contactSearch.toLowerCase().trim()
    const sorted = [...state.contacts].sort((a, b) => {
      const tsA = a.conversationTimestamp ?? 0
      const tsB = b.conversationTimestamp ?? 0
      return tsB - tsA
    })
    if (!query) return sorted
    return sorted.filter((c) => {
      const displayName = (c.name || c.pushName || c.phone || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      return displayName.includes(query) || phone.includes(query)
    })
  }, [state.phase === 'select-contact' ? (state as { contacts: WaContact[] }).contacts : null, contactSearch])

  // Status indicator label
  const statusLabel =
    state.phase === 'connected'
      ? 'Connected'
      : state.phase === 'connecting'
        ? 'Connecting...'
        : state.phase === 'qr'
          ? 'Scan QR Code'
          : state.phase === 'select-contact'
            ? 'Select Partner'
            : state.phase === 'error'
              ? 'Error'
              : 'Disconnected'

  const statusColor =
    state.phase === 'connected'
      ? 'bg-emerald-500'
      : state.phase === 'connecting' || state.phase === 'qr'
        ? 'bg-amber-500 animate-pulse'
        : state.phase === 'select-contact'
          ? 'bg-blue-500'
          : state.phase === 'error'
            ? 'bg-red-500'
            : 'bg-warm-300'

  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-8">
      <div className="bg-warm-100 rounded-2xl shadow-lg p-8">
        <h1 className="font-display text-3xl text-warm-900 mb-2">
          WhatsApp Integration
        </h1>
        <p className="text-warm-600 mb-6">
          Connect your WhatsApp to sync messages with Amore. Scan the QR code
          with your phone to pair.
        </p>

        {/* ── Status indicator ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium text-warm-700">
            {statusLabel}
          </span>
        </div>

        {/* ── QR code display ────────────────────────────────────── */}
        {state.phase === 'qr' && (
          <div className="mb-6 flex flex-col items-center">
            <div className="bg-warm-100 rounded-xl p-4 mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-warm-300 border-t-warm-900 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-sm text-warm-500 text-center">
              Open WhatsApp on your phone, go to{' '}
              <span className="font-medium">Settings &gt; Linked Devices</span>
              , and scan this code.
            </p>
          </div>
        )}

        {/* ── Connecting spinner ─────────────────────────────────── */}
        {state.phase === 'connecting' && (
          <div className="mb-6 flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-warm-300 border-t-warm-900 rounded-full animate-spin mb-3" />
            <p className="text-sm text-warm-500">
              Waiting for QR code from bridge...
            </p>
          </div>
        )}

        {/* ── Contact selection ────────────────────────────────────── */}
        {state.phase === 'select-contact' && (
          <div className="mb-6">
            <p className="text-warm-700 font-medium mb-1">
              Select your partner's contact
            </p>
            <p className="text-sm text-warm-500 mb-4">
              Choose which WhatsApp contact is your partner so Amore can sync your conversations.
            </p>

            {/* Search input */}
            <div className="relative mb-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full rounded-xl border border-warm-300 px-4 py-2 pl-10 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-coral-300"
              />
            </div>

            {/* Contact list */}
            <div className="max-h-80 overflow-y-auto rounded-xl border border-warm-200/50">
              {filteredContacts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-warm-400">
                  {contactSearch ? 'No contacts match your search.' : 'No contacts found.'}
                </div>
              ) : (
                <ul className="divide-y divide-warm-100">
                  {filteredContacts.map((contact) => (
                    <li key={contact.jid}>
                      <button
                        onClick={() => handleSelectContact(contact)}
                        disabled={selectingContact}
                        className="w-full text-left hover:bg-coral-50 rounded-lg px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                      >
                        {/* Avatar placeholder */}
                        <div className="flex-shrink-0 w-10 h-10 bg-warm-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-warm-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-warm-900 truncate">
                            {contact.name || contact.pushName || contact.phone}
                          </p>
                          {(contact.name || contact.pushName) && contact.phone && (
                            <p className="text-xs text-warm-500 truncate">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                        {/* Chevron */}
                        <svg
                          className="flex-shrink-0 w-4 h-4 text-warm-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectingContact && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-warm-500">
                <div className="w-4 h-4 border-2 border-warm-300 border-t-warm-900 rounded-full animate-spin" />
                Saving selection...
              </div>
            )}
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
            <p className="text-warm-700 font-medium mb-3">
              WhatsApp is connected and syncing messages.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-5 py-2 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-300 shadow-sm shadow-coral-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.883 6.003L4.5 21l1.497-.593A11.731 11.731 0 0012 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12c0 1.834.508 3.55 1.392 5.003z"
                  />
                </svg>
                Go to Chat
              </Link>
              <button
                onClick={() => {
                  hasPartnerJid.current = false
                  loadContactsAndShowSelection(state.waSessionId)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-warm-600 hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Change Partner
              </button>
            </div>
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
              className="flex-1 py-2.5 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-300 shadow-sm shadow-coral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect WhatsApp'}
            </button>
          )}

          {state.phase === 'connected' && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 py-2.5 border border-warm-300 text-warm-700 rounded-lg font-medium hover:bg-warm-100 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="flex-1 py-2.5 border border-warm-300 text-warm-700 rounded-lg font-medium hover:bg-warm-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Instructions ─────────────────────────────────────────── */}
      <div className="bg-warm-100 rounded-2xl shadow-lg p-8">
        <h2 className="text-lg font-bold text-warm-900 mb-4">
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-warm-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-warm-100 rounded-full flex items-center justify-center text-xs font-bold text-warm-700">
              1
            </span>
            <span>
              Click <strong>Connect WhatsApp</strong> to start a new session.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-warm-100 rounded-full flex items-center justify-center text-xs font-bold text-warm-700">
              2
            </span>
            <span>
              Scan the QR code with your phone (WhatsApp &gt; Settings &gt;
              Linked Devices &gt; Link a Device).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-warm-100 rounded-full flex items-center justify-center text-xs font-bold text-warm-700">
              3
            </span>
            <span>
              Select your partner&apos;s contact from the synced contact list.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-warm-100 rounded-full flex items-center justify-center text-xs font-bold text-warm-700">
              4
            </span>
            <span>
              Once connected, Amore will sync your messages and provide
              relationship insights on the dashboard.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-warm-100 rounded-full flex items-center justify-center text-xs font-bold text-warm-700">
              5
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
