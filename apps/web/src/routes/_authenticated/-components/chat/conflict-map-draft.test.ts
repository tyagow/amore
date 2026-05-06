import { describe, expect, it } from 'vitest'
import { buildConflictMapDraft } from './conflict-map-draft'

describe('conflict map draft builder', () => {
  it('separates observation, feeling, story, and request', () => {
    const draft = buildConflictMapDraft({
      observation: 'the plans changed after I had already organized my night',
      feeling: 'I felt unimportant and caught off guard',
      story: 'I started telling myself my time did not matter',
      request: 'could we tell each other earlier when plans shift?',
    })

    expect(draft).toContain('What I noticed: the plans changed after I had already organized my night.')
    expect(draft).toContain('What I felt: I felt unimportant and caught off guard.')
    expect(draft).toContain('The story I started telling myself: I started telling myself my time did not matter.')
    expect(draft).toContain('could we tell each other earlier when plans shift?')
    expect(draft).toContain('smaller version or another time')
  })

  it('uses non-accusatory fallbacks for blank fields', () => {
    const draft = buildConflictMapDraft()

    expect(draft).toContain('keeps us on the same team')
    expect(draft).toContain('today')
    expect(draft).toContain('without adding blame or motive')
    expect(draft).toContain('may not be the whole truth')
    expect(draft).toContain('Could we slow down and understand what happened for each of us?')
  })
})
