type AIUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

type UsagePricing = {
  inputPerMillion: number
  outputPerMillion: number
  cacheCreationPerMillion?: number
  cacheReadPerMillion?: number
}

const MODEL_PRICING: Array<[match: RegExp, pricing: UsagePricing]> = [
  [/haiku/i, { inputPerMillion: 0.8, outputPerMillion: 4 }],
  [/sonnet/i, { inputPerMillion: 3, outputPerMillion: 15, cacheCreationPerMillion: 3.75, cacheReadPerMillion: 0.3 }],
  [/opus/i, { inputPerMillion: 15, outputPerMillion: 75, cacheCreationPerMillion: 18.75, cacheReadPerMillion: 1.5 }],
]

function estimateCost(model: string, usage: AIUsage): number | null {
  const pricing = MODEL_PRICING.find(([match]) => match.test(model))?.[1]
  if (!pricing) return null

  const inputCost = ((usage.input_tokens ?? 0) / 1_000_000) * pricing.inputPerMillion
  const outputCost = ((usage.output_tokens ?? 0) / 1_000_000) * pricing.outputPerMillion
  const cacheCreationCost = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * (pricing.cacheCreationPerMillion ?? 0)
  const cacheReadCost = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * (pricing.cacheReadPerMillion ?? 0)

  return Number((inputCost + outputCost + cacheCreationCost + cacheReadCost).toFixed(6))
}

export function logAIUsage(model: string | null | undefined, usage: AIUsage | null | undefined) {
  if (!model || !usage) return

  console.log(JSON.stringify({
    type: 'ai_usage',
    model,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    cost_estimate: estimateCost(model, usage),
    timestamp: new Date().toISOString(),
  }))
}
