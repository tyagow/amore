import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from './chat/draft-care-check'
import { buildCloseLoopPracticeDraft } from './relationship-practice-draft'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('relationship practice drafts', () => {
  it('builds a close-the-loop practice draft', () => {
    const draft = buildCloseLoopPracticeDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('close the loop')
    expect(draft).toContain('I care about making follow-through visible')
    expect(draft).toContain('What I said I would do')
    expect(draft).toContain('What I actually did')
    expect(draft).toContain('follow through on more clearly')
    expect(draft).toContain('come back to it later today')
    expectCareReady(draft)
  })
})
