import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import {
  users,
  userRelationshipProfiles,
  insights,
  moodStates,
  coupleGoals,
  healthScoreHistory,
  coupleEntities,
  coachNudges,
} from '@amore-couples/db/schema'
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm'
import { messages, couples as couplesTable } from '@amore-couples/db/schema'
import { detectNudgeTriggers, runAnalysisPipeline } from '@amore-couples/ai'
import type { Message } from '@amore-couples/types'
import { checkFeatureAccess, incrementUsage, buildGatedResponse } from './plan'

/**
 * Unified intelligence data shared across dashboard and chat.
 * Single source of truth for all couple intelligence.
 */
export const getIntelligence = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple, partnerId } = await requireCouple()

    // Parallel fetch all intelligence data
    const [
      partner,
      partnerProfile,
      myProfile,
      latestMoods,
      activeGoals,
      recentInsights,
      sentimentByDay,
      msgStats,
      last7Days,
    ] = await Promise.all([
      // Partner info
      db.query.users.findFirst({
        where: eq(users.id, partnerId),
        columns: { id: true, name: true, image: true },
      }),

      // Partner relationship profile
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.userId, partnerId),
          eq(userRelationshipProfiles.coupleId, couple.id),
        ),
      }),

      // My relationship profile
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.userId, session.user.id),
          eq(userRelationshipProfiles.coupleId, couple.id),
        ),
      }),

      // Latest moods for both users
      db.query.moodStates.findMany({
        where: and(
          eq(moodStates.coupleId, couple.id),
          inArray(moodStates.userId, [session.user.id, partnerId]),
        ),
        orderBy: [desc(moodStates.createdAt)],
        limit: 10,
      }),

      // Active goals (top 5)
      db.query.coupleGoals.findMany({
        where: and(
          eq(coupleGoals.coupleId, couple.id),
          eq(coupleGoals.status, 'active'),
        ),
        orderBy: [desc(coupleGoals.createdAt)],
        limit: 5,
      }),

      // Recent insights (last 10)
      db.query.insights.findMany({
        where: eq(insights.coupleId, couple.id),
        orderBy: [desc(insights.generatedAt)],
        limit: 10,
      }),

      // 14-day sentiment trend
      db.execute(sql`
        SELECT DATE(timestamp) as day, AVG(sentiment) as avg_sentiment, COUNT(*) as msg_count
        FROM messages
        WHERE couple_id = ${couple.id}
          AND timestamp > NOW() - INTERVAL '14 days'
          AND sentiment IS NOT NULL
        GROUP BY DATE(timestamp)
        ORDER BY day
      `),

      // Message stats
      db.execute(sql`
        SELECT
          COUNT(*) as total_messages,
          COALESCE(ROUND(COUNT(*)::numeric / GREATEST(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400, 1), 1), 0) as daily_average
        FROM messages
        WHERE couple_id = ${couple.id}
      `),

      // Last 7 days message counts
      db.execute(sql`
        SELECT DATE(timestamp) as day, COUNT(*) as msg_count
        FROM messages
        WHERE couple_id = ${couple.id}
          AND timestamp > NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp)
        ORDER BY day
      `),
    ])

    // Extract latest mood per user
    const myMood = latestMoods.find((m) => m.userId === session.user.id) ?? null
    const partnerMood =
      latestMoods.find(
        (m) =>
          m.userId === partnerId &&
          (m.visibility === 'visible' || m.visibility === 'alert'),
      ) ?? null

    const messageStats = msgStats.rows[0]
      ? {
          totalMessages: Number(msgStats.rows[0].total_messages) || 0,
          dailyAverage: Number(msgStats.rows[0].daily_average) || 0,
          last7Days: last7Days.rows.map(
            (r: Record<string, unknown>) => Number(r.msg_count),
          ),
        }
      : null

    const formattedProfile = (
      profile: typeof partnerProfile,
    ) =>
      profile
        ? {
            loveLanguages: profile.loveLanguages as
              | Array<{ language: string; confidence: number }>
              | null,
            communicationStyle: profile.communicationStyle as
              | Record<string, Record<string, number>>
              | null,
            interests: profile.interests as string[] | null,
          }
        : null

    return {
      couple: {
        id: couple.id,
        healthScore: couple.healthScore,
        lastAnalyzed: couple.lastAnalyzed,
        messagesSinceAnalysis: couple.messagesSinceAnalysis,
        whatsappJid: couple.whatsappJid,
      },
      userName: session.user.name,
      partner,
      partnerProfile: formattedProfile(partnerProfile),
      myProfile: formattedProfile(myProfile),
      myMood,
      partnerMood,
      activeGoals,
      recentInsights: recentInsights.map((i) => ({
        id: i.id,
        coupleId: i.coupleId,
        type: i.type,
        content: (i.content ?? {}) as Record<string, {}>,
        severity: i.severity,
        generatedAt: i.generatedAt,
      })),
      sentimentByDay: sentimentByDay.rows.map(
        (r: Record<string, unknown>) => ({
          day: String(r.day),
          avg_sentiment: Number(r.avg_sentiment),
          msg_count: Number(r.msg_count),
        }),
      ),
      messageStats,
    }
  },
)

/**
 * Run the analysis pipeline directly against the local DB.
 * No bridge dependency — works in both dev and prod.
 */
export const triggerAnalysis = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { session, couple, plan } = await requireCouple()

    // Gate: manual analysis has weekly limit for free users
    if (plan === 'free') {
      const access = await checkFeatureAccess(session.user.id, plan, 'manual_analysis')
      if (!access.allowed) {
        return buildGatedResponse('manual_analysis', access)
      }
    }

    const previousHealthScore = couple.healthScore

    try {
      // Fetch user names for AI context
      const [userA, userB] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, couple.userAId),
          columns: { name: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, couple.userBId),
          columns: { name: true },
        }),
      ])

      // Fetch messages directly from local DB
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
        .where(eq(messages.coupleId, couple.id))
        .orderBy(asc(messages.timestamp))
        .limit(500)

      if (dbMessages.length < 5) {
        return { status: 'error', error: `Only ${dbMessages.length} messages — need at least 5` }
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

      const output = await runAnalysisPipeline(parsed, couple.id, undefined, userA, userB)
      const nudgeTriggers = detectNudgeTriggers(
        output.healthScore,
        previousHealthScore,
        output.insightRows,
      )

      // Persist results
      await db.transaction(async (tx) => {
        if (output.insightRows.length > 0) {
          await tx.insert(insights).values(output.insightRows)
        }

        await tx
          .update(couplesTable)
          .set({
            healthScore: output.healthScore,
            lastAnalyzed: new Date(),
            messagesSinceAnalysis: 0,
          })
          .where(eq(couplesTable.id, couple.id))

        await tx.insert(healthScoreHistory).values({
          coupleId: couple.id,
          score: output.healthScore,
          summary: output.summary,
        })

        if (output.profileData.wishlist?.length) {
          await tx.insert(coupleEntities).values(
            output.profileData.wishlist.map(w => ({
              coupleId: couple.id,
              type: 'wish' as const,
              content: w,
            }))
          )
        }

        if (output.profileData.importantDates?.length) {
          await tx.insert(coupleEntities).values(
            output.profileData.importantDates.map(d => ({
              coupleId: couple.id,
              type: 'important_date' as const,
              content: d,
            }))
          )
        }

        if (nudgeTriggers.length > 0) {
          await tx.insert(coachNudges).values(
            nudgeTriggers.map((nudge) => ({
              coupleId: couple.id,
              trigger: nudge.trigger,
              message: nudge.message,
            })),
          )
        }

        for (const userId of [couple.userAId, couple.userBId]) {
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

      // Track usage for free users
      if (plan === 'free') {
        await incrementUsage(session.user.id, 'manual_analysis')
      }

      return { status: 'analysis_complete', coupleId: couple.id, healthScore: output.healthScore }
    } catch (err) {
      return {
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to run analysis',
      }
    }
  },
)
