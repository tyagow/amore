/**
 * Media proxy endpoint.
 *
 * Nitro server route: GET /api/media/:waMessageId
 *
 * Authenticates via session cookie, resolves the user's couple,
 * signs a short-lived JWT, and proxies the media request to wa-bridge.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { SignJWT } from 'jose'
import { auth } from '../../../../src/lib/auth'
import { db } from '@amore-couples/db'
import { couples } from '@amore-couples/db/schema'
import { eq, or } from 'drizzle-orm'

const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9945'
const WA_BRIDGE_JWT_SECRET = process.env.WA_BRIDGE_JWT_SECRET || ''
const jwtSecretKey = new TextEncoder().encode(WA_BRIDGE_JWT_SECRET)

export default defineEventHandler(async (event) => {
  // ── Auth ──────────────────────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: event.headers,
  })
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user.id
  const waMessageId = getRouterParam(event, 'waMessageId')
  if (!waMessageId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing waMessageId' })
  }

  // ── Resolve couple ────────────────────────────────────────────────
  const couple = await db.query.couples.findFirst({
    where: or(
      eq(couples.userAId, userId),
      eq(couples.userBId, userId),
    ),
  })
  if (!couple) {
    throw createError({ statusCode: 404, statusMessage: 'No couple found' })
  }

  // ── Sign JWT for wa-bridge ────────────────────────────────────────
  const token = await new SignJWT({
    coupleId: couple.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1m')
    .sign(jwtSecretKey)

  // ── Proxy to wa-bridge ────────────────────────────────────────────
  const response = await fetch(`${WA_BRIDGE_URL}/media/${waMessageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: response.status === 404 ? 'Media not available' : 'Media fetch failed',
    })
  }

  // ── Forward the response ──────────────────────────────────────────
  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=86400',
    },
  })
})
