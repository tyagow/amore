import { describe, expect, it } from 'vitest'
import { buildBothTrueDraft } from './both-true-draft'

describe('buildBothTrueDraft', () => {
  it('keeps two perspectives valid before problem-solving', () => {
    expect(buildBothTrueDraft()).toBe([
      'When we talk about this moment today, I can see that your experience is real, even if I experienced it differently.',
      '',
      'My experience is also real, and I want to say it without erasing yours.',
      '',
      'I care about us understanding both sides more than proving one of us right.',
      '',
      'Could we each say what we most need the other to understand before we try to solve it, or pause and come back later if that is too much right now?',
    ].join('\n'))
  })

  it('normalizes custom disagreement lines', () => {
    const draft = buildBothTrueDraft({
      partnerTruth: 'I believe you that dinner felt lonely',
      myTruth: 'I was overwhelmed and not trying to pull away',
      sharedCare: 'I care about us finding the pattern instead of blaming each other',
      nextQuestion: 'Could we name the one part we each want understood tonight?',
    })

    expect(draft).toContain('I believe you that dinner felt lonely.')
    expect(draft).toContain('I was overwhelmed and not trying to pull away.')
    expect(draft).toContain('I care about us finding the pattern instead of blaming each other.')
    expect(draft).toContain('Could we name the one part we each want understood tonight?')
  })
})
