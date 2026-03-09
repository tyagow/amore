import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import {
  insights,
  messages,
  moodStates,
  userRelationshipProfiles,
  couples,
  healthScoreHistory,
  coupleEntities,
  users,
} from '@amore-couples/db/schema'
import { eq, desc, sql, and, gte } from 'drizzle-orm'

/**
 * Full insights data for the dedicated insights page.
 * Fetches all available analytics in parallel.
 */
export const getInsightsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple, partnerId } = await requireCouple()
    const userId = session.user.id
    const coupleId = couple.id

    // Parallel fetch all data
    const [
      partner,
      allInsights,
      healthHistory,
      sentimentByDay,
      messageStats,
      myProfile,
      partnerProfile,
      moodHistory,
      entities,
      hourlyActivity,
      senderStats,
    ] = await Promise.all([
      // Partner info
      db.query.users.findFirst({
        where: eq(users.id, partnerId),
        columns: { id: true, name: true, image: true },
      }),

      // All insights (no limit, for full page)
      db
        .select()
        .from(insights)
        .where(eq(insights.coupleId, coupleId))
        .orderBy(desc(insights.generatedAt))
        .limit(200),

      // Health score history
      db
        .select()
        .from(healthScoreHistory)
        .where(eq(healthScoreHistory.coupleId, coupleId))
        .orderBy(desc(healthScoreHistory.recordedAt))
        .limit(90),

      // Sentiment by day (30 days)
      db.execute(sql`
        SELECT DATE(timestamp) as day,
               AVG(sentiment) as avg_sentiment,
               COUNT(*) as msg_count
        FROM messages
        WHERE couple_id = ${coupleId}
          AND sentiment IS NOT NULL
          AND timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY day
      `),

      // Message stats
      db.execute(sql`
        SELECT
          COUNT(*) as total_messages,
          COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') as last_7_days,
          MIN(timestamp) as first_message,
          COUNT(DISTINCT DATE(timestamp)) as active_days
        FROM messages
        WHERE couple_id = ${coupleId}
      `),

      // My profile
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.coupleId, coupleId),
          eq(userRelationshipProfiles.userId, userId),
        ),
      }),

      // Partner profile
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.coupleId, coupleId),
          eq(userRelationshipProfiles.userId, partnerId),
        ),
      }),

      // Mood history (last 30 days, both partners)
      db
        .select()
        .from(moodStates)
        .where(
          and(
            eq(moodStates.coupleId, coupleId),
            gte(moodStates.createdAt, sql`NOW() - INTERVAL '30 days'`),
          ),
        )
        .orderBy(desc(moodStates.createdAt))
        .limit(100),

      // Couple entities (wishes, important dates)
      db
        .select()
        .from(coupleEntities)
        .where(eq(coupleEntities.coupleId, coupleId))
        .orderBy(desc(coupleEntities.extractedAt)),

      // Active hours heatmap (DOW x hour)
      db.execute(sql`
        SELECT
          EXTRACT(DOW FROM timestamp)::int as dow,
          EXTRACT(HOUR FROM timestamp)::int as hour,
          COUNT(*) as count
        FROM messages
        WHERE couple_id = ${coupleId}
        GROUP BY dow, hour
      `),

      // Per-sender stats
      db.execute(sql`
        SELECT
          sender_id,
          COUNT(*) as msg_count,
          AVG(LENGTH(text)) as avg_length
        FROM messages
        WHERE couple_id = ${coupleId} AND text IS NOT NULL
        GROUP BY sender_id
      `),
    ])

    // Calculate daily average
    const stats =
      (messageStats as any).rows?.[0] || (messageStats as any)[0] || {}
    const totalMessages = Number(stats.total_messages || 0)
    const activeDays = Number(stats.active_days || 1)

    return {
      couple: {
        id: couple.id,
        healthScore: couple.healthScore,
        lastAnalyzed: couple.lastAnalyzed,
      },
      userId,
      partner,
      allInsights: allInsights.map((i) => ({
        id: i.id,
        coupleId: i.coupleId,
        type: i.type,
        content: (i.content ?? {}) as Record<string, {}>,
        severity: i.severity,
        generatedAt: i.generatedAt,
      })),
      healthHistory: healthHistory.reverse(), // chronological order
      sentimentByDay: (
        (sentimentByDay as any).rows || sentimentByDay
      ) as Array<{ day: string; avg_sentiment: number; msg_count: number }>,
      messageStats: {
        totalMessages,
        dailyAverage: Math.round(totalMessages / activeDays),
        last7Days: Number(stats.last_7_days || 0),
      },
      myProfile,
      partnerProfile,
      moodHistory,
      entities,
      hourlyActivity: (
        (hourlyActivity as any).rows || hourlyActivity
      ) as Array<{ dow: number; hour: number; count: number }>,
      senderStats: ((senderStats as any).rows || senderStats) as Array<{
        sender_id: string
        msg_count: number
        avg_length: number
      }>,
    }
  },
)
