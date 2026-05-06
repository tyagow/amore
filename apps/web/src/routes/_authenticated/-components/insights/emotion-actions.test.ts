import { describe, expect, it } from 'vitest'
import {
  buildEmotionalResetDraft,
  buildEmotionalResetGoalDraft,
  buildEmotionalResetGoalTitle,
  getEmotionalResetSignal,
} from './emotion-actions'
import { getDraftCareChecks } from '../chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('emotion insight actions', () => {
  it('prioritizes a negative sentiment day', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [
        { day: '2026-05-01', avg_sentiment: 0.3, msg_count: 8 },
        { day: '2026-05-02', avg_sentiment: -0.45, msg_count: 12 },
      ],
      moodHistory: [],
      userId: 'me',
      partnerName: 'Alex',
    })

    expect(signal.kind).toBe('sentiment_drop')
    expect(signal.detail).toContain('May 2')
  })

  it('falls back to a low mood when sentiment is steady', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [{ day: '2026-05-01', avg_sentiment: 0.1, msg_count: 8 }],
      moodHistory: [{ userId: 'partner', mood: 'low', createdAt: new Date() }],
      userId: 'me',
      partnerName: 'Alex',
    })

    expect(signal.kind).toBe('low_mood')
    expect(signal.detail).toContain('Alex logged low')
  })

  it('builds a concrete draft and goal for a hard emotional pattern', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [{ day: '2026-05-02', avg_sentiment: -0.45, msg_count: 12 }],
      moodHistory: [],
      userId: 'me',
    })

    expect(buildEmotionalResetDraft(signal)).toContain('repairing anything')
    expect(buildEmotionalResetDraft(signal)).toContain('One part I can own is')
    expectCareReady(buildEmotionalResetDraft(signal))
    expect(buildEmotionalResetGoalTitle(signal)).toBe('Do one gentle emotional reset this week')
  })

  it('builds a structured emotional reset goal with follow-through', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [{ day: '2026-05-02', avg_sentiment: -0.45, msg_count: 12 }],
      moodHistory: [],
      userId: 'me',
    })
    const draft = buildEmotionalResetGoalDraft(signal)

    expect(draft.title).toBe('Do one gentle emotional reset this week')
    expect(draft.description).toContain('May 2 had the lowest tone')
    expect(draft.description).toContain('ask what felt hardest')
    expect(draft.description).toContain('choose one repair')
  })

  it('builds a low-mood reset that asks before trying to fix', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [{ day: '2026-05-01', avg_sentiment: 0.2, msg_count: 10 }],
      moodHistory: [{ userId: 'partner', mood: 'struggling', createdAt: new Date() }],
      userId: 'me',
      partnerName: 'Alex',
    })

    expect(buildEmotionalResetDraft(signal)).toContain('What has felt heaviest today?')
    expect(buildEmotionalResetDraft(signal)).toContain('without defending')
    expectCareReady(buildEmotionalResetDraft(signal))
    expect(buildEmotionalResetGoalDraft(signal).description).toContain('support version they choose')
  })

  it('keeps the steady emotional reset ready for the composer care check', () => {
    const signal = getEmotionalResetSignal({
      sentimentByDay: [{ day: '2026-05-01', avg_sentiment: 0.2, msg_count: 10 }],
      moodHistory: [],
      userId: 'me',
      partnerName: 'Alex',
    })

    expect(signal.kind).toBe('steady')
    expect(buildEmotionalResetDraft(signal)).toContain('emotionally steadier this week')
    expectCareReady(buildEmotionalResetDraft(signal))
  })
})
