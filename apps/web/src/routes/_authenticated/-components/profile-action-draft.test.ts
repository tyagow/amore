import { describe, expect, it } from 'vitest'
import {
  buildCommunicationStyleDraft,
  buildInterestDraft,
  buildLoveLanguageDraft,
  buildProfileBridgeDraft,
  getProfileInterestItems,
} from './profile-action-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('profile action drafts', () => {
  it('builds a love language action draft', () => {
    const draft = buildLoveLanguageDraft('Jaluza', 'Acts of Service')

    expect(draft).toContain('Acts of Service')
    expect(draft).toContain('make that feel real')
    expectCareReady(draft)
  })

  it('builds a communication style draft with context', () => {
    const draft = buildCommunicationStyleDraft('Jaluza', 'Supportive', 'Leads with empathy')

    expect(draft).toContain('Supportive: Leads with empathy')
    expect(draft).toContain('safe and clear')
    expectCareReady(draft)
  })

  it('builds an interest curiosity draft', () => {
    const draft = buildInterestDraft('Jaluza', 'cycling')

    expect(draft).toContain('what you have been enjoying')
    expect(draft).toContain('one tiny shared version this week')
    expectCareReady(draft)
  })

  it('builds a bridge draft from both profiles', () => {
    const draft = buildProfileBridgeDraft({
      partnerName: 'Jaluza',
      myLoveLanguage: 'Quality Time',
      partnerLoveLanguage: 'Acts of Service',
      myCommunicationStyle: 'Direct',
      partnerCommunicationStyle: 'Supportive',
    })

    expect(draft).toContain('practical instructions, not labels')
    expect(draft).toContain('For me, care may land through: Quality Time.')
    expect(draft).toContain('For Jaluza, care may land through: Acts of Service.')
    expect(draft).toContain('one small adjustment for this week')
    expectCareReady(draft)
  })

  it('normalizes profile interests from multiple stored shapes', () => {
    expect(getProfileInterestItems({ items: ['cycling', ' cooking '] })).toEqual(['cycling', 'cooking'])
    expect(getProfileInterestItems({ items: ['{"topic":"Bike"}'] })).toEqual(['Bike'])
    expect(getProfileInterestItems(['plants'])).toEqual(['plants'])
    expect(getProfileInterestItems(['{"topic":"Running","evidence":"mentioned often"}'])).toEqual(['Running'])
    expect(getProfileInterestItems('music, travel')).toEqual(['music', 'travel'])
    expect(getProfileInterestItems({ first: 'running', second: 'coffee' })).toEqual(['running', 'coffee'])
  })
})
