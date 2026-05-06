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

const localeSchema = z.enum(['en', 'pt-BR']).default('en')

/** Shared thread ownership check — verifies the thread belongs to the user's couple or to the user directly. */
async function findOwnedThread(threadId: string, userId: string, coupleId: string | null) {
  return db.query.coachThreads.findFirst({
    where: coupleId
      ? and(
          eq(coachThreads.id, threadId),
          or(
            eq(coachThreads.coupleId, coupleId),
            and(eq(coachThreads.userId, userId), isNull(coachThreads.coupleId)),
          ),
        )
      : and(
          eq(coachThreads.id, threadId),
          eq(coachThreads.userId, userId),
        ),
  })
}

const contextSnapshotSchema = z.record(z.string(), z.unknown())

export const getOrCreateThread = createServerFn({ method: 'POST' })
  .inputValidator(threadInputSchema)
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()

    if (data.threadId) {
      const existing = await findOwnedThread(data.threadId, session.user.id, couple?.id ?? null)
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

    const thread = await findOwnedThread(data.threadId, session.user.id, couple?.id ?? null)
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

    const thread = await findOwnedThread(data.threadId, session.user.id, couple?.id ?? null)
    if (thread) {
      await db.delete(coachThreads).where(eq(coachThreads.id, data.threadId))
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
    const thread = await findOwnedThread(data.threadId, session.user.id, couple?.id ?? null)
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
  .inputValidator(z.object({ locale: localeSchema }).optional())
  .handler(async ({ data }) => {
    const { session, couple } = await optionalCouple()
    const locale = data?.locale ?? 'en'

    // Solo user — return generic solo starters
    if (!couple) {
      return {
        insight: locale === 'pt-BR'
          ? 'Boas-vindas. Sou seu coach de relacionamento. Posso ajudar voce a refletir sobre relacionamentos, padroes de comunicacao e bem-estar emocional antes mesmo de conectar uma parceria.'
          : "Welcome! I'm your relationship coach. I can help you reflect on your relationships, communication patterns, and emotional well-being — even before connecting with a partner.",
        suggestions: locale === 'pt-BR'
          ? [
              'O que faz um relacionamento saudavel?',
              'Me ajude a comunicar melhor',
              'Quero entender meu estilo de apego',
              'Como me preparo para uma conversa dificil?',
            ]
          : [
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
    return generateCoachStarter(formatted, partnerName, locale)
  })
