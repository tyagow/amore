import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const { Pool } = pg
const MIGRATION_LOCK_ID = '728841221'
const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../drizzle',
)

export async function runMigrations({ serviceName = 'service' } = {}) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for migrations')
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  })

  const client = await pool.connect()

  try {
    console.log(`[db] ${serviceName}: waiting for migration lock`)
    await client.query('SELECT pg_advisory_lock($1::bigint)', [MIGRATION_LOCK_ID])

    console.log(`[db] ${serviceName}: ensuring pgcrypto extension`)
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')

    console.log(`[db] ${serviceName}: applying migrations from ${migrationsFolder}`)
    const db = drizzle(client)
    await migrate(db, { migrationsFolder })
    console.log(`[db] ${serviceName}: migrations complete`)
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1::bigint)', [MIGRATION_LOCK_ID])
    } catch (error) {
      console.error('[db] failed to release migration lock', error)
    }

    client.release()
    await pool.end()
  }
}
