import { describe, expect, it } from 'vitest'

import { buildImportFallbackAnalysis } from './import-fallback'
import type { Message } from '@amore-couples/types'

function message(senderId: string, index: number): Message {
  return {
    id: `m-${index}`,
    coupleId: 'couple-1',
    waMessageId: null,
    senderId,
    text: `Message ${index}`,
    timestamp: new Date(`2026-05-0${(index % 5) + 1}T12:00:00Z`),
    sentiment: null,
    isMedia: false,
    source: 'export',
    createdAt: new Date(),
  }
}

describe('buildImportFallbackAnalysis', () => {
  it('returns conservative dashboard-ready insights without AI', () => {
    const output = buildImportFallbackAnalysis(
      [message('You', 1), message('Partner', 2), message('Partner', 3)],
      'couple-1',
      'You',
    )

    expect(output.healthScore).toBeGreaterThanOrEqual(45)
    expect(output.healthScore).toBeLessThanOrEqual(72)
    expect(output.summary).toContain('Imported 3 WhatsApp messages')
    expect(output.insightRows).toEqual([
      expect.objectContaining({ type: 'health_score' }),
      expect.objectContaining({ type: 'communication_pattern' }),
    ])
    expect(output.profileData.loveLanguages).toEqual([])
  })

  it('localizes the fallback summary', () => {
    const output = buildImportFallbackAnalysis([message('Voce', 1)], 'couple-1', 'Voce', 'pt-BR')

    expect(output.summary).toContain('mensagens do WhatsApp foram importadas')
  })
})
