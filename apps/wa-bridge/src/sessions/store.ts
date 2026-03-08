import {
  BufferJSON,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataSet,
  type SignalKeyStore,
} from '@whiskeysockets/baileys'
import { Pool } from 'pg'
import { log } from '../logger.js'

const logger = log.child({ component: 'baileys-store', level: 'warn' })

// Schema (create these tables in PostgreSQL):
// CREATE TABLE wa_auth_creds (
//   session_id TEXT PRIMARY KEY,
//   creds JSONB NOT NULL,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE TABLE wa_auth_keys (
//   session_id TEXT NOT NULL,
//   type TEXT NOT NULL,
//   id TEXT NOT NULL,
//   value JSONB,
//   PRIMARY KEY (session_id, type, id)
// );

export async function usePostgresAuthState(
  pool: Pool,
  sessionId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  // Load or init credentials
  const credsRow = await pool.query(
    'SELECT creds FROM wa_auth_creds WHERE session_id = $1',
    [sessionId],
  )

  let creds: AuthenticationCreds
  if (credsRow.rows.length > 0) {
    creds = JSON.parse(JSON.stringify(credsRow.rows[0].creds), BufferJSON.reviver)
  } else {
    creds = initAuthCreds()
    await pool.query(
      'INSERT INTO wa_auth_creds (session_id, creds) VALUES ($1, $2)',
      [sessionId, JSON.parse(JSON.stringify(creds, BufferJSON.replacer))],
    )
  }

  // Build signal key store
  const rawKeys: SignalKeyStore = {
    async get(type, ids) {
      const data: Record<string, any> = {}
      if (ids.length === 0) return data

      const placeholders = ids.map((_, i) => `$${i + 3}`).join(', ')
      const result = await pool.query(
        `SELECT id, value FROM wa_auth_keys WHERE session_id = $1 AND type = $2 AND id IN (${placeholders})`,
        [sessionId, type, ...ids],
      )

      for (const row of result.rows) {
        data[row.id] = JSON.parse(JSON.stringify(row.value), BufferJSON.reviver)
      }
      return data
    },

    async set(data: SignalDataSet) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (const category in data) {
          const entries = data[category as keyof typeof data]!
          for (const id in entries) {
            const value = entries[id]
            if (value) {
              // Always pass as JSON string + cast to JSONB to avoid pg driver
              // mishandling primitives (e.g. LID session numbers like 34)
              const jsonStr = JSON.stringify(value, BufferJSON.replacer)
              await client.query(
                `INSERT INTO wa_auth_keys (session_id, type, id, value) VALUES ($1, $2, $3, $4::jsonb)
                 ON CONFLICT (session_id, type, id) DO UPDATE SET value = $4::jsonb`,
                [sessionId, category, id, jsonStr],
              )
            } else {
              await client.query(
                'DELETE FROM wa_auth_keys WHERE session_id = $1 AND type = $2 AND id = $3',
                [sessionId, category, id],
              )
            }
          }
        }
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    },
  }

  return {
    state: {
      creds,
      keys: makeCacheableSignalKeyStore(rawKeys, logger),
    },
    saveCreds: async () => {
      const jsonCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer))
      await pool.query(
        `INSERT INTO wa_auth_creds (session_id, creds, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (session_id) DO UPDATE SET creds = $2, updated_at = NOW()`,
        [sessionId, jsonCreds],
      )
    },
  }
}
