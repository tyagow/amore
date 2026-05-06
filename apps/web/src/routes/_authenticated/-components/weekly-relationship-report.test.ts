import { describe, expect, it } from 'vitest'
import { getRitualLibraryForTests } from './personalized-ritual-engine'
import { buildWeeklyRelationshipReport, getWeekKey } from './weekly-relationship-report'

const ritual = getRitualLibraryForTests()[1]

describe('weekly relationship report', () => {
  it('uses the Monday week key for report history', () => {
    expect(getWeekKey('2026-05-06')).toBe('2026-05-04')
  })

  it('works with thin data without pretending the score is precise', () => {
    const report = buildWeeklyRelationshipReport({
      dateKey: '2026-05-06',
      partnerName: 'Jaluza',
      healthScore: null,
      messagesSinceAnalysis: null,
      messageStats: null,
      activeGoalCount: 0,
      recentCheckins: [],
      ritual,
    })

    expect(report.confidence).toBe('thin')
    expect(report.scoreLine).toContain('No precise score yet')
    expect(report.sharedSummary).toContain('Next small practice')
  })

  it('keeps the coach follow-up private by default', () => {
    const report = buildWeeklyRelationshipReport({
      dateKey: '2026-05-06',
      partnerName: 'Jaluza',
      healthScore: 74,
      messagesSinceAnalysis: 22,
      messageStats: { totalMessages: 80, dailyAverage: 4.5, last7Days: [4, 2, 6] },
      activeGoalCount: 1,
      recentCheckins: [
        { bothCheckedIn: true, mineMood: 'good', partnerMood: 'neutral' },
        { bothCheckedIn: true, mineMood: 'good', partnerMood: 'good' },
      ],
      ritual,
    })

    expect(report.confidence).toBe('strong')
    expect(report.watchPoint).toContain('newer messages')
    expect(report.privateCoachPrompt).toContain('reflect privately')
    expect(report.privateCoachPrompt).toContain('unless I explicitly choose')
  })
})
