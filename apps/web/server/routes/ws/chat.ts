/**
 * WebSocket proxy endpoint for live chat.
 *
 * Nitro server route: ws://host/ws/chat?coupleId=...
 * Uses crossws (via h3's defineWebSocketHandler) for protocol-agnostic WS.
 *
 * Authenticates via session, resolves coupleId, proxies to wa-bridge on port 9942.
 */

import {
  defineWebSocketHandler,
  type WebSocketPeer,
  type WebSocketMessage,
} from 'h3'
import WebSocket from 'ws'
import { db } from '@amore-couples/db'
import { waSessions, couples, messages } from '@amore-couples/db/schema'
import { eq, or, and, lt, desc } from 'drizzle-orm'
import { auth } from '../../../src/lib/auth'

const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9942'
const WA_BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET || ''

// ── Per-peer state ──────────────────────────────────────────────────
interface PeerState {
  upstream: WebSocket | null
  coupleId: string
  sessionId: string
  userId: string
  heartbeatTimer: ReturnType<typeof setInterval> | null
  pongTimer: ReturnType<typeof setTimeout> | null
  reconnectAttempt: number
  closed: boolean
}

const peers = new Map<string, PeerState>()

// ── Helpers ─────────────────────────────────────────────────────────

function sendToPeer(peer: WebSocketPeer, data: unknown) {
  try {
    peer.send(JSON.stringify(data))
  } catch {
    // peer may already be closed
  }
}

function cleanupPeer(peerId: string) {
  const state = peers.get(peerId)
  if (!state) return
  state.closed = true
  if (state.heartbeatTimer) clearInterval(state.heartbeatTimer)
  if (state.pongTimer) clearTimeout(state.pongTimer)
  if (state.upstream && state.upstream.readyState === WebSocket.OPEN) {
    state.upstream.close(1000, 'browser disconnected')
  }
  peers.delete(peerId)
}

// ── Upstream WS connection to wa-bridge ─────────────────────────────

function connectUpstream(peer: WebSocketPeer, state: PeerState) {
  const wsUrl = WA_BRIDGE_URL.replace(/^http/, 'ws')
  const params = new URLSearchParams({
    sessionId: state.sessionId,
    ...(WA_BRIDGE_SECRET ? { token: WA_BRIDGE_SECRET } : {}),
  })
  const url = `${wsUrl}?${params.toString()}`

  const upstream = new WebSocket(url)
  state.upstream = upstream

  upstream.on('open', () => {
    console.log(`[ws/chat] upstream connected for peer ${peer.id}`)
    state.reconnectAttempt = 0
    sendToPeer(peer, { type: 'connection-status', status: 'connected' })
    startHeartbeat(peer, state)
  })

  upstream.on('message', (raw: WebSocket.RawData) => {
    if (state.closed) return
    try {
      const msg = JSON.parse(raw.toString())
      routeBridgeMessage(peer, state, msg)
    } catch {
      // ignore non-JSON from bridge
    }
  })

  upstream.on('pong', () => {
    if (state.pongTimer) {
      clearTimeout(state.pongTimer)
      state.pongTimer = null
    }
  })

  upstream.on('close', (code: number) => {
    console.log(`[ws/chat] upstream closed for peer ${peer.id}, code=${code}`)
    stopHeartbeat(state)
    if (!state.closed && code !== 1000) {
      scheduleReconnect(peer, state)
    }
  })

  upstream.on('error', (err: Error) => {
    console.error(`[ws/chat] upstream error for peer ${peer.id}:`, err.message)
    // 'close' event will fire after this
  })
}

function scheduleReconnect(peer: WebSocketPeer, state: PeerState) {
  if (state.closed) return
  const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempt), 30000)
  state.reconnectAttempt++
  console.log(
    `[ws/chat] reconnecting upstream for peer ${peer.id} in ${delay}ms (attempt ${state.reconnectAttempt})`,
  )
  sendToPeer(peer, { type: 'connection-status', status: 'reconnecting' })
  setTimeout(() => {
    if (!state.closed) {
      connectUpstream(peer, state)
    }
  }, delay)
}

// ── Heartbeat ───────────────────────────────────────────────────────

function startHeartbeat(peer: WebSocketPeer, state: PeerState) {
  stopHeartbeat(state)
  state.heartbeatTimer = setInterval(() => {
    if (state.upstream && state.upstream.readyState === WebSocket.OPEN) {
      state.upstream.ping()
      state.pongTimer = setTimeout(() => {
        console.log(`[ws/chat] pong timeout for peer ${peer.id}, reconnecting`)
        if (state.upstream) {
          state.upstream.terminate()
        }
        // 'close' handler will trigger reconnect
      }, 10_000)
    }
  }, 30_000)
}

function stopHeartbeat(state: PeerState) {
  if (state.heartbeatTimer) {
    clearInterval(state.heartbeatTimer)
    state.heartbeatTimer = null
  }
  if (state.pongTimer) {
    clearTimeout(state.pongTimer)
    state.pongTimer = null
  }
}

// ── Message routing: bridge → browser ───────────────────────────────

function routeBridgeMessage(peer: WebSocketPeer, _state: PeerState, msg: Record<string, unknown>) {
  switch (msg.type) {
    case 'message': {
      const data = msg.data as Record<string, unknown> | undefined
      if (!data) break
      const key = data.key as Record<string, unknown> | undefined
      sendToPeer(peer, {
        type: 'message',
        id: key?.id,
        sender: data.fromMe
          ? 'You'
          : (data.pushName as string) ||
            (key?.remoteJid as string)?.split('@')[0] ||
            'unknown',
        text: data.text,
        timestamp: data.timestamp,
        fromMe: data.fromMe,
      })
      break
    }

    case 'connected':
    case 'disconnected':
    case 'logged-out':
    case 'reconnecting':
    case 'reconnect-failed':
      sendToPeer(peer, { type: 'connection-status', status: msg.type })
      break

    case 'sent-echo': {
      sendToPeer(peer, msg)
      break
    }

    case 'message-receipt': {
      sendToPeer(peer, msg)
      break
    }

    case 'messages-persisted':
    case 'analysis-complete':
    case 'sent':
    case 'send-error':
    case 'resync-started':
    case 'resync-complete':
    case 'resync-error':
      sendToPeer(peer, msg)
      break

    default:
      // Forward unknown types as-is
      sendToPeer(peer, msg)
      break
  }
}

// ── History loading from DB ─────────────────────────────────────────

async function handleLoadHistory(
  peer: WebSocketPeer,
  state: PeerState,
  payload: { before?: string; limit: number },
) {
  try {
    const limit = Math.min(payload.limit || 50, 100)

    const conditions = [eq(messages.coupleId, state.coupleId)]
    if (payload.before) {
      conditions.push(lt(messages.timestamp, new Date(payload.before)))
    }

    const rows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        text: messages.text,
        timestamp: messages.timestamp,
        isMedia: messages.isMedia,
        waMessageId: messages.waMessageId,
      })
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.timestamp))
      .limit(limit)

    const mapped = rows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      fromMe: m.senderId === state.userId,
      isMedia: m.isMedia,
      waMessageId: m.waMessageId,
    }))

    sendToPeer(peer, {
      type: 'history',
      messages: mapped,
      hasMore: rows.length === limit,
    })
  } catch (err) {
    console.error('[ws/chat] load-history error:', err)
    sendToPeer(peer, { type: 'error', message: 'Failed to load history' })
  }
}

// ── WebSocket handler ───────────────────────────────────────────────

export default defineWebSocketHandler({
  async open(peer: WebSocketPeer) {
    console.log('[ws/chat] peer connected:', peer.id)

    try {
      // ── Auth ────────────────────────────────────────────────────
      const url = new URL(
        peer.request?.url || '',
        `http://${peer.request?.headers?.get?.('host') || 'localhost'}`,
      )

      // Extract headers for Better Auth session lookup
      const reqHeaders = peer.request?.headers
      const session = await auth.api.getSession({
        headers: reqHeaders as unknown as Headers,
      })
      if (!session) {
        sendToPeer(peer, { type: 'error', message: 'Unauthorized' })
        peer.close(4401, 'Unauthorized')
        return
      }

      const userId = session.user.id

      // Resolve couple membership
      const couple = await db.query.couples.findFirst({
        where: or(
          eq(couples.userAId, userId),
          eq(couples.userBId, userId),
        ),
      })

      if (!couple || couple.status !== 'active') {
        sendToPeer(peer, { type: 'error', message: 'No active couple found' })
        peer.close(4404, 'No active couple')
        return
      }

      // Look up WA session
      const [waSession] = await db
        .select({ bridgeSessionId: waSessions.bridgeSessionId })
        .from(waSessions)
        .where(eq(waSessions.userId, userId))

      if (!waSession) {
        sendToPeer(peer, { type: 'error', message: 'No WhatsApp session found' })
        peer.close(4404, 'No WhatsApp session')
        return
      }

      // ── Store peer state ──────────────────────────────────────
      const state: PeerState = {
        upstream: null,
        coupleId: couple.id,
        sessionId: waSession.bridgeSessionId,
        userId,
        heartbeatTimer: null,
        pongTimer: null,
        reconnectAttempt: 0,
        closed: false,
      }
      cleanupPeer(peer.id)
      peers.set(peer.id, state)

      // ── Connect to wa-bridge upstream ─────────────────────────
      connectUpstream(peer, state)

      // ── Send initial history (server-initiated to avoid race) ──
      handleLoadHistory(peer, state, { limit: 50 })
    } catch (err) {
      console.error('[ws/chat] open error:', err)
      sendToPeer(peer, { type: 'error', message: 'Internal server error' })
      peer.close(4500, 'Internal error')
    }
  },

  message(peer: WebSocketPeer, message: WebSocketMessage) {
    const state = peers.get(peer.id)
    if (!state) return

    const text = typeof message === 'string' ? message : message.text()

    try {
      const parsed = JSON.parse(text)

      switch (parsed.type) {
        case 'send':
          // Forward send messages to upstream as-is
          if (
            state.upstream &&
            state.upstream.readyState === WebSocket.OPEN
          ) {
            state.upstream.send(text)
          } else {
            sendToPeer(peer, {
              type: 'send-error',
              message: 'Bridge not connected',
              clientId: parsed.clientId,
            })
          }
          break

        case 'load-history':
          handleLoadHistory(peer, state, parsed)
          break

        default:
          // Forward any other message types to upstream
          if (
            state.upstream &&
            state.upstream.readyState === WebSocket.OPEN
          ) {
            state.upstream.send(text)
          }
          break
      }
    } catch {
      // Non-JSON message -- ignore
      console.warn('[ws/chat] non-JSON message from', peer.id)
    }
  },

  close(peer: WebSocketPeer, details: { code?: number; reason?: string }) {
    console.log('[ws/chat] peer disconnected:', peer.id, details)
    cleanupPeer(peer.id)
  },

  error(peer: WebSocketPeer, error: Error) {
    console.error('[ws/chat] error for peer', peer.id, ':', error)
    cleanupPeer(peer.id)
  },
})
