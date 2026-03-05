import { db } from '@amore-couples/db/client'
import { messages } from '@amore-couples/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { proto } from '@whiskeysockets/baileys'

export interface NormalizedMessage {
  coupleId: string
  waMessageId: string
  senderId: string   // Real user ID FK (not a display name)
  text: string | null
  timestamp: Date
  isMedia: boolean
  source: 'baileys'
}

export function extractMessageText(msg: proto.IMessage): string | null {
  return msg.conversation || msg.extendedTextMessage?.text || null
}

/**
 * Normalize a Baileys message into the couples schema format.
 *
 * @param msg - Raw Baileys message
 * @param coupleId - The couple this conversation belongs to
 * @param connectedUserId - The user ID of whoever connected the WhatsApp bridge
 *
 * `fromMe` means the message was sent by the phone that's logged in (i.e. connectedUserId).
 * The other sender is the partner, resolved from the couple record.
 */
export function normalizeMessage(
  msg: proto.IWebMessageInfo,
  coupleId: string,
  connectedUserId: string,
  partnerUserId: string,
): NormalizedMessage | null {
  const key = msg.key
  if (!key) return null

  // Skip group messages
  if (key.remoteJid?.endsWith('@g.us')) return null
  // Skip status broadcasts
  if (key.remoteJid === 'status@broadcast') return null
  // Skip if no message content or no message ID
  if (!msg.message || !key.id) return null

  // fromMe = sent by the connected phone owner = connectedUserId
  const senderId = key.fromMe ? connectedUserId : partnerUserId

  const text = extractMessageText(msg.message)

  const isMedia = !!(
    msg.message.imageMessage ||
    msg.message.videoMessage ||
    msg.message.audioMessage ||
    msg.message.documentMessage ||
    msg.message.stickerMessage
  )

  const ts =
    typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp
      : Number(msg.messageTimestamp)
  if (!ts || isNaN(ts)) return null

  return {
    coupleId,
    waMessageId: key.id,
    senderId,
    text,
    timestamp: new Date(ts * 1000),
    isMedia,
    source: 'baileys',
  }
}

export async function persistMessages(
  normalized: NormalizedMessage[],
): Promise<number> {
  if (normalized.length === 0) return 0
  const result = await db.insert(messages).values(normalized).onConflictDoNothing()
  return result.rowCount ?? 0
}

export async function getOldestMessage(coupleId: string, connectedUserId: string) {
  const [row] = await db.select({ waMessageId: messages.waMessageId, timestamp: messages.timestamp, senderId: messages.senderId })
    .from(messages).where(eq(messages.coupleId, coupleId))
    .orderBy(asc(messages.timestamp)).limit(1)
  if (!row) return null
  return { waMessageId: row.waMessageId, timestampMs: row.timestamp.getTime(), fromMe: row.senderId === connectedUserId }
}

export async function handleMessageRevoke(
  coupleId: string,
  revokedId: string,
): Promise<void> {
  // In the couples schema, messages don't have isDeleted — we delete the row
  await db
    .delete(messages)
    .where(
      and(
        eq(messages.coupleId, coupleId),
        eq(messages.waMessageId, revokedId),
      ),
    )
}
