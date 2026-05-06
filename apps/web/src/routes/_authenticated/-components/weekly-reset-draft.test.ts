import { describe, expect, it } from 'vitest'
import {
  buildWeeklyNeedRequestDraft,
  buildWeeklyPromiseGoalDraft,
  buildWeeklyPromiseGoalTitle,
  buildWeeklyResetDraft,
} from './weekly-reset-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('weekly reset draft', () => {
  it('turns reset notes into a partner message', () => {
    const draft = buildWeeklyResetDraft('Jaluza', {
      appreciate: 'you picked me up when travel was chaotic',
      'hard-thing': 'I felt scattered',
      need: 'one calm planning window',
      promise: 'one phone-free dinner',
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('One thing I appreciated: you picked me up')
    expect(draft).toContain('One tiny promise for this week: one phone-free dinner')
    expect(draft).toContain('15 minutes')
    expect(draft).toContain('not a scorecard')
    expectCareReady(draft)
  })

  it('keeps blank sections collaborative instead of empty', () => {
    const draft = buildWeeklyResetDraft('Partner', {})

    expect(draft).toContain('I want to answer this together')
    expectCareReady(draft)
  })

  it('turns the weekly need into a gentle ask', () => {
    const draft = buildWeeklyNeedRequestDraft('Jaluza', {
      'hard-thing': 'planning felt scattered',
      need: 'one calm planning window',
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('planning felt scattered')
    expect(draft).toContain('What would help me next week is: one calm planning window.')
    expect(draft).toContain('smallest version')
    expectCareReady(draft)
  })

  it('turns the promise note into a tiny goal title', () => {
    expect(buildWeeklyPromiseGoalTitle({ promise: 'one phone-free dinner' })).toBe(
      'This week: one phone-free dinner',
    )
    expect(buildWeeklyPromiseGoalTitle({ promise: '   ' })).toBeNull()
  })

  it('keeps the weekly reset context in the promise goal draft', () => {
    const draft = buildWeeklyPromiseGoalDraft({
      appreciate: 'you handled a hard week kindly',
      'hard-thing': 'planning felt scattered',
      need: 'one calmer planning window',
      promise: 'one phone-free dinner',
    })

    expect(draft?.title).toBe('This week: one phone-free dinner')
    expect(draft?.description).toContain('you handled a hard week kindly')
    expect(draft?.description).toContain('one calmer planning window')
    expect(draft?.description).toContain('Check back next week')
  })
})
