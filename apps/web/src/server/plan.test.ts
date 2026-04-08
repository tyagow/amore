import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@amore-couples/db', () => ({
  db: {},
}))

vi.mock('@amore-couples/db/schema', () => ({
  users: {},
  featureUsage: {},
  couples: {},
}))

const loadPlanModule = () => import('./plan')

describe('PLAN_LIMITS', () => {
  it('keeps free and premium feature gates aligned with the product model', async () => {
    const { PLAN_LIMITS } = await loadPlanModule()

    expect(PLAN_LIMITS).toEqual({
      free: {
        coachMessagesPerDay: 3,
        toneReviewsPerDay: 1,
        manualAnalysisPerWeek: 1,
        replySuggestions: false,
        liveMoodAnalysis: false,
        advancedInsights: false,
        profileEditing: false,
        fullScoreHistory: false,
      },
      premium: {
        coachMessagesPerDay: Infinity,
        toneReviewsPerDay: Infinity,
        manualAnalysisPerWeek: Infinity,
        replySuggestions: true,
        liveMoodAnalysis: true,
        advancedInsights: true,
        profileEditing: true,
        fullScoreHistory: true,
      },
    })
  })
})

describe('getFeatureWindow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns daily UTC windows for coach messages and tone reviews', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T15:30:00.000Z'))

    const { getFeatureWindow } = await loadPlanModule()

    expect(getFeatureWindow('coach_message')).toEqual({
      limit: 3,
      windowStart: new Date('2026-04-07T00:00:00.000Z'),
      resetAt: '2026-04-08T00:00:00.000Z',
    })

    expect(getFeatureWindow('tone_review')).toEqual({
      limit: 1,
      windowStart: new Date('2026-04-07T00:00:00.000Z'),
      resetAt: '2026-04-08T00:00:00.000Z',
    })
  })

  it('returns a Monday-based weekly UTC window for manual analysis', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T15:30:00.000Z'))

    const { getFeatureWindow } = await loadPlanModule()

    expect(getFeatureWindow('manual_analysis')).toEqual({
      limit: 1,
      windowStart: new Date('2026-04-06T00:00:00.000Z'),
      resetAt: '2026-04-13T00:00:00.000Z',
    })
  })
})
