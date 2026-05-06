import { describe, expect, it } from 'vitest'
import { buildCoachReviewPrompt } from './coach-review-prompt'

describe('coach review prompt', () => {
  it('wraps a draft with coach instructions', () => {
    const prompt = buildCoachReviewPrompt('I felt hurt when plans changed.')

    expect(prompt).toContain('Help me improve this message before I send it')
    expect(prompt).toContain('Draft:\nI felt hurt when plans changed.')
    expect(prompt).toContain('lower defensiveness')
    expect(prompt).toContain('name one real moment')
    expect(prompt).toContain('include warmth')
    expect(prompt).toContain('leave room for no or later')
    expect(prompt).toContain('make the request clear')
  })

  it('has a useful fallback for blank drafts', () => {
    const prompt = buildCoachReviewPrompt('   ')

    expect(prompt).toContain('honest, kind, and specific')
    expect(prompt).toContain('leave room for no or later')
    expect(prompt).toContain('make repair easier')
  })

  it('limits very long drafts before handing them to coach', () => {
    const prompt = buildCoachReviewPrompt('x'.repeat(900))

    expect(prompt).toContain('...')
    expect(prompt.length).toBeLessThan(850)
  })
})
