import { defineEventHandler, createError, getQuery } from 'h3'
import { auth } from '../../../src/lib/auth'
import { db } from '@amore-couples/db'
import { coachMessages, coachThreads, couples } from '@amore-couples/db/schema'
import { and, asc, eq, isNull, or } from 'drizzle-orm'
import {
  classifyIntent,
  streamCoachResponse,
  type ThreadMessage,
} from '@amore-couples/ai'
import { fetchCoachContext } from '../../lib/coach-context'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const threadId = typeof query.threadId === 'string' ? query.threadId : ''
  const message = typeof query.message === 'string' ? query.message.trim() : ''
  const currentPage =
    typeof query.currentPage === 'string' ? query.currentPage : undefined

  if (!threadId || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'threadId and message are required',
    })
  }

  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Try to find a couple (active or solo), but don't require one
  const couple = await db.query.couples.findFirst({
    where: and(
      or(
        eq(couples.userAId, session.user.id),
        eq(couples.userBId, session.user.id),
      ),
      or(
        eq(couples.status, 'active'),
        eq(couples.status, 'solo'),
      ),
    ),
  })

  // Verify thread ownership — either by couple or by userId
  const thread = couple
    ? await db.query.coachThreads.findFirst({
        where: and(
          eq(coachThreads.id, threadId),
          or(
            eq(coachThreads.coupleId, couple.id),
            and(eq(coachThreads.userId, session.user.id), isNull(coachThreads.coupleId)),
          ),
        ),
      })
    : await db.query.coachThreads.findFirst({
        where: and(
          eq(coachThreads.id, threadId),
          eq(coachThreads.userId, session.user.id),
        ),
      })

  if (!thread) {
    throw createError({ statusCode: 404, statusMessage: 'Thread not found' })
  }

  const partnerId = couple
    ? (couple.userAId === session.user.id ? couple.userBId : couple.userAId)
    : null

  const historyRows = await db.query.coachMessages.findMany({
    where: eq(coachMessages.threadId, threadId),
    orderBy: [asc(coachMessages.createdAt)],
    columns: {
      role: true,
      content: true,
    },
  })

  const threadHistory: ThreadMessage[] = historyRows.map((row) => ({
    role: row.role as ThreadMessage['role'],
    content: row.content,
  }))

  const intent = await classifyIntent(message)

  // Build context — full context for coupled users, minimal for solo
  const contextSnapshot = couple && partnerId
    ? await fetchCoachContext(couple.id, session.user.id, partnerId, intent)
    : {}  // Solo user — empty context, coach uses solo system prompt

  const textStream = await streamCoachResponse(
    threadHistory,
    message,
    contextSnapshot,
    currentPage,
    !couple,  // isSolo flag
  )

  const body = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let closed = false
      let keepalive: ReturnType<typeof setInterval> | null = null

      function send(payload: Record<string, unknown>) {
        if (closed) return

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          )
        } catch {
          closed = true
        }
      }

      function cleanup() {
        if (closed) return
        closed = true
        if (keepalive) clearInterval(keepalive)
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      event.node?.req.on('close', cleanup)
      keepalive = setInterval(() => {
        send({ type: 'ping' })
      }, 30_000)

      try {
        let fullResponse = ''

        for await (const chunk of textStream) {
          if (closed) break
          fullResponse += chunk
          send({ type: 'text', content: chunk })
        }

        send({
          type: 'done',
          content: fullResponse,
          contextSnapshot,
          intent,
        })
      } catch (error) {
        send({
          type: 'error',
          content: error instanceof Error ? error.message : 'Coach stream failed',
        })
      } finally {
        cleanup()
      }
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
