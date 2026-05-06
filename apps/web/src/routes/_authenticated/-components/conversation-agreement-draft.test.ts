import { describe, expect, it } from 'vitest'
import {
  buildAgreementSlipRepairDraft,
  buildConversationAgreementDraft,
  buildConversationAgreementGoalDraft,
  buildConversationAgreementGoalTitle,
} from './conversation-agreement-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('conversation agreement draft', () => {
  it('turns calm agreements into a partner message', () => {
    const draft = buildConversationAgreementDraft('Jaluza', {
      pausePhrase: 'yellow light',
      phoneBoundary: 'phones face down until we both feel heard',
      repairWindow: '24 hours',
      topicBoundary: 'old arguments that are not part of this decision',
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('before the next hard conversation')
    expect(draft).toContain('Our pause phrase: "yellow light"')
    expect(draft).toContain('phones face down')
    expect(draft).toContain('repair within: 24 hours')
    expect(draft).toContain('old arguments')
    expectCareReady(draft)
  })

  it('keeps blank agreement sections collaborative', () => {
    const draft = buildConversationAgreementDraft('Partner', {})

    expect(draft).toContain('Our pause phrase: ____.')
    expect(draft).toContain('Can we choose these while things are calm')
    expectCareReady(draft)
  })

  it('builds a goal title from the most actionable agreement pieces', () => {
    expect(buildConversationAgreementGoalTitle({
      pausePhrase: 'yellow light',
      repairWindow: '24 hours',
    })).toBe('Use "yellow light" and repair within 24 hours')

    expect(buildConversationAgreementGoalTitle({ pausePhrase: 'pause, not disappear' })).toBe(
      'Use "pause, not disappear" as our pause phrase',
    )

    expect(buildConversationAgreementGoalTitle({ repairWindow: 'before sleep' })).toBe(
      'Repair within before sleep after hard conversations',
    )

    expect(buildConversationAgreementGoalTitle({})).toBe('')
  })

  it('builds an agreement goal draft with the actual rules', () => {
    const draft = buildConversationAgreementGoalDraft({
      pausePhrase: 'yellow light',
      phoneBoundary: 'phones face down',
      repairWindow: '24 hours',
      topicBoundary: 'old arguments',
    })

    expect(draft?.title).toBe('Use "yellow light" and repair within 24 hours')
    expect(draft?.description).toContain('phones face down')
    expect(draft?.description).toContain('old arguments')
    expect(draft?.description).toContain('Try the agreement once')
  })

  it('builds a repair draft when the agreement slips', () => {
    const draft = buildAgreementSlipRepairDraft('Jaluza', {
      pausePhrase: 'yellow light',
      repairWindow: 'before sleep',
      topicBoundary: 'old arguments',
    })

    expect(draft).toContain('missed part of the hard-talk agreement')
    expect(draft).toContain('use "yellow light"')
    expect(draft).toContain('before sleep')
    expect(draft).toContain('The part I can own is')
    expect(draft).toContain('pick a smaller version')
    expectCareReady(draft)
  })
})
