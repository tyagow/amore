import { describe, expect, it } from 'vitest'
import { buildRespectNoDraft } from './respect-no-draft'

describe('buildRespectNoDraft', () => {
  it('creates a draft for receiving a no without pressure', () => {
    expect(buildRespectNoDraft()).toBe([
      'Thank you for being honest with me, even if the answer is no or not right now.',
      '',
      'I feel disappointed, and I do not want to turn that into pressure on you.',
      '',
      'I care more about us feeling safe than about getting the exact answer I wanted.',
      '',
      'Could we choose a smaller version, another time, or simply let this be no for today?',
    ].join('\n'))
  })

  it('normalizes custom lines', () => {
    const draft = buildRespectNoDraft({
      noHeard: 'I hear that tonight does not work',
      feeling: 'I am sad because I was looking forward to it',
      care: 'I do not want you to feel trapped by my disappointment',
      nextStep: 'Could we pick a time tomorrow or drop it for now?',
    })

    expect(draft).toContain('I hear that tonight does not work.')
    expect(draft).toContain('I do not want you to feel trapped by my disappointment.')
    expect(draft).toContain('Could we pick a time tomorrow or drop it for now?')
  })
})
