import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { db } from '@amore-couples/db'
import { couples } from '@amore-couples/db/schema'
import { eq, or } from 'drizzle-orm'

/**
 * Shared authorization helper: verifies the authenticated user belongs to a couple.
 * Use in all couple-scoped server functions.
 * Returns { session, couple, partnerId } or throws error.
 */
export async function requireCouple() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  if (!session) {
    throw new Error('Unauthorized')
  }

  const couple = await db.query.couples.findFirst({
    where: or(
      eq(couples.userAId, session.user.id),
      eq(couples.userBId, session.user.id),
    ),
  })

  if (!couple || couple.status !== 'active') {
    throw new Error('No active couple found')
  }

  const partnerId = couple.userAId === session.user.id
    ? couple.userBId
    : couple.userAId

  return { session, couple, partnerId }
}
