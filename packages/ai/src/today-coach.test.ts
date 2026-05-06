import { describe, expect, it } from 'vitest'
import { buildTodayCoachBrief, type TodayCoachInput } from './today-coach'

const baseInput: TodayCoachInput = {
  healthScore: 78,
  whatsappConnected: true,
  messageStats: {
    totalMessages: 120,
    dailyAverage: 12,
    last7Days: [10, 12, 9, 15, 20, 18, 11],
  },
  recentInsights: [],
  activeGoals: [],
  myMood: null,
  partnerMood: null,
  dailyCheckin: {
    checkedIn: true,
    partnerCheckedIn: false,
    question: 'What helped you feel close today?',
    streak: 2,
  },
}

describe('buildTodayCoachBrief', () => {
  it('uses a high severity recent insight when conversation data exists', () => {
    const brief = buildTodayCoachBrief({
      ...baseInput,
      recentInsights: [
        {
          type: 'conflict_pattern',
          severity: 'high',
          content: { summary: 'Hard topics escalate quickly after work.' },
        },
      ],
    })

    expect(brief.priority).toBe('Act on the strongest recent pattern')
    expect(brief.pattern).toContain('Hard topics escalate quickly')
    expect(brief.confidence).toBe('high')
  })

  it('prioritizes first value when there is no WhatsApp or import data', () => {
    const brief = buildTodayCoachBrief({
      ...baseInput,
      healthScore: null,
      whatsappConnected: false,
      messageStats: null,
      dailyCheckin: null,
    })

    expect(brief.priority).toBe('Get one real signal into Amore')
    expect(brief.action).toContain('WhatsApp export')
    expect(brief.confidence).toBe('low')
  })

  it('does not wait for AI when the user has not checked in', () => {
    const brief = buildTodayCoachBrief({
      ...baseInput,
      dailyCheckin: {
        checkedIn: false,
        partnerCheckedIn: true,
        question: 'What do you need today?',
      },
    })

    expect(brief.source).toBe('Daily check-in')
    expect(brief.action).toContain('What do you need today?')
    expect(brief.coachPrompt).toContain('check-in')
  })

  it('routes partner low mood toward support instead of analysis', () => {
    const brief = buildTodayCoachBrief({
      ...baseInput,
      partnerMood: { mood: 'struggling', note: 'I feel stretched thin.' },
    })

    expect(brief.priority).toBe('Support your partner gently')
    expect(brief.pattern).toContain('stretched thin')
    expect(brief.coachPrompt).not.toContain('diagnose')
  })
})
