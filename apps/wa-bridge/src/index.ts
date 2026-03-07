import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { WebSocketServer, WebSocket } from 'ws'
import { Pool } from 'pg'
import { SessionManager } from './sessions/manager.js'
import { extractMessageText } from './messages/ingest.js'
import { log } from './logger.js'

// Validate required env vars
const WA_BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET
if (!WA_BRIDGE_SECRET) {
  log.fatal('WA_BRIDGE_SECRET environment variable is required')
  process.exit(1)
}

const PORT = parseInt(process.env.PORT || process.env.WA_BRIDGE_PORT || '9945')
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:9941'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const manager = new SessionManager(pool)

const app = new Hono()

// CORS middleware
app.use(
  '*',
  cors({
    origin: WEB_APP_URL,
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Health endpoint (unprotected, before auth middleware)
app.get('/health', (c) => c.json({ ok: true }))

// Bearer token auth on all /sessions routes
app.use('/sessions/*', bearerAuth({ token: WA_BRIDGE_SECRET }))
app.use('/sessions', bearerAuth({ token: WA_BRIDGE_SECRET }))

// Track cumulative persisted message counts per couple
const messageCounts = new Map<string, number>()

manager.on('messages-persisted', ({ sessionId, coupleId, count }: { sessionId: string; coupleId: string; count: number }) => {
  messageCounts.set(coupleId, (messageCounts.get(coupleId) ?? 0) + count)
  broadcast(sessionId, { type: 'messages-persisted', data: { coupleId, count, total: messageCounts.get(coupleId) ?? 0 } })
})

// WebSocket clients per session
const wsClients = new Map<string, Set<WebSocket>>()

function broadcast(sessionId: string, data: unknown) {
  const clients = wsClients.get(sessionId)
  if (!clients) return
  const json = JSON.stringify(data)
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json)
    } else {
      clients.delete(ws)
    }
  }
  if (clients.size === 0) wsClients.delete(sessionId)
}

// Forward Baileys events to WebSocket clients
manager.on('qr', ({ sessionId, qr }) => {
  broadcast(sessionId, { type: 'qr', data: qr })
})

manager.on('connected', ({ sessionId, user }) => {
  broadcast(sessionId, { type: 'connected', data: { user } })
})

manager.on('message', ({ sessionId, messages }) => {
  for (const msg of messages) {
    broadcast(sessionId, {
      type: 'message',
      data: {
        key: msg.key,
        pushName: msg.pushName,
        text: msg.message ? extractMessageText(msg.message) : null,
        timestamp: msg.messageTimestamp,
        fromMe: msg.key.fromMe,
      },
    })
  }
})

manager.on('logged-out', ({ sessionId }) => {
  broadcast(sessionId, { type: 'logged-out' })
})

manager.on('reconnecting', ({ sessionId, statusCode }) => {
  broadcast(sessionId, { type: 'reconnecting', data: { statusCode } })
})

manager.on('reconnect-failed', ({ sessionId, retryCount }) => {
  broadcast(sessionId, { type: 'reconnect-failed', data: { retryCount } })
})

manager.on('resync-complete', ({ sessionId, jid, coupleId, count }) => {
  broadcast(sessionId, { type: 'resync-complete', data: { jid, coupleId, count } })
})

manager.on('sent-echo', ({ sessionId, waMessageId, jid }) => {
  broadcast(sessionId, { type: 'sent-echo', waMessageId, jid })
})

manager.on('message-receipt', ({ sessionId, waMessageId, jid, status }) => {
  broadcast(sessionId, { type: 'message-receipt', waMessageId, jid, status })
})

// REST API
app.post('/sessions', async (c) => {
  try {
    const body = await c.req.json()
    const { sessionId } = body

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return c.json({ error: 'sessionId is required and must be a string' }, 400)
    }
    if (sessionId.length > 100) {
      return c.json({ error: 'sessionId must be 100 characters or fewer' }, 400)
    }

    await manager.createSession(sessionId)
    return c.json({ status: 'connecting' })
  } catch (err) {
    if (err instanceof Error && err.message.includes('already exists')) {
      return c.json({ error: err.message }, 409)
    }
    log.error({ err }, 'POST /sessions failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

const externalStatus: Record<string, string> = {
  open: 'connected',
  closed: 'disconnected',
  qr: 'connecting',
}

app.get('/sessions/:id', (c) => {
  try {
    const id = c.req.param('id')
    const session = manager.getSession(id)
    if (!session) return c.json({ status: 'disconnected', messageCount: 0 })
    // Sum message counts across all couple bindings for this session
    let totalMessages = 0
    if (session.jidBindings) {
      for (const binding of session.jidBindings.values()) {
        totalMessages += messageCounts.get(binding.coupleId) ?? 0
      }
    }
    return c.json({
      status: externalStatus[session.status] ?? session.status,
      qr: session.qr,
      messageCount: totalMessages,
    })
  } catch (err) {
    log.error({ err }, 'GET /sessions/:id failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/sessions/:id/contacts', (c) => {
  try {
    const id = c.req.param('id')
    const contacts = manager.getContacts(id)
    return c.json({ contacts })
  } catch (err) {
    log.error({ err }, 'GET /sessions/:id/contacts failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/sessions/:id/contact', async (c) => {
  try {
    const id = c.req.param('id')
    const { contactJid, coupleId, partnerUserId } = await c.req.json()

    if (!contactJid || typeof contactJid !== 'string') {
      return c.json({ error: 'contactJid is required' }, 400)
    }
    if (!coupleId || typeof coupleId !== 'string') {
      return c.json({ error: 'coupleId is required' }, 400)
    }
    if (!partnerUserId || typeof partnerUserId !== 'string') {
      return c.json({ error: 'partnerUserId is required' }, 400)
    }

    await manager.addBinding(id, contactJid, coupleId, partnerUserId)
    return c.json({ status: 'ok' })
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      return c.json({ error: err.message }, 404)
    }
    log.error({ err }, 'POST /sessions/:id/contact failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/sessions/:id/send', async (c) => {
  try {
    const sessionId = c.req.param('id')
    const body = await c.req.json()
    const { jid, text } = body

    if (!jid || typeof jid !== 'string') {
      return c.json({ error: 'jid is required and must be a string' }, 400)
    }
    if (!text || typeof text !== 'string') {
      return c.json({ error: 'text is required and must be a string' }, 400)
    }

    const result = await manager.sendMessage(sessionId, jid, text)
    return c.json({ id: result.id, timestamp: result.timestamp })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return c.json({ error: err.message }, 404)
      }
      if (err.message.includes('not connected') || err.message.includes('not bound')) {
        return c.json({ error: err.message }, 400)
      }
    }
    log.error({ err }, 'POST /sessions/:id/send failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.delete('/sessions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    // Clean up message counts for all couple bindings before deleting session
    const session = manager.getSession(id)
    if (session?.jidBindings) {
      for (const binding of session.jidBindings.values()) {
        messageCounts.delete(binding.coupleId)
      }
    }
    await manager.deleteSession(id)
    return c.json({ status: 'deleted' })
  } catch (err) {
    log.error({ err }, 'DELETE /sessions/:id failed')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Start HTTP server
const server = serve({ fetch: app.fetch, port: PORT }, async () => {
  log.info({ port: PORT }, 'WA Bridge started')

  // Auto-restore sessions that were connected before restart
  try {
    const result = await pool.query(
      `SELECT bridge_session_id FROM wa_sessions WHERE status != 'disconnected'`
    )
    for (const row of result.rows) {
      const sid = row.bridge_session_id as string
      log.info({ sessionId: sid }, 'Restoring session')
      try {
        await manager.createSession(sid)
      } catch (err) {
        log.error({ err, sessionId: sid }, 'Failed to restore session')
      }
    }
    if (result.rows.length > 0) {
      log.info({ count: result.rows.length }, 'Session restore complete')
    }
  } catch (err) {
    log.error({ err }, 'Failed to query sessions for restore')
  }
})

// WebSocket server on same port
const wss = new WebSocketServer({ server: server as any })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const sessionId = url.searchParams.get('sessionId')
  const token = url.searchParams.get('token')

  // Authenticate WebSocket connection
  if (token !== WA_BRIDGE_SECRET) {
    ws.close(4003, 'Invalid or missing token')
    return
  }

  if (!sessionId) {
    ws.close(4001, 'Missing sessionId')
    return
  }

  if (!wsClients.has(sessionId)) {
    wsClients.set(sessionId, new Set())
  }
  wsClients.get(sessionId)!.add(ws)

  ws.on('message', async (raw) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }))
      return
    }

    switch (msg.type) {
      case 'send': {
        const { jid, text } = msg
        if (!jid || typeof jid !== 'string' || !text || typeof text !== 'string') {
          ws.send(JSON.stringify({ type: 'send-error', error: 'jid and text are required strings' }))
          return
        }
        try {
          const result = await manager.sendMessage(sessionId, jid, text)
          ws.send(JSON.stringify({ type: 'sent', id: result.id, timestamp: result.timestamp, clientId: msg.clientId }))
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to send message'
          ws.send(JSON.stringify({ type: 'send-error', error, clientId: msg.clientId }))
        }
        break
      }
      case 'resync': {
        const jid = msg.jid
        if (!jid || typeof jid !== 'string') {
          ws.send(JSON.stringify({ type: 'resync-error', error: 'jid is required and must be a string' }))
          return
        }
        try {
          await manager.resyncMessages(sessionId, jid)
          ws.send(JSON.stringify({ type: 'resync-started' }))
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to start resync'
          ws.send(JSON.stringify({ type: 'resync-error', error }))
        }
        break
      }
    }
  })

  ws.on('close', () => {
    wsClients.get(sessionId)?.delete(ws)
  })
})

// Graceful shutdown
async function shutdown(signal: string) {
  log.info({ signal }, 'Shutting down gracefully')

  // Close WebSocket clients
  for (const [, clients] of wsClients) {
    for (const ws of clients) {
      ws.close(1001, 'Server shutting down')
    }
  }
  wsClients.clear()

  // Close all Baileys sessions
  await manager.shutdown()

  // Close WebSocket server
  wss.close()

  // Drain database pool
  await pool.end()

  log.info('Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
