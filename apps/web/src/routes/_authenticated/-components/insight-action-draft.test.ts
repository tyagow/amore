import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from './chat/draft-care-check'
import { getDashboardInsightAction } from './insight-action-draft'

function expectCareReady(draft: string | undefined) {
  expect(draft).toBeTruthy()
  expect(getDraftCareChecks(draft ?? '').filter((check) => !check.passed)).toEqual([])
}

describe('dashboard insight actions', () => {
  it('turns conflict and health insights into repair drafts', () => {
    const action = getDashboardInsightAction({
      type: 'conflict_alert',
      content: { message: 'Boundary tension showed up' },
      partnerName: 'Jaluza',
    })

    expect(action?.label).toBe('Turn into a repair message')
    expect(action?.draft).toContain('Boundary tension showed up')
    expect(action?.draft).toContain('10 minutes')
    expect(action?.draft).toContain('One part I can own is')
    expect(action?.draft).toContain('One repair that would help')
    expectCareReady(action?.draft)
  })

  it('turns conflict and health insights into Portuguese repair drafts', () => {
    const action = getDashboardInsightAction({
      type: 'conflict_alert',
      content: { message: 'Tensao apareceu' },
      partnerName: 'Jaluza',
      locale: 'pt-BR',
    })

    expect(action?.label).toBe('Turn into a repair message')
    expect(action?.draft).toContain('Tensao apareceu')
    expect(action?.draft).toContain('10 minutos')
    expect(action?.draft).toContain('Uma parte que posso assumir')
    expect(action?.draft).not.toContain('Hey')
    expectCareReady(action?.draft)
  })

  it('turns goal suggestions into goal drafts', () => {
    const action = getDashboardInsightAction({
      type: 'goal_suggestion',
      content: { title: 'Try one phone-free dinner' },
      partnerName: 'Jaluza',
    })

    expect(action).toMatchObject({
      label: 'Make it a goal',
      to: '/goals',
      storageKey: 'amore-goal-draft',
    })
    expect(JSON.parse(action?.draft ?? '{}')).toEqual({
      title: 'Try one phone-free dinner',
      description: 'Pick one tiny version you can actually try this week, then check together whether it helped. Keep the goal small, observable, and kind enough that it invites follow-through instead of pressure.',
    })
  })

  it('turns goal suggestions into Portuguese goal drafts', () => {
    const action = getDashboardInsightAction({
      type: 'goal_suggestion',
      content: { title: 'Tentar um jantar sem celular' },
      partnerName: 'Jaluza',
      locale: 'pt-BR',
    })

    expect(JSON.parse(action?.draft ?? '{}')).toEqual({
      title: 'Tentar um jantar sem celular',
      description: 'Escolham uma versao pequena que voces realmente conseguem tentar esta semana e depois confiram juntos se ajudou. Mantenha o objetivo pequeno, observavel e gentil o bastante para convidar continuidade em vez de pressao.',
    })
  })

  it('does not keep legacy English goal details inside Portuguese goal drafts', () => {
    const action = getDashboardInsightAction({
      type: 'goal_suggestion',
      content: {
        title: 'Try one phone-free dinner',
        description: 'Pick one tiny version you can actually try this week.',
      },
      partnerName: 'Jaluza',
      locale: 'pt-BR',
    })

    const draft = JSON.parse(action?.draft ?? '{}')
    expect(draft.description).toContain('Rode uma nova analise em portugues')
    expect(draft.description).not.toContain('Pick one tiny version')
  })

  it('preserves goal suggestion descriptions as follow-through instructions', () => {
    const action = getDashboardInsightAction({
      type: 'goal_suggestion',
      content: {
        title: 'Try one phone-free dinner',
        description: 'Pick Tuesday dinner and keep phones out of reach.',
      },
      partnerName: 'Jaluza',
    })

    expect(JSON.parse(action?.draft ?? '{}')).toEqual({
      title: 'Try one phone-free dinner',
      description: 'Pick Tuesday dinner and keep phones out of reach. Keep the goal small, observable, and kind enough that it invites follow-through instead of pressure.',
    })
  })

  it('turns love language signals into care drafts', () => {
    const action = getDashboardInsightAction({
      type: 'love_language',
      content: { language: 'acts_of_service', confidence: 0.9 },
      partnerName: 'Jaluza',
    })

    expect(action?.draft).toContain('Acts of service')
    expect(action?.draft).toContain('take one small thing off your plate')
    expect(action?.draft).toContain('would something else land better')
    expect(action?.label).toBe('Act on this')
    expectCareReady(action?.draft)
  })

  it('turns love language signals into Portuguese care drafts', () => {
    const action = getDashboardInsightAction({
      type: 'love_language',
      content: { language: 'acts_of_service', confidence: 0.9 },
      partnerName: 'Jaluza',
      locale: 'pt-BR',
    })

    expect(action?.draft).toContain('Atos de servico')
    expect(action?.draft).toContain('tirar uma pequena coisa da sua lista')
    expect(action?.draft).toContain('algo diferente chegaria melhor')
    expectCareReady(action?.draft)
  })

  it('turns communication patterns into specific adjustment drafts', () => {
    const action = getDashboardInsightAction({
      type: 'communication_pattern',
      content: { pattern: 'initiationBalance' },
      partnerName: 'Jaluza',
    })

    expect(action?.label).toBe('Discuss this pattern')
    expect(action?.draft).toContain('Who starts conversations')
    expect(action?.draft).toContain('share who starts connection')
    expect(action?.draft).toContain('Would that make communication feel safer')
    expectCareReady(action?.draft)
  })

  it('turns sentiment trends into emotional check-ins', () => {
    const action = getDashboardInsightAction({
      type: 'sentiment_trend',
      content: { summary: 'The tone has felt flatter this week' },
      partnerName: 'Jaluza',
    })

    expect(action?.label).toBe('Send emotional check-in')
    expect(action?.draft).toContain('I care about understanding it')
    expect(action?.draft).toContain('How have you been feeling about us lately?')
    expectCareReady(action?.draft)
  })

  it('turns wishes and important dates into care actions', () => {
    const wishAction = getDashboardInsightAction({
      type: 'wish',
      content: { text: 'take a quiet trip together' },
      partnerName: 'Jaluza',
    })
    const dateAction = getDashboardInsightAction({
      type: 'important_date',
      content: { description: 'May 12 anniversary' },
      partnerName: 'Jaluza',
    })

    expect(wishAction?.label).toBe('Honor this wish')
    expect(wishAction?.draft).toContain('not turned into pressure')
    expect(dateAction?.label).toBe('Plan with care')
    expect(dateAction?.draft).toContain('before it becomes rushed')
    expectCareReady(wishAction?.draft)
    expectCareReady(dateAction?.draft)
  })

  it('keeps coaching-tip actions ready for the composer care check', () => {
    const action = getDashboardInsightAction({
      type: 'coaching_tip',
      content: { text: 'Try a softer start before a hard topic' },
      partnerName: 'Jaluza',
    })

    expect(action?.label).toBe('Talk it through')
    expect(action?.draft).toContain('kind and doable')
    expectCareReady(action?.draft)
  })
})
