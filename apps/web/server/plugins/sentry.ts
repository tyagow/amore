import * as Sentry from '@sentry/node'
import { getEventContext } from 'h3'
import { definePlugin } from 'nitro'
import type { NitroApp, CapturedErrorContext } from 'nitro/types'

export default definePlugin(async (nitroApp: NitroApp) => {
  const { initSentry } = await import('../../src/lib/sentry')
  initSentry()

  nitroApp.hooks?.hook('error', (error: Error, context: CapturedErrorContext) => {
    if (context.event) {
      const eventContext = getEventContext(context.event) as { _sentryEnabled?: boolean }
      if (eventContext._sentryEnabled === false) {
        return
      }
    }

    Sentry.captureException(error)
  })
})
