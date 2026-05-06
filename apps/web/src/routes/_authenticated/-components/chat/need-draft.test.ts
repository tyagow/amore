import { describe, expect, it } from 'vitest'
import { buildNeedDraft } from './need-draft'

describe('need request draft', () => {
  it('builds a clear need request from fields', () => {
    const draft = buildNeedDraft({
      need: 'more predictable time together',
      why: 'I relax when I know we have space for us',
      request: 'could we pick one evening before the week starts?',
      flexibility: 'I am flexible on the day',
    })

    expect(draft).toContain('not criticize you')
    expect(draft).toContain('I care about us finding a version')
    expect(draft).toContain('more predictable time together')
    expect(draft).toContain('I am flexible on the day')
    expect(draft).toContain('smaller version or another time')
  })

  it('falls back to blanks that are still sendable', () => {
    const draft = buildNeedDraft({
      need: '',
      why: '',
      request: '',
      flexibility: '',
    })

    expect(draft).toContain('more support with ____')
    expect(draft).toContain('could we try ____ this week?')
    expect(draft).toContain('If that does not work')
    expect(draft).toContain('smaller version')
    expect(draft).toContain('works for both of us')
  })
})
