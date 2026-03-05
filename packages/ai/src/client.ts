import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return client
}
