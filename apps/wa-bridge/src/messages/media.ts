import { downloadMediaMessage, type WAMessage, type WASocket } from '@whiskeysockets/baileys'
import { db } from '@amore-couples/db/client'
import { messageMedia } from '@amore-couples/db/schema'
import { log } from '../logger.js'

const MAX_MEDIA_SIZE = 16 * 1024 * 1024 // 16MB limit

const MEDIA_MIME_MAP: Record<string, string> = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/ogg',
  sticker: 'image/webp',
  document: 'application/octet-stream',
}

/**
 * Download media from a WhatsApp message and store it in the DB.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function downloadAndStoreMedia(
  msg: WAMessage,
  coupleId: string,
  sock: WASocket,
): Promise<void> {
  const waMessageId = msg.key?.id
  if (!waMessageId || !msg.message) return

  const m = msg.message
  const mediaMsg = m.imageMessage || m.videoMessage || m.audioMessage || m.stickerMessage || m.documentMessage
  if (!mediaMsg) return

  const mimeType =
    (mediaMsg as { mimetype?: string }).mimetype ||
    MEDIA_MIME_MAP[
      m.imageMessage ? 'image' :
      m.videoMessage ? 'video' :
      m.audioMessage ? 'audio' :
      m.stickerMessage ? 'sticker' : 'document'
    ]

  try {
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: log as any,
        reuploadRequest: sock.updateMediaMessage,
      },
    )

    if (buffer.length > MAX_MEDIA_SIZE) {
      log.info({ waMessageId, size: buffer.length }, 'Skipping media: exceeds size limit')
      return
    }

    const base64 = buffer.toString('base64')

    await db.insert(messageMedia)
      .values({
        waMessageId,
        coupleId,
        data: base64,
        mimeType,
        fileSize: buffer.length,
      })
      .onConflictDoNothing()

    log.info({ waMessageId, size: buffer.length, mimeType }, 'Media stored')
  } catch (err) {
    log.error({ err, waMessageId }, 'Media download failed')
  }
}
