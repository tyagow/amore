import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import {
  users,
  userRelationshipProfiles,
  insights,
  moodStates,
  coupleGoals,
} from '@amore-couples/db/schema'
import { eq, and, desc, inArray, sql } from 'drizzle-orm'

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
