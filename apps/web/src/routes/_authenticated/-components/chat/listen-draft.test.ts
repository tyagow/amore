import { describe, expect, it } from 'vitest'
import { buildListenFirstDraft } from './listen-draft'

describe('buildListenFirstDraft', () => {
  it('builds a listening-first response from concrete notes', () => {
    const draft = buildListenFirstDraft({
      heard: 'you felt dismissed when I changed plans late',
      emotion: 'unimportant and frustrated',
      ownership: 'I told you too late and made it sound casual',
      question: 'what would have helped you feel considered?',
    })

    expect(draft).toContain('hearing you today before I respond')
    expect(draft).toContain('I care about understanding you')
    expect(draft).toContain('you felt dismissed')
    expect(draft).toContain('It makes sense that you felt unimportant and frustrated')
    expect(draft).toContain('One part I can own')
    expect(draft).toContain('what would have helped')
    expect(draft).toContain('ask later')
  })

  it('keeps blanks when the user needs a scaffold', () => {
    const draft = buildListenFirstDraft({})

    expect(draft).toContain('What I heard: ____.')
    expect(draft).toContain('One part I can own: ____.')
    expect(draft).toContain('understand better: ____?')
    expect(draft).toContain('If that does not work')
  })
})
