/**
 * SSE endpoint for real-time couple dashboard updates.
 *
 * Nitro server route: GET /sse/updates
 *
 * Authenticates via session cookie, subscribes to couple-scoped events,
 * and streams them as Server-Sent Events. Sends keepalive pings every 30s.
 */

import { defineEventHandler, setResponseHeaders, createError } from 'h3'
import { auth } from '../../../src/lib/auth'
import { db } from '@amore-couples/db'
import { couples } from '@amore-couples/db/schema'
import { eq, or } from 'drizzle-orm'
import { subscribeCoupleEvents, type CoupleEvent } from '../../../src/lib/events'

export default defineEventHandler(async (event) => {
  // ── Auth ──────────────────────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // ── Resolve couple ────────────────────────────────────────────────
  const couple = await db.query.couples.findFirst({
    where: or(
      eq(couples.userAId, session.user.id),
      eq(couples.userBId, session.user.id),
    ),
  })

  if (!couple || couple.status !== 'active') {
    throw createError({ statusCode: 404, statusMessage: 'No active couple found' })
  }

  // ── SSE response ──────────────────────────────────────────────────
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  })

  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(data: string) {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // stream may be closed
        }
      }

      // Send initial connected event
      send(JSON.stringify({ type: 'connected', coupleId: couple.id }))

      // Subscribe to couple events
      const unsubscribe = subscribeCoupleEvents(couple.id, (evt: CoupleEvent) => {
        send(JSON.stringify(evt))
      })

      // Keepalive ping every 30 seconds
      const keepalive = setInterval(() => {
        send(JSON.stringify({ type: 'ping' }))
      }, 30_000)

      // Clean up on close
      event.node?.req.on('close', () => {
        unsubscribe()
        clearInterval(keepalive)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
})
