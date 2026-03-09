/**
 * WebSocket proxy endpoint for live chat.
 *
 * Nitro server route: ws://host/ws/chat?coupleId=...
 * Uses crossws (via h3's defineWebSocketHandler) for protocol-agnostic WS.
 *
 * Authenticates via session, resolves coupleId, proxies to wa-bridge on port 9945.
 */

import {
  defineWebSocketHandler,
  type WebSocketPeer,
  type WebSocketMessage,
} from 'h3'
import WebSocket from 'ws'
import { SignJWT } from 'jose'
import { db } from '@amore-couples/db'
import { waSessions, couples, messages, users } from '@amore-couples/db/schema'
import { eq, or, and, lt, desc } from 'drizzle-orm'
import { auth } from '../../../src/lib/auth'

const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9945'
const WA_BRIDGE_JWT_SECRET = process.env.WA_BRIDGE_JWT_SECRET || ''
const jwtSecretKey = new TextEncoder().encode(WA_BRIDGE_JWT_SECRET)

// ── Per-peer state ──────────────────────────────────────────────────
interface PeerState {
  upstream: WebSocket | null
  coupleId: string
  sessionId: string
  userId: string
  partnerId: string          // User ID of the partner — for message persistence
  partnerJid: string | null  // WhatsApp JID of the partner — used to filter messages
  partnerName: string        // Display name of the partner
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

// ── JWT signing for wa-bridge auth ──────────────────────────────────

async function signBridgeToken(state: PeerState): Promise<string> {
  return new SignJWT({
    coupleId: state.coupleId,
    sessionId: state.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(state.userId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(jwtSecretKey)
}

// ── Upstream WS connection to wa-bridge ─────────────────────────────

async function connectUpstream(peer: WebSocketPeer, state: PeerState) {
  const wsUrl = WA_BRIDGE_URL.replace(/^http/, 'ws')
  const url = `${wsUrl}?sessionId=${encodeURIComponent(state.sessionId)}`

  const token = await signBridgeToken(state)
  const upstream = new WebSocket(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  state.upstream = upstream

  upstream.on('open', () => {
    console.log(`[ws/chat] upstream connected for peer ${peer.id}`)
    state.reconnectAttempt = 0
    sendToPeer(peer, { type: 'connection-status', status: 'connected', partnerName: state.partnerName })
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

function routeBridgeMessage(peer: WebSocketPeer, state: PeerState, msg: Record<string, unknown>) {
  switch (msg.type) {
    case 'message': {
      const data = msg.data as Record<string, unknown> | undefined
      if (!data) break
      const key = data.key as Record<string, unknown> | undefined
      // Filter: only forward messages from the bound partner JID
      const remoteJid = key?.remoteJid as string | undefined
      if (state.partnerJid && remoteJid && remoteJid !== state.partnerJid) break
      const text = data.text as string | null | undefined
      const isMedia = data.isMedia as boolean | undefined
      const mediaType = (data.mediaType as string) ?? null
      const thumbnail = (data.thumbnail as string) ?? null
      // Skip messages with no text AND no media (protocol messages)
      if (!text && !isMedia) break

      const waMessageId = key?.id as string | undefined
      const fromMe = data.fromMe as boolean
      const timestamp = data.timestamp as number | undefined

      // Persist to local DB so history stays fresh
      if (waMessageId && timestamp) {
        const senderId = fromMe ? state.userId : state.partnerId
        db.insert(messages)
          .values({
            coupleId: state.coupleId,
            waMessageId,
            senderId,
            text: text ?? null,
            timestamp: new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp),
            isMedia: isMedia ?? false,
            mediaType,
            thumbnail: thumbnail ?? null,
            source: 'baileys',
          })
          .onConflictDoNothing()
          .catch(() => { /* best-effort local persistence */ })
      }

      sendToPeer(peer, {
        type: 'message',
        id: waMessageId,
        sender: fromMe ? 'You' : state.partnerName,
        text: text ?? null,
        timestamp,
        fromMe,
        waMessageId,
        isMedia: isMedia ?? false,
        mediaType,
        ...(thumbnail ? { thumbnail } : {}),
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
      // Filter by JID — only forward echoes for the bound partner
      const echoJid = msg.jid as string | undefined
      if (state.partnerJid && echoJid && echoJid !== state.partnerJid) break
      sendToPeer(peer, msg)
      break
    }

    case 'message-receipt': {
      // Filter by JID — only forward receipts for the bound partner
      const receiptJid = msg.jid as string | undefined
      if (state.partnerJid && receiptJid && receiptJid !== state.partnerJid) break
      sendToPeer(peer, msg)
      break
    }

    case 'messages-persisted':
      sendToPeer(peer, msg)
      // Bridge just persisted messages to prod DB — pull them into local DB
      syncMessagesFromProd(peer, state, 'incremental')
      break

    case 'resync-complete':
      sendToPeer(peer, msg)
      // Resync can backfill older gaps, so run a full pull before reloading history.
      syncMessagesFromProd(peer, state, 'full')
      break

    case 'analysis-complete':
    case 'sent':
    case 'send-error':
    case 'resync-started':
    case 'resync-error':
      sendToPeer(peer, msg)
      break

    default:
      // Forward unknown types as-is
      sendToPeer(peer, msg)
      break
  }
}

// ── Sync messages from prod DB into local DB ───────────────────────

async function syncMessagesFromProd(
  peer: WebSocketPeer,
  state: PeerState,
  mode: 'incremental' | 'full' = 'incremental',
) {
  const PROD_DB_URL = process.env.PROD_DATABASE_URL
  if (!PROD_DB_URL) return

  type ProdPool = {
    query: (text: string, values?: unknown[]) => Promise<{ rows: any[] }>
    end: () => Promise<void>
  }

  let pool: ProdPool | null = null
  try {
    // @ts-expect-error `pg` does not expose usable ESM typings in this package.
    const pg = await import('pg')
    const prodPool = new (pg.default as any).Pool({
      connectionString: PROD_DB_URL,
      max: 2,
    }) as ProdPool
    pool = prodPool

    const [localLatestMessage] = await db
      .select({ timestamp: messages.timestamp })
      .from(messages)
      .where(eq(messages.coupleId, state.coupleId))
      .orderBy(desc(messages.timestamp))
      .limit(1)

    // Find the prod couple that contains the same user (by matching session user's email)
    const localUser = await db.query.users.findFirst({
      where: eq(users.id, state.userId),
      columns: { email: true },
    })
    if (!localUser) return

    // Look up the user in prod by email, then find their couple
    const { rows: prodUsers } = await prodPool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [localUser.email],
    )
    if (prodUsers.length === 0) return

    const prodUserId = prodUsers[0].id
    const { rows: prodCouples } = await prodPool.query(
      'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND status = $2 LIMIT 1',
      [prodUserId, 'active'],
    )
    if (prodCouples.length === 0) return

    const prodCoupleId = prodCouples[0].id

    const prodMessagesQuery =
      mode === 'full' || !localLatestMessage
        ? {
            text: 'SELECT * FROM messages WHERE couple_id = $1 ORDER BY timestamp ASC',
            values: [prodCoupleId],
          }
        : {
            // Re-fetch the last known second so same-timestamp messages are not missed.
            text: 'SELECT * FROM messages WHERE couple_id = $1 AND timestamp >= $2 ORDER BY timestamp ASC',
            values: [prodCoupleId, localLatestMessage.timestamp],
          }
    const { rows } = await prodPool.query(
      prodMessagesQuery.text,
      prodMessagesQuery.values,
    )

    // Build a sender mapping: prod user IDs → local user IDs
    const { rows: prodCoupleUsers } = await prodPool.query(
      'SELECT id, email FROM users WHERE id IN (SELECT user_a_id FROM couples WHERE id = $1 UNION SELECT user_b_id FROM couples WHERE id = $1)',
      [prodCoupleId],
    )
    const localPartner = await db.query.users.findFirst({
      where: eq(users.id, state.partnerId),
      columns: { id: true, email: true },
    })

    const senderMap = new Map<string, string>()
    for (const pu of prodCoupleUsers) {
      if (pu.email === localUser.email) {
        senderMap.set(pu.id, state.userId)
      } else if (localPartner && pu.email === localPartner.email) {
        senderMap.set(pu.id, state.partnerId)
      }
    }

    let inserted = 0
    for (const m of rows) {
      const localSenderId = senderMap.get(m.sender_id)
      if (!localSenderId) continue
      try {
        const result = await db.insert(messages)
          .values({
            coupleId: state.coupleId,
            waMessageId: m.wa_message_id,
            senderId: localSenderId,
            text: m.text,
            timestamp: m.timestamp,
            sentiment: m.sentiment,
            isMedia: m.is_media,
            mediaType: m.media_type,
            thumbnail: m.thumbnail,
            source: m.source,
          })
          .onConflictDoNothing()
        inserted += result.rowCount ?? 0
      } catch { /* skip */ }
    }

    if (inserted > 0) {
      console.log(
        `[ws/chat] synced ${inserted} ${mode} messages from prod for couple ${state.coupleId.slice(0, 8)}`,
      )
      handleLoadHistory(peer, state, { limit: 50 })
    }
  } catch (err) {
    console.error('[ws/chat] prod sync failed:', err)
  } finally {
    if (pool) {
      await pool.end().catch(() => {})
    }
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
        mediaType: messages.mediaType,
        thumbnail: messages.thumbnail,
        waMessageId: messages.waMessageId,
      })
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.timestamp))
      .limit(limit)

    // Filter out empty messages (media-only / protocol messages with no text)
    const mapped = rows
      .filter((m) => m.text || m.isMedia)
      .map((m) => ({
        id: m.id,
        sender: m.senderId === state.userId ? 'You' : state.partnerName,
        text: m.text,
        timestamp: m.timestamp,
        fromMe: m.senderId === state.userId,
        isMedia: m.isMedia,
        mediaType: m.mediaType,
        thumbnail: m.thumbnail,
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

      // Look up WA session + partner name in parallel
      const partnerId = couple.userAId === userId ? couple.userBId : couple.userAId
      const [waSessionResult, partnerResult] = await Promise.all([
        db
          .select({ bridgeSessionId: waSessions.bridgeSessionId })
          .from(waSessions)
          .where(eq(waSessions.userId, userId)),
        db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, partnerId)),
      ])

      const waSession = waSessionResult[0]
      if (!waSession) {
        sendToPeer(peer, { type: 'error', message: 'No WhatsApp session found' })
        peer.close(4404, 'No WhatsApp session')
        return
      }

      const partnerName = partnerResult[0]?.name ?? 'Partner'

      // ── Store peer state ──────────────────────────────────────
      const state: PeerState = {
        upstream: null,
        coupleId: couple.id,
        sessionId: waSession.bridgeSessionId,
        userId,
        partnerId,
        partnerJid: couple.whatsappJid ?? null,
        partnerName,
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

      // ── Sync from prod DB if local is empty ──
      syncMessagesFromProd(peer, state, 'incremental')
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

        case 'resync':
          // Inject partnerJid from server state if client didn't provide one
          if (!parsed.jid && state.partnerJid) {
            parsed.jid = state.partnerJid
          }
          if (
            state.upstream &&
            state.upstream.readyState === WebSocket.OPEN &&
            parsed.jid
          ) {
            state.upstream.send(JSON.stringify(parsed))
          } else {
            sendToPeer(peer, { type: 'resync-error', error: 'No partner JID or bridge not connected' })
          }
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
