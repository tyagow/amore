import { describe, expect, it } from 'vitest'
import { buildDailyConnectionQuestion } from './daily-connection-question'

describe('daily connection question', () => {
  it('prioritizes partner support when mood is hard', () => {
    const question = buildDailyConnectionQuestion({
      partnerName: 'Jaluza',
      partnerMood: { mood: 'struggling' },
      partnerInterests: ['cycling'],
      healthScore: 90,
    })

    expect(question.title).toContain('support')
    expect(question.chatDraft).toContain('less alone')
    expect(question.chatDraft).toContain('supporting you in the way that actually lands')
    expect(question.chatDraft).toContain('come back to it later')
    expect(question.goalDraft.description).toContain('offer clear choices')
    expect(question.coachPrompt).toContain('struggling')
  })

  it('uses a repair-oriented question when the score is low', () => {
    const question = buildDailyConnectionQuestion({
      partnerName: 'Jaluza',
      partnerMood: { mood: 'good' },
      partnerInterests: ['cycling'],
      healthScore: 62,
    })

    expect(question.title).toContain('defensiveness')
    expect(question.question).toContain('understood better')
    expect(question.chatDraft).toContain('I care about understanding you')
    expect(question.chatDraft).toContain('without defending myself')
    expect(question.chatDraft).toContain('smaller moment later today')
    expect(question.goalDraft.description).toContain('listen without defending')
  })

  it('turns partner interests into a curiosity question', () => {
    const question = buildDailyConnectionQuestion({
      partnerName: 'Jaluza',
      partnerMood: null,
      partnerInterests: { items: ['{"topic":"Ciclismo / Bike"}'] },
      healthScore: 84,
    })

    expect(question.title).toContain('Ciclismo / Bike')
    expect(question.question).toContain('meaningful or fun')
    expect(question.chatDraft).toContain('what lights you up')
    expect(question.chatDraft).toContain('now is not a good time')
    expect(question.goalTitle).toContain('Ciclismo / Bike')
    expect(question.goalDraft.description).toContain('meaningful or fun')
  })
})
