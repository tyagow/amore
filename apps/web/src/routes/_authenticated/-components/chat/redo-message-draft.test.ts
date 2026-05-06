import { describe, expect, it } from 'vitest'
import { buildRedoMessageDraft } from './redo-message-draft'

describe('buildRedoMessageDraft', () => {
  it('creates a repair draft for redoing a sharp message', () => {
    expect(buildRedoMessageDraft()).toBe([
      'I do not like how my last message came out today.',
      '',
      'Under the sharpness, what I was trying to say is that I want us to understand each other better.',
      '',
      'Can I try again with a calmer version instead of making you respond to the worst version of it?',
      '',
      'If that does not work right now, I can give this room and try again later.',
    ].join('\n'))
  })

  it('normalizes custom redo lines', () => {
    const draft = buildRedoMessageDraft({
      toneOwnership: 'That sounded more accusing than I meant',
      underlyingNeed: 'I was trying to say that plans changing makes me anxious',
      resetAsk: 'Can I restart with what I actually need?',
    })

    expect(draft).toContain('That sounded more accusing than I meant.')
    expect(draft).toContain('I was trying to say that plans changing makes me anxious.')
    expect(draft).toContain('Can I restart with what I actually need?')
    expect(draft).toContain('try again later')
  })
})
