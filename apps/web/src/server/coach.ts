import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@amore-couples/db'
import {
  coachMessages,
  coachNudges,
  coachThreads,
  messages,
} from '@amore-couples/db/schema'
import {
  and,
  asc,
  desc,
  eq,
} from 'drizzle-orm'
import { requireCouple } from './require-couple'
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
    const { couple } = await requireCouple()

    if (data.threadId) {
      const existing = await db.query.coachThreads.findFirst({
        where: and(
          eq(coachThreads.id, data.threadId),
          eq(coachThreads.coupleId, couple.id),
        ),
      })
      if (!existing) {
        throw new Error('Thread not found')
      }
      return existing
    }

    const [thread] = await db.insert(coachThreads).values({
      coupleId: couple.id,
    }).returning()

    return thread
  })

export const listThreads = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

    return db.query.coachThreads.findMany({
      where: eq(coachThreads.coupleId, couple.id),
      orderBy: [desc(coachThreads.updatedAt)],
      limit: 50,
    })
  },
)

export const getThreadMessages = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ threadId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple()

    const thread = await db.query.coachThreads.findFirst({
      where: and(
        eq(coachThreads.id, data.threadId),
        eq(coachThreads.coupleId, couple.id),
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
    const { couple } = await requireCouple()

    await db.delete(coachThreads).where(and(
      eq(coachThreads.id, data.threadId),
      eq(coachThreads.coupleId, couple.id),
    ))

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
    const { couple } = await requireCouple()

    const thread = await db.query.coachThreads.findFirst({
      where: and(
        eq(coachThreads.id, data.threadId),
        eq(coachThreads.coupleId, couple.id),
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

    return { ok: true }
  })

export const getCoachNudges = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { couple } = await requireCouple()

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
    const { couple } = await requireCouple()

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
    const { couple, session, partnerId } = await requireCouple()

    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.coupleId, couple.id),
      orderBy: [desc(messages.timestamp)],
      limit: 20,
      columns: {
        senderId: true,
        text: true,
      },
    })

    const formatted = recentMessages
      .filter((m) => Boolean(m.text))
      .reverse()
      .map((m) => ({
        sender: m.senderId === session.user.id ? 'You' : 'Partner',
        text: m.text ?? '',
      }))

    if (formatted.length === 0) {
      return null
    }

    const { generateCoachStarter } = await import('@amore-couples/ai')
    return generateCoachStarter(formatted)
  })
