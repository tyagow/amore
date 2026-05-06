import { describe, expect, it } from 'vitest'
import { buildAftercareDraft } from './aftercare-draft'

describe('buildAftercareDraft', () => {
  it('turns a hard draft into a short aftercare structure', () => {
    const draft = buildAftercareDraft('I felt hurt when we ended the call without saying goodnight.')

    expect(draft).toContain('After we talk about this')
    expect(draft).toContain('I care about us ending')
    expect(draft).toContain('One thing each of us understood')
    expect(draft).toContain('One repair or reassurance we need tonight')
    expect(draft).toContain('One tiny next step for the next 24 hours')
    expect(draft).toContain('come back to the rest later')
    expect(draft).toContain('I felt hurt when we ended the call without saying goodnight.')
  })

  it('still works without a source draft', () => {
    const draft = buildAftercareDraft('   ')

    expect(draft).toContain('Could we end with three small things?')
    expect(draft).not.toContain('The thing I want us to use this for is:')
  })

  it('caps long source drafts so the message stays usable', () => {
    const draft = buildAftercareDraft('We need to talk. '.repeat(40))

    expect(draft.length).toBeLessThan(520)
    expect(draft).toContain('...')
  })
})
