import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@amore-couples/db'
import {
  chatExports,
  couples,
  insights,
  messages,
  healthScoreHistory,
  coupleEntities,
  userRelationshipProfiles,
} from '@amore-couples/db/schema'
import { eq, or, and } from 'drizzle-orm'
import { requireAuth } from './require-couple'
import { parseWhatsAppExport, runAnalysisPipeline } from '@amore-couples/ai'
import type { Message } from '@amore-couples/types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_MESSAGES = 50_000
const localeSchema = z.enum(['en', 'pt-BR']).default('en')

/**
 * Upload a WhatsApp chat export, parse it, create a solo couple if needed,
 * persist messages, run analysis, and return results.
 */
export const uploadChatExport = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    fileContent: z.string().max(MAX_FILE_SIZE, 'File too large (max 5MB)'),
    filename: z.string().min(1).max(255),
    userSenderName: z.string().min(1).max(255),
    locale: localeSchema,
  }))
  .handler(async ({ data }) => {
    const session = await requireAuth()
    const userId = session.user.id

    // Parse the WhatsApp export
    const parsed = parseWhatsAppExport(data.fileContent)

    if (parsed.messages.length === 0) {
      throw new Error('No messages found in the file. Please check the format.')
    }

    if (parsed.senders.length < 2) {
      throw new Error('Could not detect two conversation participants. Please upload a 1-on-1 chat export.')
    }

    if (parsed.senders.length > 2) {
      throw new Error(`This looks like a group chat (${parsed.senders.length} participants). Please export a 1-on-1 conversation.`)
    }

    if (parsed.messages.length > MAX_MESSAGES) {
      throw new Error(`Too many messages (${parsed.messages.length}). Maximum is ${MAX_MESSAGES}.`)
    }

    // Find or create a solo couple for this user
    let couple = await db.query.couples.findFirst({
      where: and(
        or(
          eq(couples.userAId, userId),
          eq(couples.userBId, userId),
        ),
        eq(couples.status, 'solo'),
      ),
    })

    // Also check for an active couple
    if (!couple) {
      couple = await db.query.couples.findFirst({
        where: and(
          or(
            eq(couples.userAId, userId),
            eq(couples.userBId, userId),
          ),
          eq(couples.status, 'active'),
        ),
      })
    }

    if (!couple) {
      // Create a solo couple (self-reference)
      const [newCouple] = await db.insert(couples).values({
        userAId: userId,
        userBId: userId,
        status: 'solo',
      }).returning()
      couple = newCouple
    }

    // Create the chat export record
    const [exportRecord] = await db.insert(chatExports).values({
      userId,
      coupleId: couple.id,
      filename: data.filename,
      messageCount: parsed.messages.length,
      dateRangeStart: parsed.dateRange?.start,
      dateRangeEnd: parsed.dateRange?.end,
      senderNames: parsed.senders,
      userSenderName: data.userSenderName,
      status: 'processing',
    }).returning()

    // Map parsed messages to the Message format and persist
    // For DB storage: all messages use the uploading user's ID as senderId
    // (FK constraint requires a real user ID). We prefix partner messages with
    // the partner's name in the text for the analysis pipeline to differentiate.
    const messageRows = parsed.messages
      .filter((m) => m.text || m.isMedia)  // Skip empty
      .map((m) => ({
        coupleId: couple.id,
        senderId: userId,  // All messages use the real userId for FK
        text: m.text || null,
        timestamp: m.timestamp,
        isMedia: m.isMedia,
        source: 'export' as const,
        originalSender: m.sender,  // Track original sender for analysis
      }))

    // Insert messages in batches (without the originalSender field)
    const BATCH_SIZE = 500
    for (let i = 0; i < messageRows.length; i += BATCH_SIZE) {
      const batch = messageRows.slice(i, i + BATCH_SIZE).map(({ originalSender, ...row }) => row)
      await db.insert(messages).values(batch)
    }

    // Build Message[] for the analysis pipeline using original sender names
    // as senderIds so the AI can differentiate between the two people
    const analysisMessages: Message[] = messageRows.map((m, idx) => ({
      id: `export-${idx}`,
      coupleId: couple.id,
      waMessageId: null,
      senderId: m.originalSender,  // Use original sender name for analysis
      text: m.text,
      timestamp: m.timestamp,
      sentiment: null,
      isMedia: m.isMedia,
      source: 'export' as const,
      createdAt: new Date(),
    }))

    try {
      // Run the analysis pipeline
      const output = await runAnalysisPipeline(
        analysisMessages,
        couple.id,
        data.userSenderName,
        undefined,
        undefined,
        data.locale,
      )

      // Persist analysis results
      await db.transaction(async (tx) => {
        if (output.insightRows.length > 0) {
          await tx.insert(insights).values(output.insightRows)
        }

        await tx.update(couples as any)
          .set({
            healthScore: output.healthScore,
            lastAnalyzed: new Date(),
            messagesSinceAnalysis: 0,
          })
          .where(eq(couples.id, couple.id))

        await tx.insert(healthScoreHistory).values({
          coupleId: couple.id,
          score: output.healthScore,
          summary: output.summary,
        })

        if (output.profileData.wishlist?.length) {
          await tx.insert(coupleEntities).values(
            output.profileData.wishlist.map((w) => ({
              coupleId: couple.id,
              type: 'wish' as const,
              content: w,
            })),
          )
        }

        if (output.profileData.importantDates?.length) {
          await tx.insert(coupleEntities).values(
            output.profileData.importantDates.map((d) => ({
              coupleId: couple.id,
              type: 'important_date' as const,
              content: d,
            })),
          )
        }

        await tx.insert(userRelationshipProfiles)
          .values({
            coupleId: couple.id,
            userId,
            loveLanguages: output.profileData.loveLanguages,
            communicationStyle: output.profileData.communicationStyle,
            interests: output.profileData.interests,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userRelationshipProfiles.coupleId, userRelationshipProfiles.userId],
            set: {
              loveLanguages: output.profileData.loveLanguages,
              communicationStyle: output.profileData.communicationStyle,
              interests: output.profileData.interests,
              updatedAt: new Date(),
            },
          })

        // Mark export as complete
        await tx.update(chatExports)
          .set({ status: 'complete' })
          .where(eq(chatExports.id, exportRecord.id))
      })

      return {
        status: 'complete' as const,
        exportId: exportRecord.id,
        healthScore: output.healthScore,
        summary: output.summary,
        messageCount: parsed.messages.length,
        dateRange: parsed.dateRange,
      }
    } catch (err) {
      // Mark export as failed
      await db.update(chatExports)
        .set({ status: 'failed' })
        .where(eq(chatExports.id, exportRecord.id))

      throw new Error(
        `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  })

/**
 * Parse a WhatsApp export and return preview data (no persistence).
 * Used for the sender selection step.
 */
export const previewChatExport = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    fileContent: z.string().max(MAX_FILE_SIZE, 'File too large (max 5MB)'),
  }))
  .handler(async ({ data }) => {
    await requireAuth()

    const parsed = parseWhatsAppExport(data.fileContent)

    if (parsed.messages.length === 0) {
      throw new Error('No messages found in the file. Please check the format.')
    }

    if (parsed.senders.length > 2) {
      throw new Error(`This looks like a group chat (${parsed.senders.length} participants). Please export a 1-on-1 conversation.`)
    }

    // First 5 messages for preview
    const preview = parsed.messages.slice(0, 5).map((m) => ({
      sender: m.sender,
      text: m.text.slice(0, 200),
      timestamp: m.timestamp.toISOString(),
      isMedia: m.isMedia,
    }))

    return {
      senders: parsed.senders,
      messageCount: parsed.messages.length,
      dateRange: parsed.dateRange
        ? {
            start: parsed.dateRange.start.toISOString(),
            end: parsed.dateRange.end.toISOString(),
          }
        : null,
      preview,
      skippedLines: parsed.skippedLines,
    }
  })
