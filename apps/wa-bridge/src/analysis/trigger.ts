import { db } from '@amore-couples/db/client'
import { couples, messages, moodStates } from '@amore-couples/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { runAnalysis } from './run.js'
import { detectMoodShift } from '@amore-couples/ai'
import { log } from '../logger.js'

const ANALYSIS_THRESHOLD = parseInt(process.env.ANALYSIS_THRESHOLD || '50', 10)
const MOOD_CHECK_INTERVAL = 10

// Prevent concurrent analysis for the same couple
const analysisInProgress = new Set<string>()

/**
 * Increment the messages-since-analysis counter for a couple.
 * Returns the new count so callers can decide what to trigger.
 */
export async function incrementMessageCounter(coupleId: string, count: number): Promise<number> {
  const [updated] = await db
    .update(couples)
    .set({
      messagesSinceAnalysis: sql`${couples.messagesSinceAnalysis} + ${count}`,
    })
    .where(eq(couples.id, coupleId))
    .returning({ messagesSinceAnalysis: couples.messagesSinceAnalysis })

  return updated?.messagesSinceAnalysis ?? 0
}

/**
 * Check if the analysis threshold has been reached and trigger the pipeline.
 * Fire-and-forget — does not block the caller.
 */
export async function checkAndTriggerAnalysis(coupleId: string): Promise<void> {
  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, coupleId),
    columns: { messagesSinceAnalysis: true },
  })

  if (!couple) return

  if (couple.messagesSinceAnalysis >= ANALYSIS_THRESHOLD && !analysisInProgress.has(coupleId)) {
    log.info(
      { coupleId, messageCount: couple.messagesSinceAnalysis },
      'Analysis threshold reached, triggering pipeline',
    )

    analysisInProgress.add(coupleId)
    // Fire-and-forget — don't block message ingest
    runAnalysis(coupleId)
      .catch((err) => {
        log.error({ err, coupleId }, 'Analysis pipeline failed')
      })
      .finally(() => analysisInProgress.delete(coupleId))
  }
}

/**
 * Detect mood shift for a specific sender in a couple's conversation.
 * Runs on every Nth message (MOOD_CHECK_INTERVAL) per couple.
 */
export async function checkAndTriggerMoodDetection(
  coupleId: string,
  senderId: string,
  messagesSinceAnalysis: number,
): Promise<void> {
  if (messagesSinceAnalysis % MOOD_CHECK_INTERVAL !== 0) return

  try {
    // Fetch recent messages for the couple
    const recentMessages = await db
      .select({
        senderId: messages.senderId,
        text: messages.text,
        timestamp: messages.timestamp,
      })
      .from(messages)
      .where(eq(messages.coupleId, coupleId))
      .orderBy(desc(messages.timestamp))
      .limit(20)

    const formatted = recentMessages
      .filter((m) => m.text !== null)
      .map((m) => ({
        sender: m.senderId,
        text: m.text!,
        timestamp: m.timestamp,
      }))
      .reverse() // chronological order for the AI

    if (formatted.length < 3) return

    const result = await detectMoodShift(formatted, senderId, senderId)

    if (result.moodShiftDetected && result.confidence >= 0.6) {
      log.info(
        { coupleId, senderId, mood: result.mood, confidence: result.confidence },
        'Mood shift detected',
      )

      await db.insert(moodStates).values({
        coupleId,
        userId: senderId,
        mood: result.mood,
        source: 'ai_detected',
        visibility: 'silent',
        note: result.reason,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      })
    }
  } catch (err) {
    log.error({ err, coupleId, senderId }, 'Mood detection failed')
  }
}
