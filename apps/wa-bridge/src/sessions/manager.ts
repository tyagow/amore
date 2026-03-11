import makeWASocket, {
  BufferJSON,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  proto,
  type WAMessage,
  type WAMessageKey,
  type WASocket,
} from '@whiskeysockets/baileys'
import {
  normalizeMessage,
  persistMessages,
  handleMessageRevoke,
  getOldestMessage,
  getMediaType,
  type NormalizedMessage,
} from '../messages/ingest.js'
import { downloadAndStoreMedia } from '../messages/media.js'
import { Boom } from '@hapi/boom'
import { Pool } from 'pg'
import { EventEmitter } from 'events'
import { usePostgresAuthState } from './store.js'
import { log } from '../logger.js'

const baileysLogger = log.child({ component: 'baileys' })
baileysLogger.level = 'warn'

export interface WaContact {
  jid: string
  name?: string       // from contacts.notify or contacts.name
  pushName?: string   // from pushName
  phone: string       // extracted from JID
  conversationTimestamp?: number  // for sorting by recency
}

/** Resolved sender pair for a couple binding */
interface CoupleBinding {
  coupleId: string
  connectedUserId: string  // The user who connected the bridge (fromMe = this user)
  partnerUserId: string    // The other user in the couple
}

interface SessionInfo {
  socket: WASocket
  status: 'connecting' | 'open' | 'closed' | 'qr'
  qr?: string
  retryCount: number
  contacts: Map<string, WaContact>    // collected from Baileys events
  jidBindings: Map<string, CoupleBinding>    // JID → CoupleBinding (multiple partners per session)
  historyMessages: Map<string, proto.IWebMessageInfo[]>  // JID → buffered history messages
  connectedUserId: string  // The user who initiated this session
}

const MAX_RETRIES = 10
const BASE_DELAY_MS = 3_000
const MAX_DELAY_MS = 300_000
const MAX_HISTORY_MESSAGES_PER_JID = 1_000
const MAX_TOTAL_HISTORY_MESSAGES = 5_000

function isPersonalJid(jid: string): boolean {
  return !jid.endsWith('@g.us') && jid !== 'status@broadcast'
}

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, SessionInfo>()
  private reconnectTimers = new Map<string, NodeJS.Timeout>()
  private pendingResyncs = new Map<string, { sessionId: string; jid: string; coupleId: string; timer: NodeJS.Timeout }>()
  private manualRestarts = new Set<string>()
  private pool: Pool

  constructor(pool: Pool) {
    super()
    this.pool = pool
  }

  async createSession(sessionId: string): Promise<void> {
    const existing = this.sessions.get(sessionId)
    if (existing && existing.status !== 'closed') {
      throw new Error(`Session ${sessionId} already exists`)
    }

    // sessionId = userId in the one-session-per-user model
    const connectedUserId = sessionId

    // Restore JID bindings from DB on restart
    const restoredBindings = new Map<string, CoupleBinding>()
    if (!existing || existing.jidBindings.size === 0) {
      try {
        // Query couples where this user is either userA or userB and whatsapp_jid is set
        const result = await this.pool.query(
          `SELECT id AS couple_id, user_a_id, user_b_id, whatsapp_jid
           FROM couples
           WHERE (user_a_id = $1 OR user_b_id = $1)
             AND whatsapp_jid IS NOT NULL
             AND status = 'active'`,
          [connectedUserId]
        )
        for (const row of result.rows) {
          const partnerUserId = row.user_a_id === connectedUserId ? row.user_b_id : row.user_a_id
          restoredBindings.set(row.whatsapp_jid, {
            coupleId: row.couple_id,
            connectedUserId,
            partnerUserId,
          })
          log.info({ sessionId, jid: row.whatsapp_jid, coupleId: row.couple_id, partnerUserId }, 'Restored JID binding from DB')
        }
        if (result.rows.length === 0) {
          log.warn({ sessionId, connectedUserId }, 'No JID bindings found in DB — messages from partners will NOT be persisted')
        }
      } catch (err) {
        log.error({ err, sessionId }, 'Failed to restore JID bindings')
      }
    }

    const { state, saveCreds } = await usePostgresAuthState(this.pool, sessionId)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger: baileysLogger.child({ session: sessionId }),
      browser: Browsers.macOS('Desktop'),
      auth: {
        creds: state.creds,
        keys: state.keys,
      },
      syncFullHistory: true,
      markOnlineOnConnect: false,
      getMessage: async (key: WAMessageKey): Promise<proto.IMessage | undefined> => {
        try {
          const result = await this.pool.query(
            'SELECT value FROM wa_auth_keys WHERE session_id = $1 AND type = $2 AND id = $3',
            [sessionId, 'message', key.id],
          )
          if (result.rows.length > 0) {
            return JSON.parse(JSON.stringify(result.rows[0].value), BufferJSON.reviver)
          }
          return undefined
        } catch {
          return undefined
        }
      },
    })

    const retryCount = existing?.retryCount ?? 0
    const existingBindings = existing?.jidBindings ?? new Map<string, CoupleBinding>()
    // Merge restored bindings (don't overwrite existing in-memory bindings)
    for (const [jid, binding] of restoredBindings) {
      if (!existingBindings.has(jid)) {
        existingBindings.set(jid, binding)
      }
    }
    const session: SessionInfo = {
      socket: sock,
      status: 'connecting',
      retryCount,
      contacts: existing?.contacts ?? new Map(),
      jidBindings: existingBindings,
      historyMessages: existing?.historyMessages ?? new Map(),
      connectedUserId,
    }
    this.sessions.set(sessionId, session)

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        session.status = 'qr'
        session.qr = qr
        this.emit('qr', { sessionId, qr })
      }

      if (connection === 'open') {
        session.status = 'open'
        session.qr = undefined
        session.retryCount = 0
        this.emit('connected', { sessionId, user: sock.user })
      }

      if (connection === 'close') {
        if (this.manualRestarts.delete(sessionId)) {
          session.status = 'closed'
          log.info({ sessionId }, 'Session closed for manual restart')
          return
        }

        session.status = 'closed'
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const currentRetryCount = session.retryCount

        if (statusCode === DisconnectReason.loggedOut) {
          this.sessions.delete(sessionId)
          this.emit('logged-out', { sessionId })
        } else if (currentRetryCount >= MAX_RETRIES) {
          this.sessions.delete(sessionId)
          this.emit('reconnect-failed', { sessionId, retryCount: currentRetryCount })
        } else {
          const nextRetry = currentRetryCount + 1
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, nextRetry - 1), MAX_DELAY_MS)
          session.retryCount = nextRetry
          this.emit('reconnecting', { sessionId, statusCode, retry: nextRetry, delay })
          // Keep session in map so retryCount persists through reconnection
          const timer = setTimeout(() => {
            this.reconnectTimers.delete(sessionId)
            this.createSession(sessionId)
          }, delay)
          this.reconnectTimers.set(sessionId, timer)
        }
      }
    })

    sock.ev.on('creds.update', saveCreds)

    // Collect contacts from Baileys sync events
    sock.ev.on('messaging-history.set', ({ contacts: syncContacts, chats, messages: historyMsgs, syncType, peerDataRequestSessionId }) => {
      log.info({ sessionId, contactCount: syncContacts?.length ?? 0, chatCount: chats?.length ?? 0, msgCount: historyMsgs?.length ?? 0, syncType }, 'messaging-history.set')

      // Handle ON_DEMAND resync responses
      if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND && peerDataRequestSessionId) {
        const pending = this.pendingResyncs.get(peerDataRequestSessionId)
        if (pending) {
          clearTimeout(pending.timer)
          this.pendingResyncs.delete(peerDataRequestSessionId)
          const binding = session.jidBindings.get(pending.jid)
          if (historyMsgs && historyMsgs.length > 0 && binding) {
            this.normalizeAndPersist(historyMsgs, pending.sessionId, binding)
              .then(() => {
                this.emit('resync-complete', { sessionId: pending.sessionId, jid: pending.jid, coupleId: pending.coupleId, count: historyMsgs.length })
              })
              .catch((err) => {
                log.error({ err, sessionId: pending.sessionId, coupleId: pending.coupleId }, 'Resync persist failed')
                this.emit('resync-complete', { sessionId: pending.sessionId, jid: pending.jid, coupleId: pending.coupleId, count: 0 })
              })
          } else {
            this.emit('resync-complete', { sessionId: pending.sessionId, jid: pending.jid, coupleId: pending.coupleId, count: 0 })
          }
          return
        }
      }
      if (syncContacts) {
        for (const c of syncContacts) {
          this.mergeContact(session.contacts, c)
        }
      }
      // Merge chat timestamps for recency sorting
      if (chats) {
        for (const chat of chats) {
          if (!chat.id || !isPersonalJid(chat.id)) continue
          const existing = session.contacts.get(chat.id)
          const ts = typeof chat.conversationTimestamp === 'number'
            ? chat.conversationTimestamp
            : Number(chat.conversationTimestamp)
          if (existing) {
            existing.conversationTimestamp = ts ?? existing.conversationTimestamp
          } else {
            session.contacts.set(chat.id, {
              jid: chat.id,
              phone: chat.id.split('@')[0],
              conversationTimestamp: ts || undefined,
            })
          }
        }
      }
      // Buffer or persist history messages per JID (1:1 chats only)
      if (historyMsgs) {
        let buffered = 0
        let totalBuffered = 0
        for (const buckets of session.historyMessages.values()) totalBuffered += buckets.length

        // Group messages by JID
        const byJid = new Map<string, proto.IWebMessageInfo[]>()
        for (const msg of historyMsgs) {
          const jid = msg.key?.remoteJid
          if (!jid || !isPersonalJid(jid)) continue
          if (!msg.message || !msg.key?.id) continue
          if (!byJid.has(jid)) byJid.set(jid, [])
          byJid.get(jid)!.push(msg)
        }

        for (const [jid, msgs] of byJid) {
          // Already-bound JIDs: persist directly instead of buffering
          const binding = session.jidBindings.get(jid)
          if (binding) {
            this.normalizeAndPersist(msgs, sessionId, binding)
            continue
          }

          // Unbound JIDs: buffer for later flush on contact pick
          let bucket = session.historyMessages.get(jid)
          if (!bucket) {
            bucket = []
            session.historyMessages.set(jid, bucket)
          }
          for (const msg of msgs) {
            if (bucket.length >= MAX_HISTORY_MESSAGES_PER_JID) break
            if (totalBuffered >= MAX_TOTAL_HISTORY_MESSAGES) break
            bucket.push(msg)
            buffered++
            totalBuffered++
          }
        }
        if (buffered > 0) {
          log.info({ sessionId, buffered, jidCount: session.historyMessages.size }, 'Buffered history messages')
        }
      }

      log.info({ sessionId, totalContacts: session.contacts.size }, 'Contacts after history sync')
      this.emit('contacts-updated', { sessionId })
    })

    sock.ev.on('contacts.upsert', (contacts) => {
      log.info({ sessionId, count: contacts.length }, 'contacts.upsert')
      for (const c of contacts) {
        this.mergeContact(session.contacts, c)
      }
      log.info({ sessionId, totalContacts: session.contacts.size }, 'Contacts updated')
      this.emit('contacts-updated', { sessionId })
    })

    sock.ev.on('contacts.update', (updates) => {
      for (const u of updates) {
        if (!u.id) continue
        const existing = session.contacts.get(u.id)
        if (existing && u.notify) {
          existing.name = u.notify
        }
      }
    })

    // Track message delivery and read receipts
    sock.ev.on('message-receipt.update', (updates) => {
      log.info({ sessionId, count: updates.length }, 'message-receipt.update')
      for (const update of updates) {
        const { key, receipt } = update
        if (!key.id || !key.fromMe) continue // Only track receipts for our sent messages

        let status: 'delivered' | 'read' | null = null
        if (receipt.readTimestamp) {
          status = 'read'
        } else if (receipt.receiptTimestamp) {
          status = 'delivered'
        }

        if (status && key.remoteJid) {
          this.emit('message-receipt', {
            sessionId,
            waMessageId: key.id,
            jid: key.remoteJid,
            status,
          })
        }
      }
    })

    sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
      // Bypass pino redaction by embedding JIDs in the message string
      const jidList = msgs.map(m => m.key.remoteJid).filter(Boolean).join(', ')
      log.info({ sessionId, count: msgs.length, type }, `messages.upsert jids=[${jidList}]`)
      if (type !== 'notify') return

      // Cache messages for getMessage retrieval (best-effort)
      for (const msg of msgs) {
        if (msg.key.id && msg.message) {
          const jsonStr = JSON.stringify(msg.message, BufferJSON.replacer)
          this.pool.query(
            `INSERT INTO wa_auth_keys (session_id, type, id, value) VALUES ($1, $2, $3, $4::jsonb)
             ON CONFLICT (session_id, type, id) DO UPDATE SET value = $4::jsonb`,
            [sessionId, 'message', msg.key.id, jsonStr],
          ).catch(() => { /* best-effort caching */ })
        }
      }

      // Split into incoming and sent messages
      const incomingMsgs = msgs.filter(m => !m.key.fromMe)
      const sentMsgs = msgs.filter(m => m.key.fromMe)

      // Broadcast incoming messages for real-time display
      if (incomingMsgs.length > 0) {
        this.emit('message', { sessionId, messages: incomingMsgs, type })
      }

      // Emit sent confirmations via Baileys echo — serves as backup
      // when the direct WS `sent` response is lost (e.g. bridge restart)
      for (const m of sentMsgs) {
        if (m.key.id && m.key.remoteJid) {
          this.emit('sent-echo', { sessionId, waMessageId: m.key.id, jid: m.key.remoteJid })
        }
      }

      // Persist messages to the messages table (only for bound contacts)
      if (session.jidBindings.size > 0) {
        // Group messages by couple via JID binding lookup
        const byCouple = new Map<string, { binding: CoupleBinding; msgs: proto.IWebMessageInfo[] }>()
        for (const msg of msgs) {
          const jid = msg.key.remoteJid
          if (!jid) continue
          const binding = session.jidBindings.get(jid)
          if (!binding) {
            // CRITICAL: log at info level so we can see what JIDs are being skipped
            // Bypass pino redaction by using plain string interpolation
            log.info({ sessionId, fromMe: msg.key.fromMe, bindingCount: session.jidBindings.size }, `Skipping message from unbound JID: ${jid} (bound: ${[...session.jidBindings.keys()].join(', ')})`)
            continue
          }

          // Handle revocations
          const revoked = msg.message?.protocolMessage
          if (
            revoked?.type === proto.Message.ProtocolMessage.Type.REVOKE &&
            revoked.key?.id
          ) {
            await handleMessageRevoke(binding.coupleId, revoked.key.id)
              .catch((err) => log.error({ err, sessionId }, 'Message revoke failed'))
            continue
          }

          if (!byCouple.has(binding.coupleId)) {
            byCouple.set(binding.coupleId, { binding, msgs: [] })
          }
          byCouple.get(binding.coupleId)!.msgs.push(msg)
        }

        // Normalize + persist per couple group (parallel)
        await Promise.all([...byCouple].map(([, { binding, msgs: coupleMsgs }]) =>
          this.normalizeAndPersist(coupleMsgs, sessionId, binding)
        ))
      }
    })
  }

  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId)
  }

  getContacts(sessionId: string): WaContact[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    const contacts = Array.from(session.contacts.values())
    // Sort: most recent conversation first, then alphabetical by name
    return contacts.sort((a, b) => {
      if (a.conversationTimestamp && b.conversationTimestamp) {
        return b.conversationTimestamp - a.conversationTimestamp
      }
      if (a.conversationTimestamp) return -1
      if (b.conversationTimestamp) return 1
      const nameA = a.name || a.pushName || a.phone
      const nameB = b.name || b.pushName || b.phone
      return nameA.localeCompare(nameB)
    })
  }

  getCoupleId(sessionId: string, jid: string): string | undefined {
    return this.sessions.get(sessionId)?.jidBindings.get(jid)?.coupleId
  }

  private mergeContact(
    contacts: Map<string, WaContact>,
    c: { id?: string; notify?: string; name?: string },
  ): void {
    if (!c.id || !isPersonalJid(c.id)) return
    const existing = contacts.get(c.id)
    contacts.set(c.id, {
      jid: c.id,
      name: c.notify || c.name || existing?.name,
      pushName: existing?.pushName,
      phone: c.id.split('@')[0],
      conversationTimestamp: existing?.conversationTimestamp,
    })
  }

  private async normalizeAndPersist(
    msgs: proto.IWebMessageInfo[],
    sessionId: string,
    binding: CoupleBinding,
  ): Promise<void> {
    const normalized = msgs
      .map((msg) => normalizeMessage(msg, binding.coupleId, binding.connectedUserId, binding.partnerUserId))
      .filter((m): m is NormalizedMessage => m !== null)

    if (normalized.length > 0) {
      const count = await persistMessages(normalized)
        .catch((err) => { log.error({ err, sessionId, coupleId: binding.coupleId }, 'Message persist failed'); return 0 })
      if (count > 0) {
        log.info({ sessionId, coupleId: binding.coupleId, count }, 'Messages persisted')
        this.emit('messages-persisted', { sessionId, coupleId: binding.coupleId, count })
      }
    }

    // Fire-and-forget: download and store media for media messages
    const session = this.sessions.get(sessionId)
    if (session) {
      for (const msg of msgs) {
        const mediaType = msg.message ? getMediaType(msg.message) : null
        if (mediaType) {
          downloadAndStoreMedia(msg as WAMessage, binding.coupleId, session.socket)
            .catch(() => { /* already logged inside */ })
        }
      }
    }
  }

  /**
   * Bind a WhatsApp JID to a couple.
   *
   * @param sessionId - The bridge session (= userId of the connected user)
   * @param jid - The WhatsApp JID of the partner's chat
   * @param coupleId - The couple ID to bind to
   * @param partnerUserId - The user ID of the partner in this couple
   */
  async addBinding(sessionId: string, jid: string, coupleId: string, partnerUserId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    const binding: CoupleBinding = {
      coupleId,
      connectedUserId: session.connectedUserId,
      partnerUserId,
    }
    session.jidBindings.set(jid, binding)

    // Flush buffered history messages for this JID
    const buffered = session.historyMessages.get(jid)
    if (buffered && buffered.length > 0) {
      log.info({ sessionId, jid, count: buffered.length }, 'Flushing buffered history messages')
      await this.normalizeAndPersist(buffered, sessionId, binding)
      session.historyMessages.delete(jid)
    }
  }

  async sendMessage(sessionId: string, jid: string, text: string): Promise<{ id: string; timestamp: number }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }
    if (session.status !== 'open') {
      throw new Error(`Session ${sessionId} is not connected (status: ${session.status})`)
    }
    const binding = session.jidBindings.get(jid)
    if (!binding) {
      throw new Error(`JID ${jid} is not bound to any couple in session ${sessionId}`)
    }

    try {
      const result = await session.socket.sendMessage(jid, { text })
      if (!result?.key?.id) {
        throw new Error('Send succeeded but no message ID was returned')
      }
      const timestamp = typeof result.messageTimestamp === 'number'
        ? result.messageTimestamp
        : Number(result.messageTimestamp) || Math.floor(Date.now() / 1000)

      // Persist sent message directly — don't rely on the Baileys echo
      // which may be lost on reconnect. onConflictDoNothing makes this idempotent.
      persistMessages([{
        coupleId: binding.coupleId,
        waMessageId: result.key.id,
        senderId: binding.connectedUserId,
        text,
        timestamp: new Date(timestamp * 1000),
        isMedia: false,
        mediaType: null,
        thumbnail: null,
        source: 'baileys',
      }]).catch((err) => log.error({ err, sessionId, jid }, 'Failed to persist sent message'))

      return { id: result.key.id, timestamp }
    } catch (err) {
      if (err instanceof Error && err.message.includes('not bound')) throw err
      const message = err instanceof Error ? err.message : 'Unknown error sending message'
      log.error({ err, sessionId, jid }, 'Failed to send WhatsApp message')
      throw new Error(`Failed to send message: ${message}`)
    }
  }

  async resyncMessages(sessionId: string, jid: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (session.status !== 'open') throw new Error(`Session ${sessionId} is not connected (status: ${session.status})`)

    const binding = session.jidBindings.get(jid)
    if (!binding) throw new Error(`JID ${jid} is not bound to any couple in session ${sessionId}`)

    const oldest = await getOldestMessage(binding.coupleId, binding.connectedUserId)
    if (!oldest) throw new Error('No messages found for this couple — nothing to resync from')

    const oldestMsgKey: WAMessageKey = {
      remoteJid: jid,
      id: oldest.waMessageId!,
      fromMe: oldest.fromMe,
    }

    const requestId = await session.socket.fetchMessageHistory(50, oldestMsgKey, Math.floor(oldest.timestampMs / 1000))
    const timer = setTimeout(() => {
      if (this.pendingResyncs.delete(requestId)) {
        log.warn({ sessionId, jid, requestId }, 'Resync timed out')
        this.emit('resync-complete', { sessionId, jid, coupleId: binding.coupleId, count: 0 })
      }
    }, 60_000)
    this.pendingResyncs.set(requestId, { sessionId, jid, coupleId: binding.coupleId, timer })
    log.info({ sessionId, jid, coupleId: binding.coupleId, requestId }, 'Resync requested')
    return requestId
  }

  async restartSession(sessionId: string): Promise<void> {
    const reconnectTimer = this.reconnectTimers.get(sessionId)
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      this.reconnectTimers.delete(sessionId)
    }

    const session = this.sessions.get(sessionId)
    if (session) {
      this.manualRestarts.add(sessionId)
      session.status = 'closed'
      session.socket.end(undefined)
    }

    await this.createSession(sessionId)
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Cancel any pending reconnection timer
    const timer = this.reconnectTimers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(sessionId)
    }

    const session = this.sessions.get(sessionId)
    if (session) {
      session.historyMessages.clear()
      session.socket.end(undefined)
      this.sessions.delete(sessionId)
    }
    // Clean up any pending resyncs for this session
    for (const [reqId, pending] of this.pendingResyncs) {
      if (pending.sessionId === sessionId) {
        clearTimeout(pending.timer)
        this.pendingResyncs.delete(reqId)
      }
    }
    await Promise.all([
      this.pool.query('DELETE FROM wa_auth_creds WHERE session_id = $1', [sessionId]),
      this.pool.query('DELETE FROM wa_auth_keys WHERE session_id = $1', [sessionId]),
    ])
  }

  async shutdown(): Promise<void> {
    // Cancel all reconnection timers
    for (const [, timer] of this.reconnectTimers) {
      clearTimeout(timer)
    }
    this.reconnectTimers.clear()
    // Cancel all pending resyncs
    for (const [, pending] of this.pendingResyncs) {
      clearTimeout(pending.timer)
    }
    this.pendingResyncs.clear()

    // Close all Baileys sockets
    for (const [, session] of this.sessions) {
      session.historyMessages.clear()
      session.socket.end(undefined)
    }
    this.sessions.clear()
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys())
  }
}
