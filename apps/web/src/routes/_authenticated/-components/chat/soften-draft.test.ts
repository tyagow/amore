import { describe, expect, it } from 'vitest'
import { buildSofterStartDraft } from './soften-draft'

describe('softer start draft', () => {
  it('builds a generic soft start when the draft is blank', () => {
    const draft = buildSofterStartDraft('   ')

    expect(draft).toContain('keeps us on the same team')
    expect(draft).toContain('Could we talk for 10 minutes')
  })

  it('keeps the concern while removing the harsh full draft', () => {
    const draft = buildSofterStartDraft('You never listen to me. I am tired of repeating everything and feeling invisible.')

    expect(draft).toContain('The thing I am trying to talk about is: I have been feeling unheard.')
    expect(draft).toContain('without blaming you')
    expect(draft).not.toContain('I am tired of repeating everything')
  })

  it('handles you never listen when phrasing without mangling the sentence', () => {
    const draft = buildSofterStartDraft('You never listen when plans change. I am tired of repeating myself.')

    expect(draft).toContain('The thing I am trying to talk about is: I have been feeling unheard when plans change.')
    expect(draft).not.toContain('not happening listen')
    expect(draft).not.toContain('I am tired of repeating myself')
  })

  it('keeps long concerns readable', () => {
    const draft = buildSofterStartDraft('Why do you wait until the last minute to tell me plans changed when I have already organized my entire evening around what we agreed before?')

    expect(draft).toContain('...')
    expect(draft.length).toBeLessThan(360)
  })
})
