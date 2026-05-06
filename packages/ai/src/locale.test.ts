import { describe, expect, it } from 'vitest'
import { getAILocaleInstruction, normalizeAILocale } from './locale'
import { getCoachLocaleInstruction } from './coach-conversation'
import { getDailyQuestion } from './daily-questions'
import { detectNudgeTriggers } from './orchestrate'

describe('AI locale instructions', () => {
  it('keeps chat AI output language explicit', () => {
    expect(getAILocaleInstruction('en')).toContain('respond in English')
    expect(getAILocaleInstruction('pt-BR')).toContain('Brazilian Portuguese')
    expect(getAILocaleInstruction('pt-BR')).toContain('Preserve names')
    expect(getAILocaleInstruction('pt-BR')).toContain('JSON keys')
  })

  it('keeps streaming coach output language explicit', () => {
    expect(getCoachLocaleInstruction('en')).toContain('respond in English')
    expect(getCoachLocaleInstruction('pt-BR')).toContain('Brazilian Portuguese')
    expect(getCoachLocaleInstruction('pt-BR')).toContain('quoted user messages')
  })

  it('normalizes Portuguese locale variants', () => {
    expect(normalizeAILocale('pt')).toBe('pt-BR')
    expect(normalizeAILocale('pt_BR')).toBe('pt-BR')
    expect(normalizeAILocale('en-US')).toBe('en')
  })

  it('localizes non-model relationship copy from the AI package', () => {
    expect(getDailyQuestion('2026-05-05', 'en')).not.toBe(getDailyQuestion('2026-05-05', 'pt-BR'))
    expect(getDailyQuestion('2026-05-05', 'pt-BR')).toContain('voce')

    const [nudge] = detectNudgeTriggers(65, 80, [], 'pt-BR')
    expect(nudge?.message).toContain('saude do relacionamento')
  })
})
