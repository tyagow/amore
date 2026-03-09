import { db } from '@amore-couples/db'
import {
  coachMemory,
  coupleGoals,
  couples,
  healthScoreHistory,
  insights,
  messages,
  moodStates,
  userRelationshipProfiles,
} from '@amore-couples/db/schema'
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  sql,
} from 'drizzle-orm'
import type { CoachContext, CoachIntent } from '@amore-couples/ai'

function mapRecentMessages(
  rows: Array<{
    senderId: string
    text: string | null
    timestamp: Date
  }>,
  userId: string,
) {
  return rows
    .filter((message) => Boolean(message.text))
    .map((message) => ({
      sender: message.senderId === userId ? 'You' : 'Partner',
      text: message.text ?? '',
      timestamp: message.timestamp,
    }))
}

function normalizePatternInsights(
  rows: Array<{ content: unknown }>,
): CoachContext['patterns'] {
  const patterns: NonNullable<CoachContext['patterns']> = {}

  for (const row of rows) {
    const content = row.content as {
      pattern?: string
      value?: unknown
    }

    if (!content.pattern || typeof content.value === 'undefined') {
      continue
    }

    if (
      content.pattern === 'initiationBalance' ||
      content.pattern === 'avgResponseMinutes' ||
      content.pattern === 'messageCountBySender'
    ) {
      patterns[content.pattern] = content.value as Record<string, number>
    }
  }

  return Object.keys(patterns).length > 0 ? patterns : null
}

export async function fetchCoachContext(
  coupleId: string,
  userId: string,
  partnerId: string,
  intent: CoachIntent,
): Promise<Partial<CoachContext>> {
  const context: Partial<CoachContext> = {}

  const [coupleRow, memoryRows] = await Promise.all([
    db.query.couples.findFirst({
      where: eq(couples.id, coupleId),
      columns: { healthScore: true },
    }),
    db.query.coachMemory.findMany({
      where: eq(coachMemory.coupleId, coupleId),
      orderBy: [desc(coachMemory.createdAt)],
      limit: 20,
      columns: { category: true, content: true },
    }),
  ])

  context.healthScore = coupleRow?.healthScore ?? null
  context.coachMemory = memoryRows

  if (intent === 'communication' || intent === 'general') {
    const [recentInsightRows, latestScore, patternRows] = await Promise.all([
      db.query.insights.findMany({
        where: eq(insights.coupleId, coupleId),
        orderBy: [desc(insights.generatedAt)],
        limit: 5,
      }),
      db.query.healthScoreHistory.findFirst({
        where: eq(healthScoreHistory.coupleId, coupleId),
        orderBy: [desc(healthScoreHistory.recordedAt)],
        columns: { summary: true },
      }),
      db.query.insights.findMany({
        where: and(
          eq(insights.coupleId, coupleId),
          eq(insights.type, 'communication_pattern'),
        ),
        orderBy: [desc(insights.generatedAt)],
        limit: 8,
        columns: { content: true },
      }),
    ])

    context.recentInsights = recentInsightRows
    context.summary = latestScore?.summary ?? null
    context.patterns = normalizePatternInsights(patternRows)
  }

  if (intent === 'conflict') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [conflictInsights, lowSentimentRows] = await Promise.all([
      db.query.insights.findMany({
        where: and(
          eq(insights.coupleId, coupleId),
          inArray(insights.type, ['conflict_alert', 'conflict_pattern']),
        ),
        orderBy: [desc(insights.generatedAt)],
        limit: 5,
      }),
      db.query.messages.findMany({
        where: and(
          eq(messages.coupleId, coupleId),
          gte(messages.timestamp, thirtyDaysAgo),
          sql`${messages.sentiment} IS NOT NULL`,
          sql`${messages.sentiment} < -0.3`,
        ),
        orderBy: [desc(messages.timestamp)],
        limit: 10,
        columns: {
          senderId: true,
          text: true,
          timestamp: true,
        },
      }),
    ])

    context.recentInsights = conflictInsights
    context.recentMessages = mapRecentMessages(lowSentimentRows, userId)
  }

  if (intent === 'goals') {
    const goalRows = await db.query.coupleGoals.findMany({
      where: eq(coupleGoals.coupleId, coupleId),
      orderBy: [desc(coupleGoals.createdAt)],
      limit: 10,
    })

    context.goals = goalRows.map((goal) => ({
      title: goal.title,
      status: goal.status,
      description: goal.description,
    }))
  }

  if (intent === 'emotions') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [sentimentRows, moodRows, profileRows] = await Promise.all([
      db.select({
        date: sql<string>`DATE(${messages.timestamp})`,
        avg: sql<number>`AVG(${messages.sentiment})`,
      })
        .from(messages)
        .where(and(
          eq(messages.coupleId, coupleId),
          gte(messages.timestamp, thirtyDaysAgo),
          sql`${messages.sentiment} IS NOT NULL`,
        ))
        .groupBy(sql`DATE(${messages.timestamp})`)
        .orderBy(sql`DATE(${messages.timestamp})`),
      db.query.moodStates.findMany({
        where: eq(moodStates.coupleId, coupleId),
        orderBy: [desc(moodStates.createdAt)],
        limit: 6,
      }),
      db.query.userRelationshipProfiles.findMany({
        where: eq(userRelationshipProfiles.coupleId, coupleId),
      }),
    ])

    const myProfile = profileRows.find((profile) => profile.userId === userId)
    const partnerProfile = profileRows.find((profile) => profile.userId === partnerId)

    context.sentimentTrend = sentimentRows.map((row) => ({
      date: String(row.date),
      avg: Number(row.avg),
    }))
    context.moodStates = moodRows.map((mood) => ({
      userId: mood.userId === userId ? 'You' : 'Partner',
      mood: mood.mood,
      note: mood.note,
    }))
    context.loveLanguages = {
      mine: (myProfile?.loveLanguages as CoachContext['loveLanguages']['mine']) ?? null,
      partner: (partnerProfile?.loveLanguages as CoachContext['loveLanguages']['partner']) ?? null,
    }
  }

  if (intent === 'partner') {
    const [recentMessageRows, partnerProfile] = await Promise.all([
      db.query.messages.findMany({
        where: eq(messages.coupleId, coupleId),
        orderBy: [desc(messages.timestamp)],
        limit: 20,
        columns: {
          senderId: true,
          text: true,
          timestamp: true,
        },
      }),
      db.query.userRelationshipProfiles.findFirst({
        where: and(
          eq(userRelationshipProfiles.coupleId, coupleId),
          eq(userRelationshipProfiles.userId, partnerId),
        ),
      }),
    ])

    context.recentMessages = mapRecentMessages(recentMessageRows, userId)
    context.loveLanguages = {
      mine: null,
      partner: (partnerProfile?.loveLanguages as CoachContext['loveLanguages']['partner']) ?? null,
    }
  }

  return context
}
