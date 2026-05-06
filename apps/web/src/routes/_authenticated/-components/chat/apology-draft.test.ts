import { describe, expect, it } from 'vitest'
import { buildApologyDraft } from './apology-draft'

describe('apology draft builder', () => {
  it('turns apology notes into a clear owned repair message', () => {
    const draft = buildApologyDraft({
      action: 'I dismissed your concern too quickly',
      impact: 'it probably made you feel alone with it',
      ownership: 'I got defensive instead of listening first',
      repair: 'could I listen again and summarize what I missed?',
    })

    expect(draft).toContain('The specific moment I mean is when: I dismissed your concern too quickly.')
    expect(draft).toContain('The impact I can see: it probably made you feel alone with it.')
    expect(draft).toContain('What I own: I got defensive instead of listening first.')
    expect(draft).toContain('changed behavior, not just better words')
    expect(draft).toContain('What I will do differently next time')
    expect(draft).toContain('You do not have to reassure me or forgive me quickly')
    expect(draft).toContain('could I listen again and summarize what I missed?')
  })

  it('uses non-defensive fallback language for blank fields', () => {
    const draft = buildApologyDraft()

    expect(draft).toContain('not make you take care of my feelings')
    expect(draft).toContain('I want to own my part without explaining it away')
    expect(draft).toContain('What would help repair this from here?')
  })
})
