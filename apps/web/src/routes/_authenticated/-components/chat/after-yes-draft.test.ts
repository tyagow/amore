import { describe, expect, it } from 'vitest'
import { buildAfterYesDraft } from './after-yes-draft'

describe('buildAfterYesDraft', () => {
  it('turns an agreement into a concrete follow-through step', () => {
    expect(buildAfterYesDraft()).toBe([
      'I am glad we found a yes, even if it is a small one.',
      '',
      'I care about us turning it into something kind and doable, not another pressure point.',
      '',
      'Can we make the next step concrete: what each of us will do, and by when?',
      '',
      'If that does not work or starts feeling too much, can we adjust it instead of silently dropping it?',
    ].join('\n'))
  })

  it('normalizes custom follow-through lines', () => {
    const draft = buildAfterYesDraft({
      agreement: 'I am happy we agreed to try this',
      care: 'I care about this staying kind',
      nextStep: 'Could we each name one action before tonight',
      checkIn: 'If the plan stops fitting, can we say that early?',
    })

    expect(draft).toContain('I am happy we agreed to try this.')
    expect(draft).toContain('I care about this staying kind.')
    expect(draft).toContain('Could we each name one action before tonight.')
    expect(draft).toContain('If the plan stops fitting, can we say that early?')
  })
})
