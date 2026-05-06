import { describe, expect, it } from 'vitest'
import { buildPauseBeforeSendDraft } from './pause-draft'

describe('pause before send draft', () => {
  it('builds a generic pause when there is no draft topic', () => {
    expect(buildPauseBeforeSendDraft('   ')).toBe(
      'I am feeling activated today and I do not want to say this badly.\n\nI care about coming back kinder, not disappearing.\n\nCan we pause for 20 minutes and come back when I can listen better?\n\nIf that does not work, could we choose another clear return time?',
    )
  })

  it('keeps the issue without preserving global blame or a heated full message', () => {
    const draft = buildPauseBeforeSendDraft('Hey, you never listen to me. I am tired of repeating everything.')

    expect(draft).toContain('The thing I want to talk about is: I felt unheard')
    expect(draft).toContain('Can we pause for 20 minutes')
    expect(draft).toContain('coming back kinder')
    expect(draft).toContain('another clear return time')
    expect(draft).not.toContain('you never listen')
    expect(draft).not.toContain('I am tired of repeating everything')
  })

  it('truncates long topics so the pause remains readable', () => {
    const draft = buildPauseBeforeSendDraft('This is a very long complaint that keeps going because I am upset and trying to explain every detail at once before either of us has had any chance to calm down.')

    expect(draft).toContain('...')
    expect(draft.length).toBeLessThan(420)
  })
})
