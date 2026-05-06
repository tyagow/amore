import { describe, expect, it } from 'vitest'

import {
  canAccessCoachThread,
  getCoachThreadVisibility,
} from './coach-authorization'

describe('coach thread authorization', () => {
  it('keeps private coach threads visible only to the owner', () => {
    const thread = { coupleId: null, userId: 'user-a' }

    expect(canAccessCoachThread(thread, { userId: 'user-a', coupleId: 'couple-1' })).toBe(true)
    expect(canAccessCoachThread(thread, { userId: 'user-b', coupleId: 'couple-1' })).toBe(false)
  })

  it('allows explicit shared coach threads for members of the same couple', () => {
    const thread = { coupleId: 'couple-1', userId: null }

    expect(canAccessCoachThread(thread, { userId: 'user-b', coupleId: 'couple-1' })).toBe(true)
    expect(canAccessCoachThread(thread, { userId: 'user-c', coupleId: 'couple-2' })).toBe(false)
  })

  it('does not expose shared threads when the requester has no couple context', () => {
    const thread = { coupleId: 'couple-1', userId: null }

    expect(canAccessCoachThread(thread, { userId: 'user-a', coupleId: null })).toBe(false)
  })

  it('derives visibility from couple scope only', () => {
    expect(getCoachThreadVisibility({ coupleId: null, userId: 'user-a' })).toBe('private')
    expect(getCoachThreadVisibility({ coupleId: 'couple-1', userId: 'user-a' })).toBe('private')
    expect(getCoachThreadVisibility({ coupleId: 'couple-1', userId: null })).toBe('shared')
  })
})
