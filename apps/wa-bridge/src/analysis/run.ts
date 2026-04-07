import { db } from '@amore-couples/db/client'
import { messages, insights, couples, userRelationshipProfiles, users, healthScoreHistory, coupleEntities, coachNudges } from '@amore-couples/db/schema'
import { eq, asc, desc, and, gte, lt } from 'drizzle-orm'
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

  const dbMessages = (await db
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
    .orderBy(desc(messages.timestamp))
    .limit(MAX_MESSAGES)
  ).reverse() // reverse to chronological order for the AI

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

/**
 * Run historical analysis for onboarding — creates health score trend from day 1.
 * Splits the couple's message history into time windows and runs the pipeline on each.
 */
export async function runHistoricalAnalysis(coupleId: string): Promise<void> {
  const [couple] = await db
    .select({
      userAId: couples.userAId,
      userBId: couples.userBId,
    })
    .from(couples)
    .where(eq(couples.id, coupleId))
    .limit(1)

  if (!couple) {
    log.warn({ coupleId }, 'Couple not found, skipping historical analysis')
    return
  }

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

  // Define time windows working backwards from now
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  const windows = [
    { start: daysAgo(7), end: now, label: 'last-7d' },
    { start: daysAgo(30), end: daysAgo(7), label: '8-30d' },
    { start: daysAgo(90), end: daysAgo(30), label: '31-90d' },
    { start: daysAgo(180), end: daysAgo(90), label: '91-180d' },
  ]

  let latestScore: number | null = null

  for (const window of windows) {
    const windowMessages = await db
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
      .where(and(
        eq(messages.coupleId, coupleId),
        gte(messages.timestamp, window.start),
        lt(messages.timestamp, window.end),
      ))
      .orderBy(asc(messages.timestamp))
      .limit(MAX_MESSAGES)

    if (windowMessages.length < 20) {
      log.info({ coupleId, window: window.label, count: windowMessages.length }, 'Skipping window: insufficient messages')
      continue
    }

    const parsed: Message[] = windowMessages
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

    try {
      const output = await runAnalysisPipeline(parsed, coupleId, undefined, userA, userB)

      await db.transaction(async (tx) => {
        if (output.insightRows.length > 0) {
          // Set generated_at to the window's end date for historical placement
          const insightsWithDate = output.insightRows.map((row) => ({
            ...row,
            generatedAt: window.end,
          }))
          await tx.insert(insights).values(insightsWithDate)
        }

        await tx.insert(healthScoreHistory).values({
          coupleId,
          score: output.healthScore,
          summary: output.summary,
          periodStart: window.start,
          periodEnd: window.end,
        })
      })

      // Window 1 (last 7 days) becomes the current score
      if (latestScore === null) {
        latestScore = output.healthScore
      }

      log.info({ coupleId, window: window.label, score: output.healthScore, messageCount: parsed.length }, 'Historical window analyzed')
    } catch (err) {
      log.error({ err, coupleId, window: window.label }, 'Historical window analysis failed')
    }
  }

  // Update couple with the most recent score
  if (latestScore !== null) {
    await db
      .update(couples)
      .set({
        healthScore: latestScore,
        lastAnalyzed: new Date(),
        messagesSinceAnalysis: 0,
      })
      .where(eq(couples.id, coupleId))
  }

  log.info({ coupleId, latestScore }, 'Historical analysis completed')
}
