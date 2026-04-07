import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@amore-couples/db'
import {
  coachMemory,
  coachMessages,
  coachNudges,
  coachThreads,
  messages,
  users,
} from '@amore-couples/db/schema'
import {
  and,
  asc,
  desc,
  eq,
  or,
  isNull,
} from 'drizzle-orm'
import { optionalCouple, requireAuth } from './require-couple'
import {
  extractCoachMemory,
  generateThreadTitle,
} from '@amore-couples/ai'

const threadInputSchema = z.object({
  threadId: z.string().min(1).optional(),
})

const contextSnapshotSchema = z.record(z.string(), z.unknown())

export const getOrCreateThread = createServerFn({ method: 'POST' })
  .inputValidator(threadInputSchema)
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()

    if (data.threadId) {
      // Look up thread by id — check couple or user ownership
      const existing = couple
        ? await db.query.coachThreads.findFirst({
            where: and(
              eq(coachThreads.id, data.threadId),
              or(
                eq(coachThreads.coupleId, couple.id),
                and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
              ),
            ),
          })
        : await db.query.coachThreads.findFirst({
            where: and(
              eq(coachThreads.id, data.threadId),
              eq(coachThreads.userId, session.user.id),
            ),
          })

      if (!existing) {
        throw new Error('Thread not found')
      }
      return existing
    }

    // Create new thread
    const [thread] = await db.insert(coachThreads).values({
      coupleId: couple?.id ?? null,
      userId: session.user.id,
    }).returning()

    return thread
  })

export const listThreads = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { session, couple } = await optionalCouple()

    if (couple) {
      // Return both couple threads and solo threads for this user
      return db.query.coachThreads.findMany({
        where: or(
          eq(coachThreads.coupleId, couple.id),
          and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
        ),
        orderBy: [desc(coachThreads.updatedAt)],
        limit: 50,
      })
    }

    // Solo user — return threads owned by userId with no couple
    return db.query.coachThreads.findMany({
      where: and(
        eq(coachThreads.userId, session.user.id),
        isNull(coachThreads.coupleId),
      ),
      orderBy: [desc(coachThreads.updatedAt)],
      limit: 50,
    })
  },
)

export const getThreadMessages = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ threadId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()

    const thread = couple
      ? await db.query.coachThreads.findFirst({
          where: and(
            eq(coachThreads.id, data.threadId),
            or(
              eq(coachThreads.coupleId, couple.id),
              and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
            ),
          ),
        })
      : await db.query.coachThreads.findFirst({
          where: and(
            eq(coachThreads.id, data.threadId),
            eq(coachThreads.userId, session.user.id),
          ),
        })

    if (!thread) {
      throw new Error('Thread not found')
    }

    return db.query.coachMessages.findMany({
      where: eq(coachMessages.threadId, data.threadId),
      orderBy: [asc(coachMessages.createdAt)],
      columns: {
        id: true,
        threadId: true,
        role: true,
        content: true,
        createdAt: true,
      },
    })
  })

export const deleteThread = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ threadId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()

    if (couple) {
      await db.delete(coachThreads).where(and(
        eq(coachThreads.id, data.threadId),
        or(
          eq(coachThreads.coupleId, couple.id),
          and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
        ),
      ))
    } else {
      await db.delete(coachThreads).where(and(
        eq(coachThreads.id, data.threadId),
        eq(coachThreads.userId, session.user.id),
      ))
    }

    return { ok: true }
  })

export const saveCoachExchange = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    threadId: z.string().min(1),
    userMessage: z.string().min(1).max(10_000),
    assistantMessage: z.string().min(1).max(20_000),
    contextSnapshot: contextSnapshotSchema.optional(),
    isFirstMessage: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()

    // Verify thread ownership
    const thread = couple
      ? await db.query.coachThreads.findFirst({
          where: and(
            eq(coachThreads.id, data.threadId),
            or(
              eq(coachThreads.coupleId, couple.id),
              and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
            ),
          ),
        })
      : await db.query.coachThreads.findFirst({
          where: and(
            eq(coachThreads.id, data.threadId),
            eq(coachThreads.userId, session.user.id),
          ),
        })

    if (!thread) {
      throw new Error('Thread not found')
    }

    await db.transaction(async (tx) => {
      await tx.insert(coachMessages).values([
        {
          threadId: data.threadId,
          role: 'user',
          content: data.userMessage,
          contextSnapshot: data.contextSnapshot,
        },
        {
          threadId: data.threadId,
          role: 'assistant',
          content: data.assistantMessage,
        },
      ])

      const update: Partial<typeof coachThreads.$inferInsert> & { updatedAt: Date } = {
        updatedAt: new Date(),
      }

      if (data.isFirstMessage && !thread.title) {
        update.title = await generateThreadTitle(data.userMessage)
      }

      await tx.update(coachThreads)
        .set(update)
        .where(eq(coachThreads.id, data.threadId))
    })

    // Extract memory — only for couple threads
    if (couple && thread.coupleId) {
      void extractCoachMemory(data.userMessage, data.assistantMessage)
        .then(async (memories) => {
          if (memories.length === 0) return

          await db.insert(coachMemory).values(
            memories.map((memory) => ({
              coupleId: couple.id,
              category: memory.category,
              content: memory.content,
              sourceThreadId: data.threadId,
            })),
          )
        })
        .catch((error) => {
          console.error('[coach] failed to extract memory', error)
        })
    }

    return { ok: true }
  })

export const getCoachNudges = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await optionalCouple()

    // Solo users have no nudges — nudges require analysis data
    if (!couple) {
      return []
    }

    return db.query.coachNudges.findMany({
      where: and(
        eq(coachNudges.coupleId, couple.id),
        eq(coachNudges.dismissed, false),
      ),
      orderBy: [desc(coachNudges.createdAt)],
      limit: 5,
    })
  },
)

export const dismissNudge = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ nudgeId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { couple } = await optionalCouple()

    if (!couple) {
      return { ok: true }
    }

    await db.update(coachNudges)
      .set({ dismissed: true })
      .where(and(
        eq(coachNudges.id, data.nudgeId),
        eq(coachNudges.coupleId, couple.id),
      ))

    return { ok: true }
  })

export const getCoachStarter = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { session, couple } = await optionalCouple()

    // Solo user — return generic solo starters
    if (!couple) {
      return {
        insight: "Welcome! I'm your relationship coach. I can help you reflect on your relationships, communication patterns, and emotional well-being — even before connecting with a partner.",
        suggestions: [
          'What makes a healthy relationship?',
          'Help me communicate better',
          'I want to understand my attachment style',
          'How can I prepare for a difficult conversation?',
        ],
      }
    }

    const partnerId = couple.userAId === session.user.id
      ? couple.userBId
      : couple.userAId

    const [partner, recentMessages] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, partnerId),
        columns: { name: true },
      }),
      db.query.messages.findMany({
        where: eq(messages.coupleId, couple.id),
        orderBy: [desc(messages.timestamp)],
        limit: 20,
        columns: {
          senderId: true,
          text: true,
        },
      }),
    ])

    const partnerName = partner?.name ?? 'your partner'

    const formatted = recentMessages
      .filter((m) => Boolean(m.text))
      .reverse()
      .map((m) => ({
        sender: m.senderId === session.user.id ? 'You' : partnerName,
        text: m.text ?? '',
      }))

    if (formatted.length === 0) {
      return null
    }

    const { generateCoachStarter } = await import('@amore-couples/ai')
    return generateCoachStarter(formatted, partnerName)
  })
