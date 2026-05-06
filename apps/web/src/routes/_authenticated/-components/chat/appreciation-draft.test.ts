import { describe, expect, it } from 'vitest'
import { buildAppreciationDraft } from './appreciation-draft'

describe('appreciation draft builder', () => {
  it('turns specific notes into a concrete appreciation', () => {
    const draft = buildAppreciationDraft({
      noticed: 'you made dinner even though you were tired',
      quality: 'it showed me your generosity',
      impact: 'I felt cared for and less alone',
      invitation: 'could we cook together one night this week?',
    })

    expect(draft).toContain('What I noticed: you made dinner even though you were tired.')
    expect(draft).toContain('I care about noticing what helps us feel close')
    expect(draft).toContain('What it showed me: it showed me your generosity.')
    expect(draft).toContain('How it landed for me: I felt cared for and less alone.')
    expect(draft).toContain('could we cook together one night this week?')
    expect(draft).toContain('smaller version or another time')
  })

  it('uses safe fallbacks for blank fields', () => {
    const draft = buildAppreciationDraft()

    expect(draft).toContain('something kind or meaningful you did')
    expect(draft).toContain('it helped me feel closer to you')
    expect(draft).toContain('Could we make a little more space')
    expect(draft).toContain('If that does not work')
  })
})
