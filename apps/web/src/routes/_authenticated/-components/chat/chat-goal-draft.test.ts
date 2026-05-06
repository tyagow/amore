import { describe, expect, it } from 'vitest'
import { buildGoalDraftFromChatDraft, buildGoalTitleFromChatDraft } from './chat-goal-draft'

describe('chat goal draft', () => {
  it('extracts a could-we request as a goal title', () => {
    const title = buildGoalTitleFromChatDraft('Hey Jaluza, could we protect one 20-minute no-phone pocket this week?')

    expect(title).toBe('protect one 20-minute no-phone pocket this week')
  })

  it('uses a promise sentence when there is no could-we request', () => {
    const title = buildGoalTitleFromChatDraft('I will put my phone away during dinner tonight. I want us to feel closer.')

    expect(title).toBe('I will put my phone away during dinner tonight')
  })

  it('falls back when blank', () => {
    expect(buildGoalTitleFromChatDraft('   ')).toBe('Choose one tiny relationship promise')
  })

  it('keeps long titles bounded', () => {
    const title = buildGoalTitleFromChatDraft('Could we choose one extremely detailed relationship practice that keeps going with far too many specifics for a goal title?')

    expect(title).toContain('...')
    expect(title.length).toBeLessThanOrEqual(80)
  })

  it('builds a structured goal draft that preserves the relationship intention', () => {
    const draft = buildGoalDraftFromChatDraft(
      'Hey Jaluza, could we protect one 20-minute no-phone pocket this week? I want us to feel less rushed.',
    )

    expect(draft.title).toBe('protect one 20-minute no-phone pocket this week')
    expect(draft.description).toContain('Practice the promise from this draft')
    expect(draft.description).toContain('feel less rushed')
    expect(draft.description).toContain('adjust together')
  })
})
