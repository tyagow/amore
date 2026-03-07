/**
 * SSE endpoint for user-scoped events (connection requests).
 * Works without an active couple — used on /connect page.
 *
 * Nitro server route: GET /sse/user-events
 */

import { defineEventHandler, createError } from 'h3'
import { auth } from '../../../src/lib/auth'
import { subscribeUserEvents, type UserEvent } from '../../../src/lib/events'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

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

      send(JSON.stringify({ type: 'connected', userId: session.user.id }))

      const unsubscribe = subscribeUserEvents(session.user.id, (evt: UserEvent) => {
        send(JSON.stringify(evt))
      })

      const keepalive = setInterval(() => {
        send(JSON.stringify({ type: 'ping' }))
      }, 30_000)

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
      'X-Accel-Buffering': 'no',
    },
  })
})
