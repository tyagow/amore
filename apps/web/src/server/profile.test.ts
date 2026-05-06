import { describe, expect, it } from 'vitest'
describe('profile json normalization', () => {
  async function loadProfileNormalizers() {
    process.env.DATABASE_URL ??= 'postgres://user:password@localhost:5432/amore_test'
    return import('./profile')
  }

  it('normalizes AI array-shaped profile data into the profile UI contract', async () => {
    const { normalizeInterests, normalizeLoveLanguages } = await loadProfileNormalizers()

    expect(normalizeLoveLanguages([
      { language: 'Quality Time', confidence: 0.7 },
      { language: 'Acts of Service', confidence: 0.9 },
    ])).toEqual({
      primary: 'Acts of Service',
      secondary: 'Quality Time',
      source: 'ai',
    })

    expect(normalizeInterests(['cycling', ' cooking '])).toEqual({
      items: ['cycling', 'cooking'],
      source: 'ai',
    })
  })

  it('preserves canonical manual profile data', async () => {
    const {
      normalizeCommunicationStyle,
      normalizeInterests,
      normalizeLoveLanguages,
    } = await loadProfileNormalizers()

    expect(normalizeLoveLanguages({
      primary: 'Words of Affirmation',
      secondary: 'Quality Time',
      source: 'manual',
    })).toEqual({
      primary: 'Words of Affirmation',
      secondary: 'Quality Time',
      source: 'manual',
    })

    expect(normalizeCommunicationStyle({
      type: 'Supportive',
      description: 'Leads with empathy',
      source: 'manual',
    })).toEqual({
      type: 'Supportive',
      description: 'Leads with empathy',
      source: 'manual',
    })

    expect(normalizeInterests({
      items: ['music'],
      source: 'manual',
    })).toEqual({
      items: ['music'],
      source: 'manual',
    })
  })

  it('does not treat metadata-only objects as interests', async () => {
    const { normalizeInterests } = await loadProfileNormalizers()

    expect(normalizeInterests({ source: 'ai' })).toBeNull()
    expect(normalizeInterests({ confidence: 0.8, evidence: 'mentioned once' })).toBeNull()
  })
})
