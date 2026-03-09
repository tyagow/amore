import { db } from '@amore-couples/db/client'
import { messages } from '@amore-couples/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { proto } from '@whiskeysockets/baileys'
import {
  incrementMessageCounter,
  checkAndTriggerAnalysis,
  checkAndTriggerMoodDetection,
} from '../analysis/trigger.js'
import { log } from '../logger.js'

export interface NormalizedMessage {
  coupleId: string
  waMessageId: string
  senderId: string   // Real user ID FK (not a display name)
  text: string | null
  timestamp: Date
  isMedia: boolean
  mediaType: string | null
  thumbnail: string | null  // base64 JPEG thumbnail
  source: 'baileys'
}

function getNestedMessageValue(
  value: Record<string, unknown>,
  path: string[],
): proto.IMessage | null {
  let current: unknown = value
  for (const key of path) {
    if (!current || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[key]
  }
  return current && typeof current === 'object'
    ? (current as proto.IMessage)
    : null
}

export function unwrapMessageContent(
  msg: proto.IMessage | null | undefined,
): proto.IMessage | null {
  let current = msg ?? null

  for (let depth = 0; current && depth < 8; depth++) {
    const record = current as Record<string, unknown>
    const next =
      getNestedMessageValue(record, ['ephemeralMessage', 'message']) ||
      getNestedMessageValue(record, ['viewOnceMessage', 'message']) ||
      getNestedMessageValue(record, ['viewOnceMessageV2', 'message']) ||
      getNestedMessageValue(record, ['viewOnceMessageV2Extension', 'message']) ||
      getNestedMessageValue(record, ['documentWithCaptionMessage', 'message']) ||
      getNestedMessageValue(record, ['editedMessage', 'message']) ||
      getNestedMessageValue(record, [
        'editedMessage',
        'message',
        'protocolMessage',
        'editedMessage',
      ])

    if (!next || next === current) {
      return current
    }

    current = next
  }

  return current
}

export function extractMessageText(msg: proto.IMessage): string | null {
  const content = unwrapMessageContent(msg)
  if (!content) return null

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    null
  )
}

export function getMediaType(msg: proto.IMessage): string | null {
  const content = unwrapMessageContent(msg)
  if (!content) return null

  if (content.imageMessage) return 'image'
  if (content.videoMessage) return 'video'
  if (content.audioMessage) return 'audio'
  if (content.documentMessage) return 'document'
  if (content.stickerMessage) return 'sticker'
  return null
}

export function extractMessageThumbnail(msg: proto.IMessage): string | null {
  const content = unwrapMessageContent(msg)
  if (!content) return null

  const jpegThumbnail =
    content.imageMessage?.jpegThumbnail ||
    content.videoMessage?.jpegThumbnail ||
    content.stickerMessage?.pngThumbnail ||
    null

  return jpegThumbnail ? Buffer.from(jpegThumbnail).toString('base64') : null
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
  const content = unwrapMessageContent(msg.message)
  if (!content) return null

  // fromMe = sent by the connected phone owner = connectedUserId
  const senderId = key.fromMe ? connectedUserId : partnerUserId

  const text = extractMessageText(content)
  const mediaType = getMediaType(content)
  const isMedia = mediaType !== null
  const thumbnail = extractMessageThumbnail(content)

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
    mediaType,
    thumbnail,
    source: 'baileys',
  }
}

export async function persistMessages(
  normalized: NormalizedMessage[],
): Promise<number> {
  if (normalized.length === 0) return 0
  const result = await db.insert(messages).values(normalized).onConflictDoNothing()
  const insertedCount = result.rowCount ?? 0

  if (insertedCount > 0) {
    // All messages in a batch share the same coupleId
    const coupleId = normalized[0].coupleId

    // Increment counter and get new total
    const newCount = await incrementMessageCounter(coupleId, insertedCount).catch((err) => {
      log.error({ err, coupleId }, 'Failed to increment message counter')
      return 0
    })

    // Fire-and-forget: check if analysis threshold reached
    checkAndTriggerAnalysis(coupleId).catch((err) => {
      log.error({ err, coupleId }, 'Failed to check analysis trigger')
    })

    // Fire-and-forget: mood detection every MOOD_CHECK_INTERVAL messages
    // Use the last message's sender as the mood detection target
    const lastSender = normalized[normalized.length - 1].senderId
    checkAndTriggerMoodDetection(coupleId, lastSender, newCount).catch((err) => {
      log.error({ err, coupleId }, 'Failed to check mood detection trigger')
    })
  }

  return insertedCount
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
