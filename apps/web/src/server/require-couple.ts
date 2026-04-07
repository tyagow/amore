import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { db } from '@amore-couples/db'
import { couples } from '@amore-couples/db/schema'
import { and, eq, inArray, or } from 'drizzle-orm'
import { getUserPlan, getUserPlanSolo } from './plan'

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
    where: and(
      or(
        eq(couples.userAId, session.user.id),
        eq(couples.userBId, session.user.id),
      ),
      inArray(couples.status, ['active', 'solo']),
    ),
  })

  if (!couple) {
    throw new Error('No active couple found')
  }

  const partnerId = couple.userAId === session.user.id
    ? couple.userBId
    : couple.userAId

  const getPlan = () => getUserPlan(couple.id)

  return { session, couple, partnerId, getPlan }
}

/**
 * Get authenticated session only (no couple required).
 * Use for solo-user features like solo coach.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Try to get couple, return null if none exists.
 * Use when a feature works both with and without a couple.
 */
export async function optionalCouple() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  if (!session) {
    throw new Error('Unauthorized')
  }

  const couple = await db.query.couples.findFirst({
    where: and(
      or(
        eq(couples.userAId, session.user.id),
        eq(couples.userBId, session.user.id),
      ),
      inArray(couples.status, ['active', 'solo']),
    ),
  })

  if (!couple) {
    const getPlan = () => getUserPlanSolo(session.user.id)
    return { session, couple: null, partnerId: null, getPlan }
  }

  const partnerId = couple.userAId === session.user.id
    ? couple.userBId
    : couple.userAId

  const getPlan = () => getUserPlan(couple.id)

  return { session, couple, partnerId, getPlan }
}
