import { describe, expect, it } from 'vitest'
import { buildFollowUpDraft } from './follow-up-draft'

describe('follow-up draft', () => {
  it('builds a generic follow-up when the draft is blank', () => {
    const draft = buildFollowUpDraft('   ')

    expect(draft).toContain('check how my message landed today')
    expect(draft).toContain('not asking you to reassure me')
    expect(draft).toContain('understand, repair, or say differently')
    expect(draft).toContain('listen first')
    expect(draft).toContain('come back to it later')
  })

  it('keeps the original topic without repeating the entire hard message', () => {
    const draft = buildFollowUpDraft('Hey, I felt hurt when plans changed after I arranged my night. I got defensive after that.')

    expect(draft).toContain('About this: I felt hurt when plans changed after I arranged my night')
    expect(draft).toContain('I can listen first')
    expect(draft).toContain('not asking you to reassure me')
    expect(draft).not.toContain('I got defensive after that')
  })

  it('keeps long topics readable', () => {
    const draft = buildFollowUpDraft('I am worried that we keep having the same conversation about plans changing at the last minute when I already organized my night around what we said earlier.')

    expect(draft).toContain('...')
    expect(draft.length).toBeLessThan(440)
  })
})
