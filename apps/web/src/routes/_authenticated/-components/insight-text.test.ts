import { describe, expect, it } from 'vitest'
import { getInsightText } from './insight-text'

describe('getInsightText', () => {
  it('uses the strongest user-facing text field first', () => {
    expect(getInsightText({ tip: 'Ask one follow-up question', title: 'Ignored' })).toBe(
      'Ask one follow-up question',
    )
  })

  it('humanizes known communication pattern keys', () => {
    expect(getInsightText({ pattern: 'avgResponseMinutes' })).toBe('Average response time')
    expect(getInsightText({ pattern: 'avgLengthBySender' })).toBe('Message depth by person')
    expect(getInsightText({ pattern: 'initiationBalance' })).toBe('Who starts conversations')
    expect(getInsightText({ pattern: 'messageCountBySender' })).toBe('Conversation share')
  })

  it('formats love-language signals without leaking raw keys', () => {
    expect(getInsightText({ language: 'acts_of_service', confidence: 0.9 })).toBe(
      'Acts of service (90% signal)',
    )
    expect(getInsightText({ language: 'quality_time' })).toBe('Quality time')
  })

  it('falls back to readable copy for unknown structured content', () => {
    expect(getInsightText({ pattern: 'lateNightRepairAttempts' })).toBe(
      'Late night repair attempts',
    )
    expect(getInsightText({})).toBe('New insight available')
  })

  it('localizes structured insight labels in Portuguese', () => {
    expect(getInsightText({ pattern: 'avgResponseMinutes' }, 'pt-BR')).toBe('Tempo medio de resposta')
    expect(getInsightText({ language: 'acts_of_service', confidence: 0.9 }, 'pt-BR')).toBe(
      'Atos de servico (90% sinal)',
    )
  })

  it('does not render legacy English AI blobs directly in Portuguese', () => {
    expect(
      getInsightText(
        {
          summary:
            'The partner carries significantly more of the conversational load, initiating most exchanges.',
        },
        'pt-BR',
      ),
    ).toBe('Ha um padrao de comunicacao que vale conversar com calma, sem transformar o dado em culpa.')
  })
})
