import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@amore-couples/db'
import { waSessions, couples } from '@amore-couples/db/schema'
import { eq, or, and, ne } from 'drizzle-orm'
import {
  createBridgeSession,
  getBridgeSession,
  deleteBridgeSession,
} from '~/lib/wa-bridge'
import { auth } from '~/lib/auth'

/**
 * Resolve the authenticated user's couple. Throws if not in an active couple.
 */
async function resolveCouple(userId: string) {
  const couple = await db.query.couples.findFirst({
    where: or(
      eq(couples.userAId, userId),
      eq(couples.userBId, userId),
    ),
  })

  if (!couple || couple.status !== 'active') {
    throw new Error('No active couple found')
  }

  return couple
}

export const createWaSession = createServerFn({
  method: 'POST',
})
  .handler(async () => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('Unauthorized')

    const userId = session.user.id
    console.log('[wa-session] createWaSession called for user:', userId)
    try {
      await resolveCouple(userId) // ensure user is in a couple
    } catch (err) {
      console.error('[wa-session] resolveCouple failed:', err instanceof Error ? err.message : err)
      throw err
    }

    const bridgeSessionId = userId

    // Check if user already has a waSession row
    const [existing] = await db
      .select()
      .from(waSessions)
      .where(eq(waSessions.userId, userId))
      .limit(1)

    if (existing) {
      // Already have a session row -- check bridge status
      try {
        const bridge = await getBridgeSession(existing.bridgeSessionId)
        if (bridge.status === 'connected') {
          return { waSessionId: existing.id, status: 'connected' as const, needsQr: false }
        }
      } catch {
        // Bridge may be down -- fall through to reconnect
      }

      // Disconnected or unreachable -- clean slate reconnect
      try {
        await deleteBridgeSession(existing.bridgeSessionId)
      } catch { /* bridge may be down */ }

      await db
        .update(waSessions)
        .set({ status: 'connecting' })
        .where(eq(waSessions.id, existing.id))

      try {
        await createBridgeSession(existing.bridgeSessionId)
      } catch (err) {
        await db
          .update(waSessions)
          .set({ status: 'disconnected' })
          .where(eq(waSessions.id, existing.id))
        throw new Error(
          `Failed to start WhatsApp session: ${err instanceof Error ? err.message : 'unknown error'}`,
        )
      }

      return { waSessionId: existing.id, status: 'connecting' as const, needsQr: true }
    }

    // No existing session -- create a new one
    console.log('[wa-session] creating new wa_session row for user:', userId)
    const [waSession] = await db
      .insert(waSessions)
      .values({
        userId,
        bridgeSessionId,
        status: 'connecting',
      })
      .returning()

    try {
      console.log('[wa-session] calling createBridgeSession:', bridgeSessionId)
      await createBridgeSession(bridgeSessionId)
      console.log('[wa-session] bridge session created successfully')
    } catch (err) {
      console.error('[wa-session] createBridgeSession failed:', err instanceof Error ? err.message : err)
      await db
        .update(waSessions)
        .set({ status: 'disconnected' })
        .where(eq(waSessions.id, waSession.id))
      throw new Error(
        `Failed to start WhatsApp session: ${err instanceof Error ? err.message : 'unknown error'}`,
      )
    }

    return { waSessionId: waSession.id, status: 'connecting' as const, needsQr: true }
  })

export const pollWaSession = createServerFn({
  method: 'GET',
})
  .inputValidator(
    z.object({
      waSessionId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('Unauthorized')

    const [waSession] = await db
      .select()
      .from(waSessions)
      .where(eq(waSessions.id, data.waSessionId))
      .limit(1)

    if (!waSession) throw new Error('Not found')
    if (waSession.userId !== session.user.id) throw new Error('Not found')

    const bridge = await getBridgeSession(waSession.bridgeSessionId)

    if (bridge.status !== waSession.status) {
      await db
        .update(waSessions)
        .set({
          status: bridge.status,
          ...(bridge.status === 'connected'
            ? { lastConnected: new Date() }
            : {}),
        })
        .where(eq(waSessions.id, waSession.id))
    }

    return {
      status: bridge.status,
      qr: bridge.qr ?? null,
      messageCount: bridge.messageCount ?? 0,
    }
  })

export const getWaSessionStatus = createServerFn({
  method: 'GET',
})
  .handler(async () => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('Unauthorized')

    const [waSession] = await db
      .select({
        id: waSessions.id,
        status: waSessions.status,
        lastConnected: waSessions.lastConnected,
      })
      .from(waSessions)
      .where(and(
        eq(waSessions.userId, session.user.id),
        ne(waSessions.status, 'disconnected'),
      ))
      .limit(1)

    return { waSession: waSession ?? null }
  })

export const disconnectWaSession = createServerFn({
  method: 'POST',
})
  .inputValidator(
    z.object({
      waSessionId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('Unauthorized')

    const [waSession] = await db
      .select()
      .from(waSessions)
      .where(eq(waSessions.id, data.waSessionId))
      .limit(1)

    if (!waSession) throw new Error('Not found')
    if (waSession.userId !== session.user.id) throw new Error('Not found')

    try {
      await deleteBridgeSession(waSession.bridgeSessionId)
    } catch {
      // Bridge may already be down -- proceed with DB update
    }

    await db
      .update(waSessions)
      .set({ status: 'disconnected' })
      .where(eq(waSessions.id, waSession.id))

    return { status: 'disconnected' }
  })
