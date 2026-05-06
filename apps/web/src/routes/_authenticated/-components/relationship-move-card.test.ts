import { describe, expect, it } from 'vitest'
import { buildRelationshipRepairDraft } from './relationship-move-card'

describe('relationship move repair draft', () => {
  it('builds a warmer repair guide draft with room to defer', () => {
    const draft = buildRelationshipRepairDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('I care about making this conversation feel safer')
    expect(draft).toContain('One thing I appreciate about you')
    expect(draft).toContain('One part I can own')
    expect(draft).toContain('what repair would actually help')
    expect(draft).toContain('smaller moment later today')
  })
})
