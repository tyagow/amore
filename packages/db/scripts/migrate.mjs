import { config } from 'dotenv'
import { runMigrations } from './run-migrations.mjs'

config({ path: ['../../.env.local', '../../.env'] })

await runMigrations({ serviceName: '@amore-couples/db' })
