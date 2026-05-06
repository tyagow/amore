import { describe, expect, it } from 'vitest'
import { buildHealthScoreDraft, getToolkitGuides } from './ai-sidebar'

describe('AI sidebar action drafts', () => {
  it('turns a low health score into a repair check-in', () => {
    const draft = buildHealthScoreDraft(62, 'Jaluza')

    expect(draft).toContain('slow down and repair')
    expect(draft).toContain('10 minutes')
    expect(draft).toContain('making this feel safer for both of us')
    expect(draft).toContain('one repair that would actually help')
    expect(draft).toContain('own my part')
    expect(draft).toContain('smaller moment later today')
  })

  it('turns a strong health score into a maintenance check-in', () => {
    const draft = buildHealthScoreDraft(84, 'Jaluza')

    expect(draft).toContain('keep caring for us')
    expect(draft).toContain('helped us feel connected')
    expect(draft).toContain('one appreciation and one tiny next step')
  })

  it('shows the full toolkit when tension or low health is present', () => {
    expect(getToolkitGuides(62, false)).toEqual(['listen', 'longing', 'conflict', 'space', 'apology', 'bid', 'aftercare'])
    expect(getToolkitGuides(84, true)).toEqual(['listen', 'longing', 'conflict', 'space', 'apology', 'bid', 'aftercare'])
  })

  it('keeps a lighter toolkit when the relationship is steady', () => {
    expect(getToolkitGuides(84, false)).toEqual(['listen', 'longing', 'conflict', 'bid', 'aftercare'])
  })
})
