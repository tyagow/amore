import { z } from 'zod'

export const AI_MODEL = 'claude-sonnet-4-6'
export const FAST_MODEL = 'claude-haiku-4-5-20251001'
export const MAX_ANALYSIS_MESSAGES = 200
export const MAX_EXTRACT_MESSAGES = 500

export class AIParseError extends Error {
  public readonly rawText: string

  constructor(message: string, rawText: string) {
    super(message)
    this.name = 'AIParseError'
    this.rawText = rawText
  }
}

export function parseAIResponse<T>(text: string): T {
  // Try direct JSON.parse first
  try {
    return JSON.parse(text) as T
  } catch {
    // Fall back to extracting JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]) as T
      } catch {
        throw new AIParseError(
          `Failed to parse JSON from code block: ${codeBlockMatch[1].slice(0, 100)}...`,
          text,
        )
      }
    }

    throw new AIParseError(
      `Failed to parse AI response as JSON: ${text.slice(0, 100)}...`,
      text,
    )
  }
}

export function parseValidatedResponse<T>(text: string, schema: z.ZodType<T>): T {
  // Try direct JSON.parse first
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    // Fall back to extracting JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (codeBlockMatch) {
      try {
        raw = JSON.parse(codeBlockMatch[1])
      } catch {
        throw new AIParseError(
          `Failed to parse JSON from code block: ${codeBlockMatch[1].slice(0, 100)}...`,
          text,
        )
      }
    } else {
      throw new AIParseError(
        `Failed to parse AI response as JSON: ${text.slice(0, 100)}...`,
        text,
      )
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new AIParseError(
      `AI response validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      text,
    )
  }
  return result.data
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      // Never retry parse errors — retrying won't change the response format
      if (err instanceof AIParseError) throw err
      // Never retry auth errors
      if (isApiError(err, 401) || isApiError(err, 403)) throw err
      // Abort errors should not be retried
      if (err instanceof Error && err.name === 'AbortError') throw err

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const baseDelay = 2000 * Math.pow(2, attempt)
        // Respect Retry-After header if present
        const retryAfter = getRetryAfterMs(err)
        const delay = retryAfter ?? baseDelay
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

function isApiError(err: unknown, statusCode: number): boolean {
  if (!(err instanceof Error)) return false
  // Anthropic SDK throws errors with a `status` property
  return 'status' in err && (err as { status: number }).status === statusCode
}

function getRetryAfterMs(err: unknown): number | undefined {
  if (!(err instanceof Error) || !('headers' in err)) return undefined
  const headers = (err as { headers?: Record<string, string> }).headers
  const retryAfter = headers?.['retry-after']
  if (!retryAfter) return undefined
  const seconds = Number(retryAfter)
  return isNaN(seconds) ? undefined : seconds * 1000
}
