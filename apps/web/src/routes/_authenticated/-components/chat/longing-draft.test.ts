import { describe, expect, it } from 'vitest'
import { buildLongingDraft } from './longing-draft'

describe('buildLongingDraft', () => {
  it('turns a complaint into a longing and request', () => {
    const draft = buildLongingDraft({
      complaint: 'plans change and I find out late',
      longing: 'to feel considered before the decision is final',
      request: 'tell me earlier, even if the answer is not perfect yet',
      appreciation: 'you usually care about making things right',
    })

    expect(draft).toContain('underneath the complaint')
    expect(draft).toContain('I care about staying connected')
    expect(draft).toContain('plans change')
    expect(draft).toContain('What I am really longing for')
    expect(draft).toContain('Could we try this instead')
    expect(draft).toContain('still appreciate')
    expect(draft).toContain('smaller version or another time')
  })

  it('keeps a usable scaffold when fields are empty', () => {
    const draft = buildLongingDraft({})

    expect(draft).toContain('When this happens: ____.')
    expect(draft).toContain('What I am really longing for is: ____.')
    expect(draft).toContain('Could we try this instead: ____.')
    expect(draft).toContain('If that does not work')
  })
})
