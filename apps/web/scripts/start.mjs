import { runMigrations } from '../../../packages/db/scripts/run-migrations.mjs'

await runMigrations({ serviceName: 'web' })
await import('../.output/server/index.mjs')
