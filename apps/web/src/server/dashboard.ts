import { createServerFn } from '@tanstack/react-start'
import { requireCouple } from './require-couple'
import { db } from '@amore-couples/db'
import { users, moodStates, coupleGoals, insights } from '@amore-couples/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'

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

    return {
      couple: {
        id: couple.id,
        healthScore: couple.healthScore,
        lastAnalyzed: couple.lastAnalyzed,
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
    }
  },
)
