import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from './chat/draft-care-check'
import { buildDailyCarePlan } from './daily-care-plan'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('daily care plan', () => {
  it('prioritizes a hard partner mood before other signals', () => {
    const plan = buildDailyCarePlan({
      partnerName: 'Jaluza',
      healthScore: 82,
      partnerMood: { mood: 'low' },
      partnerLoveLanguages: [{ language: 'Acts of service', confidence: 95 }],
      partnerInterests: ['cycling'],
      hasActiveGoals: true,
    })

    expect(plan.title).toContain('less alone')
    expect(plan.chatDraft).toContain('warmth, practical help')
    expect(plan.chatDraft).toContain('check back later')
    expectCareReady(plan.chatDraft)
    expect(plan.goalDraft.description).toContain('offer one concrete support option')
    expect(plan.coachPrompt).toContain('feeling low')
  })

  it('turns a low health score into a repair plan', () => {
    const plan = buildDailyCarePlan({
      partnerName: 'Jaluza',
      healthScore: 62,
      partnerMood: null,
      partnerLoveLanguages: [{ language: 'Quality time', confidence: 90 }],
      partnerInterests: ['cycling'],
      hasActiveGoals: false,
    })

    expect(plan.title).toBe('Repair first, then reconnect')
    expect(plan.goalTitle).toContain('10-minute repair')
    expect(plan.goalDraft.description).toContain('own one part without defending')
    expect(plan.steps.join(' ')).toContain('Own one part')
    expect(plan.chatDraft).toContain('smaller moment later today')
    expectCareReady(plan.chatDraft)
  })

  it('uses the strongest love-language signal when the relationship is stable', () => {
    const plan = buildDailyCarePlan({
      partnerName: 'Jaluza',
      healthScore: 84,
      partnerMood: { mood: 'good' },
      partnerLoveLanguages: [
        { language: 'Words of affirmation', confidence: 70 },
        { language: 'Acts of service', confidence: 92 },
      ],
      partnerInterests: ['cycling'],
      hasActiveGoals: true,
    })

    expect(plan.title).toContain('acts of service')
    expect(plan.steps[0]).toContain('plate')
    expect(plan.goalDraft.description).toContain('plate')
    expect(plan.goalDraft.description).toContain('easy to receive')
    expect(plan.chatDraft).toContain('acts of service')
    expect(plan.chatDraft).toContain('smaller version later')
    expectCareReady(plan.chatDraft)
  })

  it('falls back to partner interests before generic goals', () => {
    const plan = buildDailyCarePlan({
      partnerName: 'Jaluza',
      healthScore: 85,
      partnerMood: null,
      partnerLoveLanguages: [],
      partnerInterests: { items: ['{"topic":"Ciclismo / Bike"}'] },
      hasActiveGoals: false,
    })

    expect(plan.title).toContain('Ciclismo / Bike')
    expect(plan.chatDraft).toContain('Ciclismo / Bike')
    expect(plan.chatDraft).toContain('come back to it later')
    expectCareReady(plan.chatDraft)
    expect(plan.goalDraft.description).toContain('offer one small way')
  })

  it('keeps a generic tiny promise flexible', () => {
    const plan = buildDailyCarePlan({
      partnerName: 'Jaluza',
      healthScore: null,
      partnerMood: null,
      partnerLoveLanguages: [],
      partnerInterests: [],
      hasActiveGoals: false,
    })

    expect(plan.chatDraft).toContain('I care about making it simple')
    expect(plan.chatDraft).toContain('choose a smaller version')
    expectCareReady(plan.chatDraft)
  })
})
