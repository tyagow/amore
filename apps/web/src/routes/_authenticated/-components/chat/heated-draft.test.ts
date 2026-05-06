import { describe, expect, it } from 'vitest'
import { getHeatedDraftWarning } from './heated-draft'

describe('heated draft warning', () => {
  it('detects relationship-ending threats typed while activated', () => {
    const warning = getHeatedDraftWarning('I am done with this relationship.')

    expect(warning?.title).toBe('This sounds final while activated')
    expect(warning?.body).toContain('pause with a return time')
    expect(warning?.recommendedAction).toBe('pause')
    expect(warning?.recommendedLabel).toBe('Use pause instead')
  })

  it('detects global blame language', () => {
    const warning = getHeatedDraftWarning('You never listen when plans change.')

    expect(warning?.title).toBe('This may land as blame')
    expect(warning?.body).toContain('one specific event')
    expect(warning?.recommendedAction).toBe('soften')
  })

  it('prioritizes contempt over blame', () => {
    const warning = getHeatedDraftWarning('You always act so selfish when I need help.')

    expect(warning?.title).toBe('This may land as contempt')
    expect(warning?.body).toContain('without labeling your partner')
  })

  it('warns when a draft is too long to receive easily', () => {
    const warning = getHeatedDraftWarning('x'.repeat(701))

    expect(warning?.title).toBe('This is a lot to receive at once')
    expect(warning?.recommendedLabel).toBe('Use shorter start')
  })

  it('does not warn for a short specific message', () => {
    expect(getHeatedDraftWarning('I felt hurt when plans changed tonight.')).toBeNull()
  })
})
