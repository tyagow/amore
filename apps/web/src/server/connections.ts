import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { db } from '@amore-couples/db'
import { users, couples, connectionRequests } from '@amore-couples/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { emitUserEvent } from '~/lib/events'

// ── Helpers ─────────────────────────────────────────────

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

// ── Server Functions ────────────────────────────────────

/**
 * Search for a user by email and send a connection request.
 * Returns a generic message regardless of whether the user exists
 * to prevent email enumeration.
 */
export const searchAndSendRequest = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const session = await requireAuth()
    const { email } = data

    if (email.toLowerCase() === session.user.email.toLowerCase()) {
      throw new Error('You cannot send a connection request to yourself')
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    if (!targetUser) {
      // Return generic message to prevent email enumeration
      return { message: 'If this email is registered, a connection request has been sent.' }
    }

    // Check if users already have an active couple
    const [userAId, userBId] = [session.user.id, targetUser.id].sort()
    const existingCouple = await db.query.couples.findFirst({
      where: and(
        eq(couples.userAId, userAId),
        eq(couples.userBId, userBId),
        eq(couples.status, 'active'),
      ),
    })
    if (existingCouple) {
      throw new Error('You are already connected with this person')
    }

    // Check for existing pending request in either direction
    const existingRequest = await db.query.connectionRequests.findFirst({
      where: and(
        or(
          and(
            eq(connectionRequests.fromUserId, session.user.id),
            eq(connectionRequests.toUserId, targetUser.id),
          ),
          and(
            eq(connectionRequests.fromUserId, targetUser.id),
            eq(connectionRequests.toUserId, session.user.id),
          ),
        ),
        eq(connectionRequests.status, 'pending'),
      ),
    })
    if (existingRequest) {
      // Still return generic message
      return { message: 'If this email is registered, a connection request has been sent.' }
    }

    await db.insert(connectionRequests).values({
      fromUserId: session.user.id,
      toUserId: targetUser.id,
      status: 'pending',
    })

    // Notify the target user in real-time
    emitUserEvent(targetUser.id, {
      type: 'connection_request_received',
      data: {
        fromUserName: session.user.name,
        fromUserEmail: session.user.email,
      },
    })

    return { message: 'If this email is registered, a connection request has been sent.' }
  })

/**
 * Get all pending incoming connection requests for the current user.
 */
export const getPendingRequests = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    const requests = await db
      .select({
        id: connectionRequests.id,
        fromUserId: connectionRequests.fromUserId,
        fromUserName: users.name,
        fromUserEmail: users.email,
        createdAt: connectionRequests.createdAt,
      })
      .from(connectionRequests)
      .innerJoin(users, eq(users.id, connectionRequests.fromUserId))
      .where(
        and(
          eq(connectionRequests.toUserId, session.user.id),
          eq(connectionRequests.status, 'pending'),
        ),
      )

    return requests
  },
)

/**
 * Get all pending outgoing connection requests sent by the current user.
 */
export const getSentRequests = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    const requests = await db
      .select({
        id: connectionRequests.id,
        toUserEmail: users.email,
        createdAt: connectionRequests.createdAt,
        status: connectionRequests.status,
      })
      .from(connectionRequests)
      .innerJoin(users, eq(users.id, connectionRequests.toUserId))
      .where(eq(connectionRequests.fromUserId, session.user.id))

    return requests
  },
)

/**
 * Accept a connection request: update status and create the couple row.
 */
export const acceptConnectionRequest = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ requestId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireAuth()
    const { requestId } = data

    const request = await db.query.connectionRequests.findFirst({
      where: and(
        eq(connectionRequests.id, requestId),
        eq(connectionRequests.toUserId, session.user.id),
        eq(connectionRequests.status, 'pending'),
      ),
    })

    if (!request) {
      throw new Error('Connection request not found')
    }

    // Enforce canonical ordering: userAId < userBId
    const [userAId, userBId] = [request.fromUserId, session.user.id].sort()

    await db.transaction(async (tx) => {
      await tx
        .update(connectionRequests)
        .set({ status: 'accepted' })
        .where(eq(connectionRequests.id, requestId))

      await tx.insert(couples).values({
        userAId,
        userBId,
        status: 'active',
      })
    })

    // Notify the sender that their request was accepted
    emitUserEvent(request.fromUserId, {
      type: 'connection_request_accepted',
      data: {
        acceptedByName: session.user.name,
        acceptedByEmail: session.user.email,
      },
    })

    return { success: true }
  })

/**
 * Decline a connection request.
 */
export const declineConnectionRequest = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ requestId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireAuth()
    const { requestId } = data

    await db
      .update(connectionRequests)
      .set({ status: 'declined' })
      .where(
        and(
          eq(connectionRequests.id, requestId),
          eq(connectionRequests.toUserId, session.user.id),
          eq(connectionRequests.status, 'pending'),
        ),
      )

    return { success: true }
  })

/**
 * Check if the current user already has an active couple.
 */
export const getMyCouple = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()

    const couple = await db.query.couples.findFirst({
      where: and(
        or(
          eq(couples.userAId, session.user.id),
          eq(couples.userBId, session.user.id),
        ),
        eq(couples.status, 'active'),
      ),
    })

    if (!couple) return null

    // Get partner info
    const partnerId =
      couple.userAId === session.user.id ? couple.userBId : couple.userAId
    const partner = await db.query.users.findFirst({
      where: eq(users.id, partnerId),
      columns: { id: true, name: true, email: true },
    })

    return { couple, partner }
  },
)
