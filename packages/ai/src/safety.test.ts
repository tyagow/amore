import { describe, expect, it } from 'vitest'

import { getCoachSafetyInstruction } from './safety'

describe('getCoachSafetyInstruction', () => {
  it('keeps crisis and abuse outside AI mediation', () => {
    const instruction = getCoachSafetyInstruction('en')

    expect(instruction).toContain('not therapy')
    expect(instruction).toContain('do not mediate')
    expect(instruction).toContain('do not draft a message to send')
    expect(instruction).toContain('specialized support')
  })

  it('localizes the safety boundary for Portuguese coach prompts', () => {
    const instruction = getCoachSafetyInstruction('pt-BR')

    expect(instruction).toContain('nao e terapeuta')
    expect(instruction).toContain('nao medie')
    expect(instruction).toContain('suporte especializado')
  })
})
