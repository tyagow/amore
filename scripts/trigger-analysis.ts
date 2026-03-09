/**
 * Manually trigger analysis for a user by email.
 *
 * Run from apps/wa-bridge (which has tsx + pg available):
 *   cd apps/wa-bridge && pnpm exec tsx ../../scripts/trigger-analysis.ts --email user@example.com
 *
 * Options:
 *   --email         (required) User email to look up
 *   --bridge-url    Bridge URL (default: production)
 *   --db-url        Database URL (default: env DATABASE_URL)
 *
 * Requires WA_BRIDGE_JWT_SECRET env var for bridge auth.
 */
import pg from 'pg'
import { SignJWT } from 'jose'

// ── Parse CLI args ──────────────────────────────────────

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined
  return process.argv[idx + 1]
}

const email = getArg('email')
if (!email) {
  console.error('ERROR: --email is required')
  console.error('Usage: npx tsx scripts/trigger-analysis.ts --email user@example.com')
  process.exit(1)
}

const bridgeUrl = getArg('bridge-url')
  ?? 'https://wa-bridge-production-4da8.up.railway.app'

const jwtSecret = process.env.WA_BRIDGE_JWT_SECRET
if (!jwtSecret) {
  console.error('ERROR: WA_BRIDGE_JWT_SECRET env var is required')
  process.exit(1)
}
const jwtSecretKey = new TextEncoder().encode(jwtSecret)

const dbUrl = getArg('db-url')
  ?? process.env.DATABASE_URL

if (!dbUrl) {
  console.error('ERROR: --db-url or DATABASE_URL env var is required')
  process.exit(1)
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log(`Looking up user: ${email}`)
  console.log(`Bridge URL: ${bridgeUrl}`)
  console.log()

  const pool = new pg.Pool({ connectionString: dbUrl })

  try {
    // 1. Find user by email
    const userResult = await pool.query(
      'SELECT id, email, name, plan, created_at FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      console.error(`No user found with email: ${email}`)
      process.exit(1)
    }

    const user = userResult.rows[0]
    console.log('--- User ---')
    console.log(`  ID:      ${user.id}`)
    console.log(`  Email:   ${user.email}`)
    console.log(`  Name:    ${user.name ?? '(not set)'}`)
    console.log(`  Plan:    ${user.plan}`)
    console.log(`  Created: ${user.created_at}`)
    console.log()

    // 2. Find their couple (user can be user_a or user_b)
    const coupleResult = await pool.query(
      `SELECT c.id, c.status, c.user_a_id, c.user_b_id, c.whatsapp_jid,
              c.health_score, c.last_analyzed, c.messages_since_analysis, c.created_at
       FROM couples c
       WHERE c.user_a_id = $1 OR c.user_b_id = $1`,
      [user.id]
    )

    if (coupleResult.rows.length === 0) {
      console.error('No couple found for this user.')
      process.exit(1)
    }

    const couple = coupleResult.rows[0]

    // Get partner info
    const partnerId = couple.user_a_id === user.id ? couple.user_b_id : couple.user_a_id
    const partnerResult = await pool.query(
      'SELECT email, name FROM users WHERE id = $1',
      [partnerId]
    )
    const partner = partnerResult.rows[0]

    console.log('--- Couple ---')
    console.log(`  ID:             ${couple.id}`)
    console.log(`  Status:         ${couple.status}`)
    console.log(`  Partner:        ${partner?.name ?? '(not set)'} (${partner?.email ?? 'unknown'})`)
    console.log(`  WhatsApp JID:   ${couple.whatsapp_jid ?? '(not set)'}`)
    console.log(`  Health Score:   ${couple.health_score ?? '(not analyzed)'}`)
    console.log(`  Last Analyzed:  ${couple.last_analyzed ?? 'never'}`)
    console.log(`  Msgs Since:     ${couple.messages_since_analysis}`)
    console.log(`  Created:        ${couple.created_at}`)
    console.log()

    // 3. Count messages
    const msgResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE couple_id = $1',
      [couple.id]
    )
    const messageCount = parseInt(msgResult.rows[0].count, 10)
    console.log(`Total messages in DB: ${messageCount}`)
    console.log()

    if (messageCount === 0) {
      console.error('No messages found for this couple. Analysis requires messages.')
      process.exit(1)
    }

    // 4. Trigger analysis
    console.log(`Triggering analysis for couple ${couple.id}...`)
    const url = `${bridgeUrl}/analysis/${couple.id}`

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('script:trigger-analysis')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(jwtSecretKey)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const body = await response.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      parsed = body
    }

    if (!response.ok) {
      console.error(`Bridge returned ${response.status}: ${JSON.stringify(parsed, null, 2)}`)
      process.exit(1)
    }

    console.log(`Response (${response.status}): ${JSON.stringify(parsed, null, 2)}`)
    console.log()
    console.log('Analysis triggered successfully. It runs asynchronously on the bridge.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
