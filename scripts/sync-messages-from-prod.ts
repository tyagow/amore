/**
 * Pull messages from Railway prod DB into local dev DB.
 * Run: pnpm run dev:sync
 *
 * Use this when your local DB falls behind prod (e.g. after being offline).
 * Safe to run repeatedly — uses ON CONFLICT DO NOTHING.
 */
import pg from 'pg'

const PROD_DB_URL = process.env.PROD_DATABASE_URL
if (!PROD_DB_URL) {
  console.error('PROD_DATABASE_URL not set — add it to .env.local')
  process.exit(1)
}
const LOCAL_DB_URL = process.env.DATABASE_URL

if (!LOCAL_DB_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

async function main() {
  const local = new pg.Pool({ connectionString: LOCAL_DB_URL })
  const prod = new pg.Pool({ connectionString: PROD_DB_URL })

  // Get local couple IDs
  const localCouples = await local.query('SELECT id FROM couples')
  const coupleIds = localCouples.rows.map((r: any) => r.id)

  if (coupleIds.length === 0) {
    console.log('No couples in local DB — nothing to sync.')
    process.exit(0)
  }

  let total = 0
  for (const coupleId of coupleIds) {
    // Get latest local message timestamp
    const latest = await local.query(
      'SELECT timestamp FROM messages WHERE couple_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [coupleId]
    )
    const since = latest.rows[0]?.timestamp || new Date('2020-01-01')

    // Pull newer messages from prod
    const prodMsgs = await prod.query(
      'SELECT * FROM messages WHERE couple_id = $1 AND timestamp > $2 ORDER BY timestamp ASC',
      [coupleId, since]
    )

    if (prodMsgs.rows.length === 0) {
      console.log(`Couple ${coupleId.slice(0,8)}: already up to date`)
      continue
    }

    let inserted = 0
    for (const m of prodMsgs.rows) {
      try {
        await local.query(
          `INSERT INTO messages (id, couple_id, wa_message_id, sender_id, text, timestamp, sentiment, is_media, media_type, source, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
          [m.id, m.couple_id, m.wa_message_id, m.sender_id, m.text, m.timestamp, m.sentiment, m.is_media, m.media_type, m.source, m.created_at]
        )
        inserted++
      } catch { /* skip */ }
    }
    console.log(`Couple ${coupleId.slice(0,8)}: synced ${inserted} new messages`)
    total += inserted
  }

  console.log(`Done. ${total} messages synced.`)
  await local.end()
  await prod.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
