import { describe, expect, it } from 'vitest'
import {
  buildCareInstructionsDraft,
  buildCareAvoidanceDraft,
  buildCareInstructionsGoalDraft,
  buildCareInstructionsGoalTitle,
  buildCareMissRepairDraft,
  buildOverwhelmSignalsDraft,
  buildShareMyCareInstructionsDraft,
} from './care-instructions-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('care instructions draft', () => {
  it('asks for concrete support preferences while calm', () => {
    const draft = buildCareInstructionsDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('instead of guessing in the moment')
    expect(draft).toContain('closeness, space, practical help, reassurance, or listening')
    expect(draft).toContain('I need a pause, but I am coming back')
    expect(draft).toContain('what kind of repair actually helps')
    expect(draft).toContain('I will answer these too')
    expectCareReady(draft)
  })

  it('builds a goal title for creating the manual together', () => {
    expect(buildCareInstructionsGoalTitle('Jaluza')).toBe(
      'Create care instructions with Jaluza',
    )
    expect(buildCareInstructionsGoalTitle('')).toBe(
      'Create care instructions with my partner',
    )
  })

  it('asks what to avoid during hard moments', () => {
    const draft = buildCareAvoidanceDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('not making hard moments harder')
    expect(draft).toContain('Giving advice too fast')
    expect(draft).toContain('Defending myself before I understand you')
    expect(draft).toContain('What is one thing you wish I would stop doing first?')
    expectCareReady(draft)
  })

  it('asks for early overwhelm signs before hard moments', () => {
    const draft = buildOverwhelmSignalsDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('notice earlier')
    expect(draft).toContain('voice, body, texting, or energy')
    expect(draft).toContain('without making you feel watched or managed')
    expect(draft).toContain('One early sign I notice in myself')
    expectCareReady(draft)
  })

  it('builds a structured goal draft for care instructions', () => {
    const draft = buildCareInstructionsGoalDraft('Jaluza')

    expect(draft.title).toBe('Create care instructions with Jaluza')
    expect(draft.description).toContain('what helps first when upset')
    expect(draft.description).toContain('what to avoid')
  })

  it('shares a first draft of the user care instructions from profile data', () => {
    const draft = buildShareMyCareInstructionsDraft({
      partnerName: 'Jaluza',
      loveLanguagePrimary: 'Quality Time',
      loveLanguageSecondary: 'Words of Affirmation',
      communicationType: 'Direct',
      communicationDescription: 'Needs clear requests',
      interests: ['walking', 'quiet dinners'],
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('Quality Time and Words of Affirmation')
    expect(draft).toContain('Direct: Needs clear requests')
    expect(draft).toContain('walking, quiet dinners')
    expect(draft).toContain('instead of making you guess')
    expectCareReady(draft)
  })

  it('leaves blanks when profile data is missing', () => {
    const draft = buildShareMyCareInstructionsDraft({
      partnerName: '',
      interests: [],
    })

    expect(draft).toContain('Hey love')
    expect(draft).toContain('What usually helps me feel loved: ____.')
    expect(draft).toContain('How I tend to communicate or process: ____.')
    expectCareReady(draft)
  })

  it('repairs a missed care instruction without defensiveness', () => {
    const draft = buildCareMissRepairDraft('Jaluza')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('I do not want to defend that')
    expect(draft).toContain('I care about getting this right')
    expect(draft).toContain('The part I can own is')
    expect(draft).toContain('the first signal I should watch for next time')
    expect(draft).toContain('one smaller repair')
    expectCareReady(draft)
  })
})
