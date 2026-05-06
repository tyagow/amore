import { describe, expect, it } from 'vitest'
import { buildBidRepairDraft } from './bid-repair-draft'

describe('bid repair draft builder', () => {
  it('builds a repair message for a missed connection bid', () => {
    const draft = buildBidRepairDraft({
      missed: 'you tried to tell me about your day and I stayed on my phone',
      impact: 'it probably made you feel unimportant',
      wish: 'I wish I had put the phone down and listened',
      offer: 'can I ask about it now and listen properly?',
    })

    expect(draft).toContain('What I missed: you tried to tell me about your day and I stayed on my phone.')
    expect(draft).toContain('I care about turning toward you better')
    expect(draft).toContain('How it may have landed: it probably made you feel unimportant.')
    expect(draft).toContain('What I wish I had done: I wish I had put the phone down and listened.')
    expect(draft).toContain('can I ask about it now and listen properly?')
    expect(draft).toContain('smaller version or another time')
  })

  it('uses safe fallbacks for blank fields', () => {
    const draft = buildBidRepairDraft()

    expect(draft).toContain('I may have missed')
    expect(draft).toContain('lonely or disappointing')
    expect(draft).toContain('turned toward you sooner')
    expect(draft).toContain('Can I try again now')
  })
})
