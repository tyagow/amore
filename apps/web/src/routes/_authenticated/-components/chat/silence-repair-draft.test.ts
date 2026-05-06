import { describe, expect, it } from 'vitest'
import {
  buildNoReplyFollowupDraft,
  buildSilenceRepairDraft,
} from './silence-repair-draft'

describe('buildSilenceRepairDraft', () => {
  it('creates a default reconnecting message after silence', () => {
    expect(buildSilenceRepairDraft()).toBe([
      'I care about us, and I have been quiet, but I do not want distance to become our answer.',
      '',
      'I can own that I did not make it easy to reconnect.',
      '',
      'Could we restart with one gentle check-in today?',
      '',
      'If that does not work, could we choose a smaller version or another time?',
    ].join('\n'))
  })

  it('normalizes custom silence-repair lines', () => {
    expect(buildSilenceRepairDraft({
      care: 'I miss feeling easy with you',
      ownership: 'I avoided the conversation after dinner',
      invitation: 'Could we sit together for ten minutes tonight?',
    })).toBe([
      'I miss feeling easy with you.',
      '',
      'I avoided the conversation after dinner.',
      '',
      'Could we sit together for ten minutes tonight?',
      '',
      'If that does not work, could we choose a smaller version or another time?',
    ].join('\n'))
  })

  it('creates a non-accusing follow-up after no reply', () => {
    expect(buildNoReplyFollowupDraft()).toBe([
      'I sent something vulnerable and noticed I started filling in the silence with stories.',
      '',
      'I care about staying connected, and I am not trying to pressure you or start a fight.',
      '',
      'Could you let me know when you have space to respond, even if the answer is later today?',
    ].join('\n'))
  })

  it('normalizes custom no-reply follow-up lines', () => {
    expect(buildNoReplyFollowupDraft({
      originalBid: 'I asked about tonight and got anxious when it stayed unanswered',
      reassurance: 'I know you may just be busy',
      clearAsk: 'Could you send me a quick yes, no, or later by dinner?',
    })).toContain('I asked about tonight and got anxious when it stayed unanswered.')
  })
})
