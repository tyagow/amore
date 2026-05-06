import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from '../chat/draft-care-check'
import { buildActionPlan } from './overview-tab'

type OverviewData = Parameters<typeof buildActionPlan>[0]

function makeData(overrides: Partial<OverviewData> = {}): OverviewData {
  return {
    couple: {
      id: 'couple-1',
      healthScore: 82,
      lastAnalyzed: null,
    },
    partner: { id: 'partner-1', name: 'Jaluza', email: 'jaluza@example.com' },
    allInsights: [],
    healthHistory: [],
    messageStats: { totalMessages: 0, dailyAverage: 0, firstMessageAt: null, lastMessageAt: null },
    senderStats: [],
    sentimentByDay: [],
    hourlyActivity: [],
    myProfile: null,
    partnerProfile: null,
    entities: [],
    coachingTips: [],
    ...overrides,
  } as OverviewData
}

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('overview action plan goal drafts', () => {
  it('turns low health into a concrete repair goal draft', () => {
    const action = buildActionPlan(makeData({
      couple: { id: 'couple-1', healthScore: 62, lastAnalyzed: null },
    }))

    expect(action.goalDraft.title).toBe('Repair tension within 24 hours')
    expect(action.goalDraft.description).toContain('Start with appreciation')
    expect(action.goalDraft.description).toContain('before trying to solve everything')
    expect(action.chatDraft).toContain('next conversation feel safer')
    expect(action.chatDraft).toContain('smaller moment later today')
    expectCareReady(action.chatDraft)
  })

  it('drafts low-health repair actions in Portuguese when locale is pt-BR', () => {
    const action = buildActionPlan(makeData({
      couple: { id: 'couple-1', healthScore: 62, lastAnalyzed: null },
    }), 'pt-BR')

    expect(action.chatDraft).toContain('quero reparar')
    expect(action.chatDraft).toContain('10 minutos')
    expect(action.chatDraft).not.toContain('Hey')
    expect(action.coachDraft).toContain('Me ajude a preparar')
    expect(action.goalDraft.title).toBe('Reparar tensao em ate 24 horas')
    expect(action.goalDraft.description).toContain('Comecar com apreciacao')
    expectCareReady(action.chatDraft)
  })

  it('turns conflict signals into a softer-start practice', () => {
    const action = buildActionPlan(makeData({
      allInsights: [
        {
          id: 'insight-1',
          coupleId: 'couple-1',
          type: 'conflict_alert',
          content: { message: 'Tension showed up' },
          severity: 'high',
          generatedAt: new Date('2026-05-05T00:00:00Z'),
        },
      ],
    }))

    expect(action.goalDraft.title).toBe('Use softer starts for hard topics')
    expect(action.goalDraft.description).toContain('lowering defensiveness')
    expect(action.chatDraft).toContain('keeping this conversation connected')
    expect(action.chatDraft).toContain('smaller moment later')
    expectCareReady(action.chatDraft)
  })

  it('drafts conflict repair actions in Portuguese when locale is pt-BR', () => {
    const action = buildActionPlan(makeData({
      allInsights: [
        {
          id: 'insight-1',
          coupleId: 'couple-1',
          type: 'conflict_alert',
          content: { message: 'Tensao apareceu' },
          severity: 'high',
          generatedAt: new Date('2026-05-05T00:00:00Z'),
        },
      ],
    }), 'pt-BR')

    expect(action.chatDraft).toContain('nao quero que isso vire nos contra nos')
    expect(action.chatDraft).toContain('momento menor mais tarde')
    expect(action.coachDraft).toContain('sem defensividade')
    expect(action.goalDraft.title).toBe('Usar comecos mais suaves para um tema dificil')
    expectCareReady(action.chatDraft)
  })

  it('keeps the tiny-practice invite ready for the composer care check', () => {
    const action = buildActionPlan(makeData({
      allInsights: [
        {
          id: 'insight-1',
          coupleId: 'couple-1',
          type: 'goal_suggestion',
          content: { title: 'Try one phone-free dinner' },
          severity: 'low',
          generatedAt: new Date('2026-05-05T00:00:00Z'),
        },
      ],
    }))

    expect(action.chatDraft).toContain('simple enough')
    expect(action.chatDraft).toContain('smaller version later')
    expectCareReady(action.chatDraft)
  })

  it('keeps the fallback goal specific to one appreciation', () => {
    const action = buildActionPlan(makeData())

    expect(action.goalDraft.title).toBe('One appreciation message today')
    expect(action.goalDraft.description).toContain('one specific appreciation')
    expect(action.goalDraft.description).toContain('low-pressure question')
    expect(action.chatDraft).toContain('I care about noticing what is working')
    expectCareReady(action.chatDraft)
  })
})
