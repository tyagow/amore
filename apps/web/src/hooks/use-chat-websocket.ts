import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChatMessage, ConnectionStatus } from '~/types/chat'

interface UseChatWebSocketReturn {
  messages: ChatMessage[]
  send: (text: string, jid: string) => void
  loadMore: () => void
  connectionStatus: ConnectionStatus
  isLoading: boolean
  hasMore: boolean
  requestResync: (jid: string) => void
  isResyncing: boolean
  partnerName: string
}

interface QueuedMessage {
  jid: string
  text: string
  clientId: string
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)
  const [partnerName, setPartnerName] = useState('Partner')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const offlineQueueRef = useRef<QueuedMessage[]>([])
  const lastSendTimeRef = useRef(0)
  const sendTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  const mountedRef = useRef(true)
  const messagesRef = useRef<ChatMessage[]>([])
  const connectionStatusRef = useRef<ConnectionStatus>('connecting')
  const hasMoreRef = useRef(false)

  // Keep refs in sync with state
  messagesRef.current = messages
  connectionStatusRef.current = connectionStatus
  hasMoreRef.current = hasMore

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      if (!mountedRef.current) return
      const isReconnect = reconnectAttemptRef.current > 0
      setConnectionStatus('connected')
      reconnectAttemptRef.current = 0

      // On reconnect, clear stale optimistic messages — server will
      // auto-send fresh history on open, so we just reset state.
      if (isReconnect) {
        setMessages([])
        setHasMore(false)
      }

      // Note: The WS proxy auto-sends initial history on open.
      // No need to send load-history here.

      // Flush offline queue
      const queue = offlineQueueRef.current.splice(0)
      for (const msg of queue) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.clientId === msg.clientId)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], status: 'sending' }
            return updated
          }
          return prev
        })
        ws.send(
          JSON.stringify({
            type: 'send',
            jid: msg.jid,
            text: msg.text,
            clientId: msg.clientId,
          }),
        )
      }
    })

    ws.addEventListener('message', (event) => {
      if (!mountedRef.current) return

      let data: Record<string, unknown>
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }

      switch (data.type) {
        case 'history': {
          const rawMessages = (data.messages ?? []) as Array<
            Record<string, unknown>
          >
          const historyMessages: ChatMessage[] = rawMessages.map((m) => ({
            id: m.id as string,
            sender: m.sender as string,
            text: m.text as string | null,
            timestamp: m.timestamp as string,
            fromMe: m.fromMe as boolean,
            isMedia: m.isMedia as boolean | undefined,
            mediaType: m.mediaType as ChatMessage['mediaType'],
            waMessageId: m.waMessageId as string | undefined,
            // Messages from DB are confirmed sent
            status: (m.fromMe ? 'sent' : undefined) as 'sent' | undefined,
          }))
          setMessages((prev) => {
            // Prepend history, avoiding dupes
            const existingIds = new Set(prev.map((m) => m.id))
            const newMsgs = historyMessages.filter(
              (m) => !existingIds.has(m.id),
            )
            return [...newMsgs.reverse(), ...prev]
          })
          setHasMore((data.hasMore as boolean) ?? false)
          setIsLoading(false)
          break
        }

        case 'message': {
          const msg: ChatMessage = {
            id: data.id as string,
            sender: data.sender as string,
            text: data.text as string | null,
            timestamp: data.timestamp as string,
            fromMe: data.fromMe as boolean,
            isMedia: data.isMedia as boolean | undefined,
            mediaType: data.mediaType as ChatMessage['mediaType'],
            waMessageId: data.waMessageId as string | undefined,
            thumbnail: (data.thumbnail as string | null) ?? null,
          }

          setMessages((prev) => {
            // Dedup: check if this message already exists
            const existingIdx = prev.findIndex(
              (m) =>
                (data.waMessageId &&
                  m.waMessageId &&
                  m.waMessageId === data.waMessageId) ||
                (data.id && m.id === data.id) ||
                (data.clientId &&
                  m.clientId &&
                  m.clientId === data.clientId),
            )
            if (existingIdx !== -1) {
              const updated = [...prev]
              updated[existingIdx] = {
                ...updated[existingIdx],
                ...msg,
                status: 'sent',
              }
              return updated
            }
            return [...prev, msg]
          })
          break
        }

        case 'sent': {
          const clientId = data.clientId as string | undefined
          const serverId = data.id as string | undefined
          const waMessageId = data.waMessageId as string | undefined
          // Clear the timeout for this optimistic message
          if (clientId) {
            const timeout = sendTimeoutsRef.current.get(clientId)
            if (timeout) {
              clearTimeout(timeout)
              sendTimeoutsRef.current.delete(clientId)
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.clientId && m.clientId === clientId
                ? {
                    ...m,
                    id: serverId ?? m.id,
                    waMessageId: waMessageId ?? m.waMessageId,
                    status: 'sent' as const,
                  }
                : m,
            ),
          )
          break
        }

        case 'send-error': {
          const errorClientId = data.clientId as string | undefined
          const errorMsg =
            (data.error as string) || (data.message as string) || ''
          if (errorClientId) {
            const timeout = sendTimeoutsRef.current.get(errorClientId)
            if (timeout) {
              clearTimeout(timeout)
              sendTimeoutsRef.current.delete(errorClientId)
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.clientId && m.clientId === errorClientId
                ? { ...m, status: 'error' as const }
                : m,
            ),
          )

          // Session-level errors: redirect to reconnect
          const lower = errorMsg.toLowerCase()
          if (
            lower.includes('not found') ||
            lower.includes('not connected')
          ) {
            setConnectionStatus('session-expired')
          }
          break
        }

        case 'sent-echo': {
          // Baileys echo for fromMe messages — backup confirmation
          // when the direct `sent` response was lost (e.g. bridge restart)
          const echoWaId = data.waMessageId as string | undefined
          if (echoWaId) {
            setMessages((prev) => {
              // First try exact match by waMessageId
              const exactMatch = prev.findIndex(
                (m) => m.waMessageId === echoWaId,
              )
              if (exactMatch !== -1) {
                const updated = [...prev]
                updated[exactMatch] = {
                  ...updated[exactMatch],
                  status: 'sent' as const,
                }
                return updated
              }
              // Otherwise confirm the oldest pending fromMe message
              const pendingIdx = prev.findIndex(
                (m) =>
                  m.fromMe &&
                  (m.status === 'sending' || m.status === 'error'),
              )
              if (pendingIdx !== -1) {
                const updated = [...prev]
                updated[pendingIdx] = {
                  ...updated[pendingIdx],
                  waMessageId: echoWaId,
                  status: 'sent' as const,
                }
                return updated
              }
              return prev
            })
          }
          break
        }

        case 'message-receipt': {
          const receiptWaId = data.waMessageId as string | undefined
          const receiptStatus = data.status as
            | 'delivered'
            | 'read'
            | undefined
          if (receiptWaId && receiptStatus) {
            setMessages((prev) =>
              prev.map((m) =>
                m.waMessageId === receiptWaId
                  ? { ...m, status: receiptStatus }
                  : m,
              ),
            )
          }
          break
        }

        case 'connection-status': {
          setConnectionStatus(data.status as ConnectionStatus)
          if (data.partnerName) {
            setPartnerName(data.partnerName as string)
          }
          break
        }

        case 'resync-started':
          // No-op: spinner already showing via isResyncing
          break

        case 'resync-complete':
          setIsResyncing(false)
          // Clear and reload from scratch so resynced messages appear
          setMessages([])
          setHasMore(false)
          {
            const currentWs = wsRef.current
            if (currentWs && currentWs.readyState === WebSocket.OPEN) {
              currentWs.send(
                JSON.stringify({ type: 'load-history', limit: 50 }),
              )
            }
          }
          break

        case 'resync-error':
          setIsResyncing(false)
          break

        case 'error': {
          const msg = (data.message as string) || ''
          if (msg.toLowerCase().includes('session')) {
            setConnectionStatus('session-expired')
          }
          break
        }
      }
    })

    ws.addEventListener('close', (event) => {
      if (!mountedRef.current) return
      wsRef.current = null
      setIsResyncing(false)

      // Clear all pending send timeouts and mark as error
      for (const [clientId, timeout] of sendTimeoutsRef.current) {
        clearTimeout(timeout)
        sendTimeoutsRef.current.delete(clientId)
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.status === 'sending'
            ? { ...m, status: 'error' as const }
            : m,
        ),
      )

      if (
        connectionStatusRef.current === 'logged-out' ||
        connectionStatusRef.current === 'session-expired' ||
        event.code === 4404
      ) {
        setConnectionStatus('session-expired')
      } else {
        setConnectionStatus('reconnecting')
        scheduleReconnect()
      }
    })

    ws.addEventListener('error', () => {
      // Close event will fire after error, triggering reconnect
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return

    const attempt = reconnectAttemptRef.current
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
    reconnectAttemptRef.current = attempt + 1

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect()
      }
    }, delay)
  }, [connect])

  // Send with throttle and optimistic update
  const send = useCallback((text: string, jid: string) => {
    const now = Date.now()
    const clientId = generateId()

    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      sender: 'You',
      text,
      timestamp: new Date().toISOString(),
      fromMe: true,
      status: 'sending',
    }

    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      optimistic.status = 'queued'
      setMessages((prev) => [...prev, optimistic])
      offlineQueueRef.current.push({ jid, text, clientId })
      return
    }

    setMessages((prev) => [...prev, optimistic])

    const sendActual = () => {
      const currentWs = wsRef.current
      if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
        offlineQueueRef.current.push({ jid, text, clientId })
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? { ...m, status: 'queued' as const }
              : m,
          ),
        )
        return
      }
      lastSendTimeRef.current = Date.now()
      currentWs.send(JSON.stringify({ type: 'send', jid, text, clientId }))

      // Set timeout for confirmation (120s)
      const timeout = setTimeout(() => {
        sendTimeoutsRef.current.delete(clientId)
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId && m.status === 'sending'
              ? { ...m, status: 'error' as const }
              : m,
          ),
        )
      }, 120_000)
      sendTimeoutsRef.current.set(clientId, timeout)
    }

    // Throttle: ensure at least 1s between sends
    const timeSinceLastSend = now - lastSendTimeRef.current
    if (timeSinceLastSend < 1000) {
      setTimeout(sendActual, 1000 - timeSinceLastSend)
    } else {
      sendActual()
    }
  }, [])

  // Load more history — read oldest timestamp from ref, not inside updater
  const loadMore = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !hasMoreRef.current) return

    const msgs = messagesRef.current
    if (msgs.length === 0) return
    const oldest = msgs[0]
    const ts =
      oldest.timestamp instanceof Date
        ? oldest.timestamp.toISOString()
        : oldest.timestamp
    ws.send(JSON.stringify({ type: 'load-history', before: ts, limit: 50 }))
  }, [])

  // Request resync from wa-bridge
  const requestResync = useCallback((jid: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setIsResyncing(true)
    ws.send(JSON.stringify({ type: 'resync', jid }))
  }, [])

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      // Clear all send timeouts
      for (const timeout of sendTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      sendTimeoutsRef.current.clear()

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    messages,
    send,
    loadMore,
    connectionStatus,
    isLoading,
    hasMore,
    partnerName,
    requestResync,
    isResyncing,
  }
}
