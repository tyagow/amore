import { describe, expect, it } from 'vitest'
import {
  buildBalanceChatDraft,
  buildConversationGoalDraft,
  buildConversationGoalTitle,
  getBestConversationWindow,
  getConversationBalance,
} from './communication-actions'
import { getDraftCareChecks } from '../chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('communication insight actions', () => {
  it('detects when the user is leading most of the conversation', () => {
    const balance = getConversationBalance(
      [
        { sender_id: 'me', msg_count: 80 },
        { sender_id: 'partner', msg_count: 20 },
      ],
      'me',
    )

    expect(balance.direction).toBe('user_leads')
    expect(balance.myPercent).toBe(80)
  })

  it('finds the strongest recurring conversation window', () => {
    const window = getBestConversationWindow([
      { dow: 1, hour: 9, count: 3 },
      { dow: 5, hour: 20, count: 11 },
    ])

    expect(window?.label).toBe('Friday around 8 PM')
  })

  it('builds a softer partner invite from an imbalance', () => {
    const draft = buildBalanceChatDraft({ direction: 'partner_leads', partnerName: 'Alex' })

    expect(draft).toContain('Alex may be carrying')
    expect(draft).toContain('showing up more actively')
    expect(draft).toContain('One part I can own')
    expect(draft).toContain('smaller check-in later today')
    expectCareReady(draft)
  })

  it('builds a room-making draft when the user dominates the conversation', () => {
    const draft = buildBalanceChatDraft({ direction: 'user_leads', partnerName: 'Alex' })

    expect(draft).toContain('making more room')
    expect(draft).toContain('asked a follow-up')
    expect(draft).toContain('What is one recent thing')
    expectCareReady(draft)
  })

  it('keeps the balanced conversation draft ready for the composer care check', () => {
    const draft = buildBalanceChatDraft({ direction: 'balanced', partnerName: 'Alex' })

    expect(draft).toContain('pretty balanced')
    expectCareReady(draft)
  })

  it('builds a fallback conversation goal when no time window is available', () => {
    expect(buildConversationGoalTitle(null)).toBe('Have one intentional conversation this week')
  })

  it('builds a structured conversation goal draft from rhythm data', () => {
    const draft = buildConversationGoalDraft({
      windowLabel: 'Friday around 8 PM',
      direction: 'partner_leads',
    })

    expect(draft.title).toBe('Have one intentional conversation Friday around 8 PM')
    expect(draft.description).toContain('already a strong conversation window')
    expect(draft.description).toContain('asking one follow-up')
    expect(draft.description).toContain('not homework')
  })
})
