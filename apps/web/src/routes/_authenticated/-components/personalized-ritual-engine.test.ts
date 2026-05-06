import { describe, expect, it } from 'vitest'
import {
  canRevealRitualComparison,
  getRitualLibraryForTests,
  selectPersonalizedRitual,
  type RitualSignals,
} from './personalized-ritual-engine'

const baseSignals: RitualSignals = {
  dateKey: '2026-05-06',
  healthScore: 82,
  messagesSinceAnalysis: 4,
  hasActiveGoals: false,
  partnerMoodSet: true,
  myMood: 'good',
  partnerMood: 'good',
  partnerInterests: [],
  recentCheckins: [
    { bothCheckedIn: true, mineMood: 'good', partnerMood: 'good' },
    { bothCheckedIn: true, mineMood: 'good', partnerMood: 'good' },
    { bothCheckedIn: true, mineMood: 'good', partnerMood: 'good' },
  ],
}

describe('personalized ritual engine', () => {
  it('selects a repair ritual when the relationship signal is low', () => {
    const ritual = selectPersonalizedRitual({
      ...baseSignals,
      healthScore: 58,
    })

    expect(ritual.id).toBe('repair-window')
    expect(ritual.coachPrompt('Jaluza')).toContain('10-minute repair')
  })

  it('uses cooldown history to rotate away from the top ritual', () => {
    const ritual = selectPersonalizedRitual(baseSignals, [
      { id: 'specific-appreciation', dateKey: '2026-05-05' },
    ])

    expect(ritual.id).not.toBe('specific-appreciation')
  })

  it('keeps the ritual library curated instead of free-form prompt only', () => {
    const library = getRitualLibraryForTests()

    expect(library.length).toBeGreaterThanOrEqual(5)
    expect(library.map((ritual) => ritual.id)).toEqual([
      'repair-window',
      'same-question-checkin',
      'specific-appreciation',
      'close-the-loop',
      'phone-free-pocket',
    ])
    expect(library.every((ritual) => ritual.chatDraft('Jaluza', 'en').includes('Jaluza'))).toBe(true)
  })

  it('reveals partner comparison only after both people answer', () => {
    expect(canRevealRitualComparison({
      checkin: { answer: 'I need warmth.' },
      partnerCheckin: null,
    })).toBe(false)

    expect(canRevealRitualComparison({
      checkin: { answer: 'I need warmth.' },
      partnerCheckin: { answer: 'I need calm.' },
    })).toBe(true)
  })
})
