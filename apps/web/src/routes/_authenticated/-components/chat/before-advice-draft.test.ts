import { describe, expect, it } from 'vitest'
import { buildBeforeAdviceDraft } from './before-advice-draft'

describe('buildBeforeAdviceDraft', () => {
  it('asks what kind of support is wanted before giving advice', () => {
    expect(buildBeforeAdviceDraft()).toBe([
      'I want to support you today in the way that actually helps, not just jump into fixing.',
      '',
      'Do you want comfort, listening, problem-solving, or a little space right now?',
      '',
      'I can follow your lead instead of guessing.',
    ].join('\n'))
  })

  it('normalizes custom support-check lines', () => {
    const draft = buildBeforeAdviceDraft({
      care: 'I am here with you',
      consentQuestion: 'Would advice help, or would listening feel better?',
      offer: 'I can slow down and do either',
    })

    expect(draft).toContain('I am here with you.')
    expect(draft).toContain('Would advice help, or would listening feel better?')
    expect(draft).toContain('I can slow down and do either.')
  })
})
