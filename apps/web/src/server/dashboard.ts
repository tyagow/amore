import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { users, moodStates, coupleGoals, insights } from '@amore-couples/db/schema'
import { eq, and, desc, inArray, sql } from 'drizzle-orm'

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple, partnerId } = await requireCouple()

    // Fetch partner info
    const partner = await db.query.users.findFirst({
      where: eq(users.id, partnerId),
      columns: { id: true, name: true, image: true },
    })

    // Fetch latest moods for both users in this couple
    const latestMoods = await db.query.moodStates.findMany({
      where: and(
        eq(moodStates.coupleId, couple.id),
        inArray(moodStates.userId, [session.user.id, partnerId]),
      ),
      orderBy: [desc(moodStates.createdAt)],
      limit: 10,
    })

    // Extract latest mood per user
    const myMood = latestMoods.find((m) => m.userId === session.user.id) ?? null
    const partnerMood = latestMoods.find(
      (m) =>
        m.userId === partnerId &&
        (m.visibility === 'visible' || m.visibility === 'alert'),
    ) ?? null

    // Active goals (top 5)
    const activeGoals = await db.query.coupleGoals.findMany({
      where: and(
        eq(coupleGoals.coupleId, couple.id),
        eq(coupleGoals.status, 'active'),
      ),
      orderBy: [desc(coupleGoals.createdAt)],
      limit: 5,
    })

    // Recent insights (latest 5)
    const recentInsights = await db.query.insights.findMany({
      where: eq(insights.coupleId, couple.id),
      orderBy: [desc(insights.generatedAt)],
      limit: 5,
    })

    // Sentiment by day (14 days)
    const sentimentByDay = await db.execute(sql`
      SELECT DATE(timestamp) as day, AVG(sentiment) as avg_sentiment, COUNT(*) as msg_count
      FROM messages
      WHERE couple_id = ${couple.id}
        AND timestamp > NOW() - INTERVAL '14 days'
        AND sentiment IS NOT NULL
      GROUP BY DATE(timestamp)
      ORDER BY day
    `)

    // Message stats
    const msgStatsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_messages,
        COALESCE(ROUND(COUNT(*)::numeric / GREATEST(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400, 1), 1), 0) as daily_average
      FROM messages
      WHERE couple_id = ${couple.id}
    `)

    // Last 7 days message counts for bar chart
    const last7DaysResult = await db.execute(sql`
      SELECT DATE(timestamp) as day, COUNT(*) as msg_count
      FROM messages
      WHERE couple_id = ${couple.id}
        AND timestamp > NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY day
    `)

    const messageStats = msgStatsResult.rows[0]
      ? {
          totalMessages: Number(msgStatsResult.rows[0].total_messages) || 0,
          dailyAverage: Number(msgStatsResult.rows[0].daily_average) || 0,
          last7Days: last7DaysResult.rows.map((r: Record<string, unknown>) => Number(r.msg_count)),
        }
      : null

    return {
      couple: {
        id: couple.id,
        healthScore: couple.healthScore,
        lastAnalyzed: couple.lastAnalyzed,
        messagesSinceAnalysis: couple.messagesSinceAnalysis,
      },
      partner,
      myMood,
      partnerMood,
      activeGoals,
      recentInsights: recentInsights.map((i) => ({
        ...i,
        content: i.content as Record<string, {}>,
      })),
      userName: session.user.name,
      sentimentByDay: sentimentByDay.rows.map((r: Record<string, unknown>) => ({
        day: String(r.day),
        avg_sentiment: Number(r.avg_sentiment),
        msg_count: Number(r.msg_count),
      })),
      messageStats,
    }
  },
)
