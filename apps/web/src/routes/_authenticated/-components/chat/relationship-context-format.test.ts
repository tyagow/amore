import { describe, expect, it } from 'vitest'
import {
  formatRelationshipLabel,
  getInterestLabel,
} from './relationship-context-format'

describe('relationship context formatting', () => {
  it('formats profile keys as readable labels', () => {
    expect(formatRelationshipLabel('acts_of_service')).toBe('Acts of service')
    expect(formatRelationshipLabel('quality_time')).toBe('Quality time')
    expect(formatRelationshipLabel('avgResponseMinutes')).toBe('Avg response minutes')
  })

  it('localizes love-language labels for Portuguese', () => {
    expect(formatRelationshipLabel('acts_of_service', 'pt-BR')).toBe('Atos de servico')
    expect(formatRelationshipLabel('quality_time', 'pt-BR')).toBe('Tempo de qualidade')
  })

  it('extracts readable interest labels from object payloads', () => {
    expect(getInterestLabel({ topic: 'Ciclismo / Bike', evidence: 'bike maintenance' })).toBe(
      'Ciclismo / Bike',
    )
    expect(getInterestLabel({ title: 'Phone-free dinner' })).toBe('Phone-free dinner')
  })

  it('extracts readable interest labels from JSON strings', () => {
    expect(
      getInterestLabel(
        '{"topic":"Alimentação saudável","evidence":"Sugeriu protein bowl"}',
      ),
    ).toBe('Alimentação saudável')
  })

  it('preserves plain strings and invalid JSON strings', () => {
    expect(getInterestLabel('Corrida')).toBe('Corrida')
    expect(getInterestLabel('{"topic":')).toBe('{"topic":')
  })
})
