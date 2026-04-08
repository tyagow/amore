import * as Sentry from '@sentry/node'

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized || !process.env.SENTRY_DSN) return

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  })

  sentryInitialized = true
}
