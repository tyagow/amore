import { describe, expect, it } from 'vitest'
import { buildReassuranceDraft } from './reassurance-draft'

describe('buildReassuranceDraft', () => {
  it('builds a concise reassurance message with user context', () => {
    const draft = buildReassuranceDraft({
      care: 'I love you and I am not giving up on us',
      worry: 'I know last night felt tense',
      nextStep: 'Could we have a quiet reset after dinner?',
    })

    expect(draft).toContain('I love you and I am not giving up on us.')
    expect(draft).toContain('I know last night felt tense.')
    expect(draft).toContain('Could we have a quiet reset after dinner?')
    expect(draft).toContain('smaller version or another time')
  })

  it('uses non-abandoning fallback language', () => {
    const draft = buildReassuranceDraft()

    expect(draft).toContain('I care about us and I am still here.')
    expect(draft).toContain('distance between us')
    expect(draft).toContain('one small step back toward each other')
    expect(draft).toContain('If that does not work')
  })
})
