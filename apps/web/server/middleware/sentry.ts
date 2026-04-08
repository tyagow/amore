import { defineEventHandler } from 'h3'
import * as Sentry from '@sentry/node'

export default defineEventHandler((event) => {
  const context = event.context as typeof event.context & { _sentryEnabled?: boolean }
  context._sentryEnabled = true

  if (process.env.SENTRY_DSN) {
    Sentry.setTag('service', 'web')
  }
})
