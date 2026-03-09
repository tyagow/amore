import { db } from '@amore-couples/db/client'
import { messages, insights, couples, userRelationshipProfiles, users, healthScoreHistory, coupleEntities, coachNudges } from '@amore-couples/db/schema'
import { eq, asc } from 'drizzle-orm'
import { detectNudgeTriggers, runAnalysisPipeline } from '@amore-couples/ai'
import type { Message } from '@amore-couples/types'
import { log } from '../logger.js'

const MIN_MESSAGE_THRESHOLD = 5 // Low bar — history sync provides plenty of messages
const MAX_MESSAGES = 500

export async function runAnalysis(coupleId: string): Promise<void> {
  // Fetch the couple to get user names for the AI
  const [couple] = await db
    .select({
      userAId: couples.userAId,
      userBId: couples.userBId,
      healthScore: couples.healthScore,
    })
    .from(couples)
    .where(eq(couples.id, coupleId))
    .limit(1)

  if (!couple) {
    log.warn({ coupleId }, 'Couple not found, skipping analysis')
    return
  }

  // Fetch user names for better AI context
  const [userA] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, couple.userAId))
    .limit(1)

  const [userB] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, couple.userBId))
    .limit(1)

  const dbMessages = await db
    .select({
      id: messages.id,
      coupleId: messages.coupleId,
      waMessageId: messages.waMessageId,
      senderId: messages.senderId,
      text: messages.text,
      timestamp: messages.timestamp,
      sentiment: messages.sentiment,
      isMedia: messages.isMedia,
      source: messages.source,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.coupleId, coupleId))
    .orderBy(asc(messages.timestamp))
    .limit(MAX_MESSAGES)

  if (dbMessages.length < MIN_MESSAGE_THRESHOLD) {
    log.info({ coupleId, messageCount: dbMessages.length, threshold: MIN_MESSAGE_THRESHOLD }, 'Skipping analysis: insufficient messages')
    return
  }

  const parsed: Message[] = dbMessages
    .filter((m) => m.text !== null)
    .map((m) => ({
      id: m.id,
      coupleId: m.coupleId,
      waMessageId: m.waMessageId,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      sentiment: m.sentiment,
      isMedia: m.isMedia,
      source: m.source as 'baileys',
      createdAt: m.createdAt,
    }))

  const output = await runAnalysisPipeline(parsed, coupleId, undefined, userA, userB)
  const nudgeTriggers = detectNudgeTriggers(
    output.healthScore,
    couple.healthScore,
    output.insightRows,
  )

  await db.transaction(async (tx) => {
    if (output.insightRows.length > 0) {
      await tx.insert(insights).values(output.insightRows)
    }

    await tx
      .update(couples)
      .set({
        healthScore: output.healthScore,
        lastAnalyzed: new Date(),
        messagesSinceAnalysis: 0,
      })
      .where(eq(couples.id, coupleId))

    await tx.insert(healthScoreHistory).values({
      coupleId,
      score: output.healthScore,
      summary: output.summary,
    })

    if (output.profileData.wishlist?.length) {
      await tx.insert(coupleEntities).values(
        output.profileData.wishlist.map(w => ({
          coupleId,
          type: 'wish' as const,
          content: w,
        }))
      )
    }

    if (output.profileData.importantDates?.length) {
      await tx.insert(coupleEntities).values(
        output.profileData.importantDates.map(d => ({
          coupleId,
          type: 'important_date' as const,
          content: d,
        }))
      )
    }

    if (nudgeTriggers.length > 0) {
      await tx.insert(coachNudges).values(
        nudgeTriggers.map((nudge) => ({
          coupleId,
          trigger: nudge.trigger,
          message: nudge.message,
        })),
      )
    }

    for (const userId of [couple.userAId, couple.userBId]) {
      await tx.insert(userRelationshipProfiles)
        .values({
          coupleId,
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
    }
  })

  if (output.sentiments?.length) {
    for (const s of output.sentiments) {
      const msg = parsed[s.index]
      if (msg) {
        await db.update(messages)
          .set({ sentiment: s.score })
          .where(eq(messages.id, msg.id))
      }
    }
  }

  log.info({ coupleId, insightCount: output.insightRows.length, healthScore: output.healthScore }, 'Analysis completed')
}
