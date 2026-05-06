import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from './chat/draft-care-check'
import { buildMicroDatePlan, buildMicroDateRescheduleDraft } from './micro-date-plan'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('micro date plan', () => {
  it('keeps the plan low-pressure for hard moods', () => {
    const plan = buildMicroDatePlan({
      partnerName: 'Jaluza',
      partnerMood: { mood: 'low' },
      partnerInterests: [],
      healthScore: 91,
    })

    expect(plan.title).toContain('softer night')
    expect(plan.timebox).toBe('20 minutes')
    expect(plan.chatDraft).toContain('No pressure')
    expectCareReady(plan.chatDraft)
    expect(plan.goalTitle).toContain('quiet 20-minute reset')
    expect(plan.goalDraft.description).toContain('low-pressure choices')
  })

  it('uses a gentle repair reset when health is low', () => {
    const plan = buildMicroDatePlan({
      partnerName: 'Jaluza',
      partnerMood: null,
      partnerInterests: [],
      healthScore: 62,
    })

    expect(plan.title).toContain('Reconnect')
    expect(plan.chatDraft).toContain('one appreciation')
    expectCareReady(plan.chatDraft)
    expect(plan.goalTitle).toContain('repair reset')
    expect(plan.goalDraft.description).toContain('stop while the conversation still feels safe')
  })

  it('personalizes the plan from partner interests', () => {
    const plan = buildMicroDatePlan({
      partnerName: 'Jaluza',
      partnerMood: null,
      partnerInterests: ['Ciclismo / Bike'],
      healthScore: 88,
    })

    expect(plan.title).toContain("Jaluza's world")
    expect(plan.reason).toContain('Ciclismo / Bike')
    expect(plan.chatDraft).toContain('tiny 25-minute version')
    expectCareReady(plan.chatDraft)
    expect(plan.goalTitle).toContain('Ciclismo / Bike')
    expect(plan.goalDraft.description).toContain('join with curiosity')
  })

  it('falls back to a tiny no-phone plan', () => {
    const plan = buildMicroDatePlan({
      partnerName: '',
      partnerMood: null,
      partnerInterests: [],
      healthScore: null,
    })

    expect(plan.title).toContain('no-phone')
    expect(plan.chatDraft).toContain('20-minute no-phone pocket')
    expectCareReady(plan.chatDraft)
    expect(plan.goalTitle).toContain('your partner')
    expect(plan.goalDraft.description).toContain('ask one real question')
  })

  it('builds a reschedule draft that keeps connection low-pressure', () => {
    const draft = buildMicroDateRescheduleDraft('Jaluza')

    expect(draft).toContain('I still want the small connection time')
    expect(draft).toContain('not want it to become pressure')
    expect(draft).toContain('I care about us keeping this warm')
    expect(draft).toContain('smaller version or another time')
    expect(draft).toContain('phones away')
    expect(draft).toContain('another version feel better')
    expectCareReady(draft)
  })
})
