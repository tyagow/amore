import { describe, expect, it } from 'vitest'
import {
  buildConflictRepairDraft,
  buildGoalSuggestionDraft,
  buildGoalSuggestionGoalDraft,
} from './coaching-actions'
import { getDraftCareChecks } from '../chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('coaching insight action drafts', () => {
  it('turns a goal suggestion into a partner invite', () => {
    const draft = buildGoalSuggestionDraft(
      'One phone-free conversation',
      'Pick one 20-minute window with no phones.',
    )

    expect(draft).toContain('One phone-free conversation')
    expect(draft).toContain('Pick one 20-minute window')
    expect(draft).toContain('Would you be open')
    expectCareReady(draft)
  })

  it('turns a goal suggestion into a structured goal draft', () => {
    const draft = buildGoalSuggestionGoalDraft(
      'One phone-free conversation',
      'Pick one 20-minute window with no phones.',
    )

    expect(draft.title).toBe('One phone-free conversation')
    expect(draft.description).toContain('Pick one 20-minute window')
    expect(draft.description).toContain('check whether it helped')
  })

  it('turns a conflict alert into a softer repair opener', () => {
    const draft = buildConflictRepairDraft('The conversation has started feeling tense.')

    expect(draft).toContain('I do not want this tension')
    expect(draft).toContain('The conversation has started feeling tense.')
    expect(draft).toContain('restart more gently')
    expectCareReady(draft)
  })
})
