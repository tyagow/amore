import { describe, expect, it } from 'vitest'
import { buildSpaceDraft } from './space-draft'

describe('space draft builder', () => {
  it('asks for space with reassurance and a return time', () => {
    const draft = buildSpaceDraft({
      capacity: 'I am too activated to listen well right now',
      reassurance: 'I love you and I want to do this carefully',
      returnTime: 'I can come back after dinner at 8',
      request: 'could we pause and try again then?',
    })

    expect(draft).toContain('I love you and I want to do this carefully.')
    expect(draft).toContain('I am too activated to listen well right now.')
    expect(draft).toContain('What I need: I can come back after dinner at 8.')
    expect(draft).toContain('could we pause and try again then?')
    expect(draft).toContain('another clear return time')
  })

  it('uses a non-abandoning fallback when fields are blank', () => {
    const draft = buildSpaceDraft()

    expect(draft).toContain('I care about us')
    expect(draft).toContain('I am not leaving the conversation')
    expect(draft).toContain('I can come back in 30 minutes')
    expect(draft).toContain('restart more gently?')
    expect(draft).toContain('If that does not work')
  })
})
