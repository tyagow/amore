import { describe, expect, it } from 'vitest'
import {
  PARTNER_INVITE_UNLOCKS,
  buildPartnerInvitePrivacyNote,
  getConnectionDisplayMode,
} from './partner-invite-value'

describe('partner invite value loop', () => {
  it('keeps the invite focused on shared unlocks', () => {
    expect(PARTNER_INVITE_UNLOCKS).toEqual([
      'Live insights from both sides',
      'Shared goals and follow-through',
      'Rituals you can both complete',
      'Mood sync without guessing',
    ])
  })

  it('separates solo private value from an active partner connection', () => {
    expect(getConnectionDisplayMode('active')).toBe('connected')
    expect(getConnectionDisplayMode('solo')).toBe('solo-value')
    expect(getConnectionDisplayMode(null)).toBe('new-user')
  })

  it('does not imply private import previews are shared by default', () => {
    expect(buildPartnerInvitePrivacyNote(true)).toContain('not shared by default')
    expect(buildPartnerInvitePrivacyNote(true)).toContain('explicitly choose')
    expect(buildPartnerInvitePrivacyNote(false)).toContain('explicitly share')
  })
})
