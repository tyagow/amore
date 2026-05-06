import { describe, expect, it } from 'vitest'
import { buildRepairDraft } from './repair-draft'

describe('repair draft builder', () => {
  it('turns repair notes into an owned message', () => {
    const draft = buildRepairDraft({
      feeling: 'I felt dismissed.',
      ownership: 'I reacted too fast!',
      need: 'I need a calmer restart',
      request: 'talk after dinner?',
    })

    expect(draft).toContain('I want to repair this, not win it.')
    expect(draft).toContain('I care about us staying on the same team')
    expect(draft).toContain('The specific moment I mean is today')
    expect(draft).toContain('What I felt: I felt dismissed.')
    expect(draft).toContain('What I can own: I reacted too fast.')
    expect(draft).toContain('What I need: I need a calmer restart.')
    expect(draft).toContain('Could we talk after dinner?')
    expect(draft).toContain('smaller version or another time')
  })

  it('uses safe fallback language for blank fields', () => {
    const draft = buildRepairDraft({})

    expect(draft).toContain('something felt hard for me')
    expect(draft).toContain('I could have handled part of it more gently')
    expect(draft).toContain('feel like we are on the same team')
  })
})
