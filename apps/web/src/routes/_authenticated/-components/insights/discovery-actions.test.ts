import { describe, expect, it } from 'vitest'
import {
  buildDiscoveryMove,
  buildImportantDateChatDraft,
  buildInterestChatDraft,
  buildWishChatDraft,
  getEntityField,
  getEntityText,
  getDiscoveryLabel,
  getDiscoveryList,
} from './discovery-actions'
import { getDraftCareChecks } from '../chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('discovery insight actions', () => {
  it('normalizes object-shaped interests', () => {
    expect(getDiscoveryLabel({ topic: 'Brazilian music' })).toBe('Brazilian music')
    expect(getDiscoveryLabel('{"topic":"Cooking"}')).toBe('Cooking')
    expect(getDiscoveryLabel({ item: 'quiet dinner' })).toBe('quiet dinner')
  })

  it('turns an object map of interests into labels', () => {
    expect(getDiscoveryList({ first: { topic: 'Travel' }, second: 'Coffee' })).toEqual([
      'Travel',
      'Coffee',
    ])
  })

  it('prioritizes active wishes as the next move', () => {
    const move = buildDiscoveryMove({
      myInterests: [],
      partnerInterests: [],
      entities: [
        {
          type: 'wish',
          status: 'active',
          content: { text: 'take a quiet weekend trip' },
        },
      ],
      partnerName: 'Alex',
    })

    expect(move.kind).toBe('wish')
    expect(move.chatDraft).toContain('take a quiet weekend trip')
    expect(move.chatDraft).toContain('not like another task')
    expect(move.chatDraft).toContain('smaller version later')
    expectCareReady(move.chatDraft)
    expect(move.goalDraft.title).toContain('Do one small thing')
    expect(move.goalDraft.description).toContain('thoughtful and voluntary')
  })

  it('uses a shared interest when no wish or date exists', () => {
    const move = buildDiscoveryMove({
      myInterests: ['Cooking'],
      partnerInterests: [{ topic: 'Cooking' }],
      entities: [],
    })

    expect(move.kind).toBe('shared_interest')
    expect(move.chatDraft).toContain('easy connection')
    expect(move.chatDraft).toContain('not a good time')
    expectCareReady(move.chatDraft)
    expect(move.goalDraft.title).toBe('Make time for Cooking together')
    expect(move.goalDraft.description).toContain('enjoyable for both')
  })

  it('turns partner-only interests into curiosity goals with follow-through', () => {
    const move = buildDiscoveryMove({
      myInterests: ['Coffee'],
      partnerInterests: [{ topic: 'Cycling' }],
      entities: [],
      partnerName: 'Alex',
    })

    expect(move.kind).toBe('partner_interest')
    expect(move.chatDraft).toContain('knowing that part of your world')
    expect(move.chatDraft).toContain('come back to it later')
    expectCareReady(move.chatDraft)
    expect(move.goalDraft.title).toBe('Ask about Cycling')
    expect(move.goalDraft.description).toContain('reflect back one thing you learned')
  })

  it('builds direct drafts for individual discovery rows', () => {
    const wish = buildWishChatDraft('take a trip')
    const date = buildImportantDateChatDraft('May 12 anniversary')
    const interest = buildInterestChatDraft('cycling')

    expect(wish).toContain('honor it this week')
    expect(date).toContain('make it feel cared for')
    expect(date).toContain('protecting it before it becomes rushed')
    expect(interest).toContain('what you have been enjoying')
    expectCareReady(wish)
    expectCareReady(date)
    expectCareReady(interest)
  })

  it('keeps the fallback discovery move ready for the composer care check', () => {
    const move = buildDiscoveryMove({
      myInterests: [],
      partnerInterests: [],
      entities: [],
    })

    expect(move.kind).toBe('fallback')
    expectCareReady(move.chatDraft)
  })

  it('extracts readable entity text and fields from JSON content', () => {
    const entity = {
      type: 'wish',
      content: '{"item":"cook together","speaker":"Alex"}',
    }

    expect(getEntityText(entity)).toBe('cook together')
    expect(getEntityField(entity, 'speaker')).toBe('Alex')
  })
})
