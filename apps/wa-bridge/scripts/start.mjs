import { spawn } from 'node:child_process'
import { runMigrations } from '../../../packages/db/scripts/run-migrations.mjs'

await runMigrations({ serviceName: 'wa-bridge' })

const child = spawn('npx', ['tsx', 'apps/wa-bridge/src/index.ts'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
