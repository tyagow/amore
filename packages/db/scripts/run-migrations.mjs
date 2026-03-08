import crypto from 'node:crypto'
import fs from 'node:fs'
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
const migrationsJournalPath = path.join(migrationsFolder, 'meta', '_journal.json')
const MIGRATIONS_SCHEMA = 'drizzle'
const MIGRATIONS_TABLE = '__drizzle_migrations'

function loadMigrationMetadata() {
  const journal = JSON.parse(fs.readFileSync(migrationsJournalPath, 'utf8'))

  return journal.entries.map((entry) => {
    const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    return {
      tag: entry.tag,
      folderMillis: entry.when,
      hash: crypto.createHash('sha256').update(sql).digest('hex'),
      createdTables: [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((match) => match[1]),
    }
  })
}

async function ensureMigrationJournalTable(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)
}

async function maybeBaselineExistingSchema(client) {
  const migrations = loadMigrationMetadata()

  if (migrations.length === 0) {
    return
  }

  await ensureMigrationJournalTable(client)

  const journalResult = await client.query(
    `SELECT count(*)::int AS count FROM "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"`,
  )
  const existingJournalCount = journalResult.rows[0]?.count ?? 0

  if (existingJournalCount > 0) {
    return
  }

  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  const existingTables = new Set(tablesResult.rows.map((row) => row.table_name))

  if (existingTables.size === 0) {
    return
  }

  const expectedTables = new Set(migrations.flatMap((migration) => migration.createdTables))
  const missingTables = [...expectedTables].filter((table) => !existingTables.has(table))

  if (missingTables.length > 0) {
    throw new Error(
      `[db] detected an existing public schema with an empty Drizzle journal, but it does not match the checked-in baseline migration. Missing tables: ${missingTables.join(', ')}`,
    )
  }

  for (const migration of migrations) {
    await client.query(
      `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at") VALUES ($1, $2)`,
      [migration.hash, migration.folderMillis],
    )
  }

  console.log(
    `[db] bootstrapped ${migrations.length} migration journal entr${migrations.length === 1 ? 'y' : 'ies'} from existing schema`,
  )
}

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
    await maybeBaselineExistingSchema(client)

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
