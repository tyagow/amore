import { describe, expect, it } from 'vitest'

import { extractedEntitiesSchema } from './schemas'

const baseEntities = {
  wishes: [],
  importantDates: [],
  interests: [],
}

describe('extractedEntitiesSchema', () => {
  it('accepts the expected loveLanguages array shape', () => {
    const result = extractedEntitiesSchema.parse({
      ...baseEntities,
      loveLanguages: [{ language: 'quality_time', confidence: 0.9 }],
    })

    expect(result.loveLanguages).toEqual([
      { language: 'quality_time', confidence: 0.9 },
    ])
  })

  it('normalizes object-shaped loveLanguages responses', () => {
    const result = extractedEntitiesSchema.parse({
      ...baseEntities,
      loveLanguages: {
        primary: 'quality_time',
        secondary: 'acts_of_service',
        confidence: 0.82,
      },
    })

    expect(result.loveLanguages).toEqual([
      { language: 'quality_time', confidence: 0.82 },
      { language: 'acts_of_service', confidence: 0.82 },
    ])
  })

  it('normalizes score-map loveLanguages responses', () => {
    const result = extractedEntitiesSchema.parse({
      ...baseEntities,
      loveLanguages: {
        words_of_affirmation: 0.75,
        quality_time: '0.66',
      },
    })

    expect(result.loveLanguages).toEqual([
      { language: 'words_of_affirmation', confidence: 0.75 },
      { language: 'quality_time', confidence: 0.66 },
    ])
  })
})
