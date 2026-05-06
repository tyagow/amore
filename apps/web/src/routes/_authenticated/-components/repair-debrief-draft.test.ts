import { describe, expect, it } from 'vitest'
import {
  buildRepairDebriefDraft,
  buildRepairDebriefGoalDraft,
  buildRepairDebriefGoalTitle,
  buildRepairLandingCheckDraft,
} from './repair-debrief-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('repair debrief drafts', () => {
  it('builds a partner-ready debrief from notes', () => {
    const draft = buildRepairDebriefDraft('Jaluza', {
      understood: 'you felt alone when I got quiet',
      ownership: 'I shut down instead of saying I needed a pause',
      reassurance: 'I am here and I want to keep choosing us',
      nextStep: 'I will name when I need a 20-minute pause',
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('What I heard from you: you felt alone')
    expect(draft).toContain('What I am taking responsibility for')
    expect(draft).toContain('The next small thing I will do')
    expectCareReady(draft)
  })

  it('keeps blanks editable when notes are missing', () => {
    const draft = buildRepairDebriefDraft('your partner', {})

    expect(draft).toContain('What I heard from you: ____.')
    expect(draft).toContain('The next small thing I will do: ____.')
    expectCareReady(draft)
  })

  it('turns the next step into a small follow-through goal', () => {
    expect(buildRepairDebriefGoalTitle({ nextStep: 'send the check-in before bed.' })).toBe(
      'Follow through: send the check-in before bed',
    )
    expect(buildRepairDebriefGoalTitle({ nextStep: '   ' })).toBe('')
  })

  it('keeps repair context in the follow-through goal draft', () => {
    const draft = buildRepairDebriefGoalDraft({
      understood: 'you felt alone when I went quiet',
      ownership: 'I shut down',
      reassurance: 'I still want us',
      nextStep: 'name when I need a pause.',
    })

    expect(draft?.title).toBe('Follow through: name when I need a pause')
    expect(draft?.description).toContain('you felt alone')
    expect(draft?.description).toContain('Do the follow-through')
  })

  it('builds a follow-up check for whether repair landed', () => {
    const draft = buildRepairLandingCheckDraft('Jaluza', {
      understood: 'you felt alone when I went quiet',
      nextStep: 'name when I need a pause',
    })

    expect(draft).toContain('whether my repair actually landed')
    expect(draft).toContain('you felt alone when I went quiet')
    expect(draft).toContain('Did that help you feel more understood')
    expect(draft).toContain('come back to it later')
    expectCareReady(draft)
  })

  it('keeps blank landing checks specific enough for the composer care check', () => {
    const draft = buildRepairLandingCheckDraft('Jaluza', {})

    expect(draft).toContain('What I was trying to show I understood today')
    expect(draft).toContain('The follow-through I named today')
    expectCareReady(draft)
  })
})
