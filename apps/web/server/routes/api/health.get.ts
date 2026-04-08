import { db } from '@amore-couples/db'
import { sql } from 'drizzle-orm'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  try {
    await db.execute(sql`SELECT 1`)
    return {
      ok: true,
      service: 'web',
      db: 'connected',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      ok: false,
      service: 'web',
      db: 'disconnected',
      error: String(error),
      timestamp: new Date().toISOString(),
    }
  }
})
