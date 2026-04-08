import Anthropic from '@anthropic-ai/sdk'
import { logAIUsage } from './usage-tracker'

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const originalCreate = anthropic.messages.create.bind(anthropic.messages)

    Object.defineProperty(anthropic.messages, 'create', {
      value: async (...args: Parameters<typeof originalCreate>) => {
        const response = await originalCreate(...args)
        const requestedModel = typeof args[0]?.model === 'string' ? args[0].model : undefined
        if (typeof response === 'object' && response !== null && 'usage' in response) {
          const trackedResponse = response as { model?: string; usage?: Parameters<typeof logAIUsage>[1] }
          logAIUsage(trackedResponse.model ?? requestedModel, trackedResponse.usage)
        }
        return response
      },
    })

    client = anthropic
  }
  return client
}
