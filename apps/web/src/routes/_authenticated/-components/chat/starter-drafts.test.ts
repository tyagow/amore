import { describe, expect, it } from 'vitest'
import { getDraftCareChecks } from './draft-care-check'
import { STARTERS, getStarters } from './starter-drafts'

describe('chat starter drafts', () => {
  it('keeps every starter ready for the composer care check', () => {
    expect(STARTERS.map((starter) => starter.label)).toEqual([
      'Appreciate',
      'Check in',
      'Repair',
      'Need',
      'Own my part',
      'Reassure',
      'Break silence',
      'No reply',
      'Respect no',
      'Redo message',
      'Before advice',
      'After yes',
      'Both true',
    ])

    for (const starter of STARTERS) {
      expect(getDraftCareChecks(starter.text).filter((check) => !check.passed)).toEqual([])
    }
  })

  it('localizes starter chip drafts in Portuguese', () => {
    const ptStarters = getStarters('pt-BR')
    expect(ptStarters.map((starter) => starter.label)).toEqual(STARTERS.map((starter) => starter.label))

    const appreciate = ptStarters.find((starter) => starter.label === 'Appreciate')?.text ?? ''
    expect(appreciate).toContain('Percebi algo que agradeci')
    expect(appreciate).not.toContain('I noticed something')

    for (const starter of ptStarters) {
      expect(starter.text).not.toMatch(/\b(I care|Could we|Would you|If now is not)\b/)
    }
  })
})
