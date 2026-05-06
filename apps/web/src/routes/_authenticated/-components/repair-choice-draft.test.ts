import { describe, expect, it } from 'vitest'
import { buildRepairChoiceDraft } from './repair-choice-draft'

describe('buildRepairChoiceDraft', () => {
  it('turns a conflict note into a listen-first draft', () => {
    const draft = buildRepairChoiceDraft(
      'listen',
      'you felt dismissed when I checked my phone',
      'Jaluza',
    )

    expect(draft).toContain('I want to make sure I am hearing you today before I respond.')
    expect(draft).toContain('I care about understanding you')
    expect(draft).toContain('you felt dismissed when I checked my phone')
    expect(draft).toContain('what did you most need me to understand')
  })

  it('turns a conflict note into an owned apology draft', () => {
    const draft = buildRepairChoiceDraft('own', 'I got sharp when you asked for help', 'Jaluza')

    expect(draft).toContain('The specific moment I mean is when: I got sharp when you asked for help.')
    expect(draft).toContain('it may have made Jaluza feel alone with the problem.')
    expect(draft).toContain('own my part before asking you to move on.')
  })

  it('turns a conflict note into a softer start draft', () => {
    const draft = buildRepairChoiceDraft('start', 'you never listen when I talk about plans', 'Jaluza')

    expect(draft).toContain('keeps us on the same team')
    expect(draft).toContain('I have been feeling unheard')
    expect(draft).toContain('Could we talk for 10 minutes')
  })

  it('turns a conflict note into an aftercare draft', () => {
    const draft = buildRepairChoiceDraft('aftercare', 'we ended the call cold', 'Jaluza')

    expect(draft).toContain('After we talk about this')
    expect(draft).toContain('One repair or reassurance we need tonight')
    expect(draft).toContain('we ended the call cold')
  })
})
