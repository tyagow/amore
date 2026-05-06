import { describe, expect, it } from 'vitest'
import {
  buildDraftReadyForSend,
  buildDraftWithClearAsk,
  buildDraftWithOwnership,
  buildDraftWithRoomForNo,
  buildDraftWithSpecificMoment,
  buildDraftWithWarmth,
  getDraftCareChecks,
  prepareDraftForSend,
} from './draft-care-check'

describe('getDraftCareChecks', () => {
  it('passes a specific draft with an answerable ask', () => {
    const checks = getDraftCareChecks(
      'I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?',
    )

    expect(checks).toEqual([
      expect.objectContaining({ label: 'Specific moment', passed: true }),
      expect.objectContaining({ label: 'Clear next ask', passed: true }),
      expect.objectContaining({ label: 'No global blame', passed: true }),
      expect.objectContaining({ label: 'Warmth signal', passed: false }),
      expect.objectContaining({ label: 'Room for no', passed: false }),
    ])
  })

  it('flags global blame and missing specificity', () => {
    const checks = getDraftCareChecks('You never care about me.')

    expect(checks).toEqual([
      expect.objectContaining({ label: 'Specific moment', passed: false }),
      expect.objectContaining({ label: 'Clear next ask', passed: false }),
      expect.objectContaining({ label: 'No global blame', passed: false }),
      expect.objectContaining({ label: 'Warmth signal', passed: false }),
      expect.objectContaining({ label: 'Room for no', passed: true }),
    ])
  })

  it('passes the warmth signal when the draft names care or appreciation', () => {
    const checks = getDraftCareChecks(
      'I care about us, and I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?',
    )

    expect(checks).toContainEqual(expect.objectContaining({ label: 'Warmth signal', passed: true }))
  })

  it('passes the warmth signal when the draft offers practical support', () => {
    const checks = getDraftCareChecks(
      'I want to support you in the way that actually helps today. Do you want comfort, listening, problem-solving, or a little space right now?',
    )

    expect(checks).toContainEqual(expect.objectContaining({ label: 'Warmth signal', passed: true }))
  })

  it('passes room for no when a request includes later or a smaller version', () => {
    const checks = getDraftCareChecks(
      'I care about us, and I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes, or choose another time if that does not work?',
    )

    expect(checks).toContainEqual(expect.objectContaining({ label: 'Room for no', passed: true }))
  })

  it('passes room for no when a support request offers multiple support choices', () => {
    const checks = getDraftCareChecks(
      'I want to support you when today feels hard. Do you want comfort, listening, problem-solving, or a little space right now?',
    )

    expect(checks).toContainEqual(expect.objectContaining({ label: 'Room for no', passed: true }))
  })
})

describe('buildDraftWithClearAsk', () => {
  it('adds an answerable ask to a statement', () => {
    expect(buildDraftWithClearAsk('I felt hurt when dinner plans changed tonight')).toBe([
      'I felt hurt when dinner plans changed tonight.',
      '',
      'Could we talk for 10 minutes today and pick one next step?',
    ].join('\n'))
  })

  it('does not change a draft that already has an ask', () => {
    expect(buildDraftWithClearAsk('I felt hurt tonight. Could we talk for 10 minutes?')).toBe(
      'I felt hurt tonight. Could we talk for 10 minutes?',
    )
  })
})

describe('buildDraftWithSpecificMoment', () => {
  it('adds a concrete moment prompt to a vague draft', () => {
    expect(buildDraftWithSpecificMoment('I feel disconnected. Could we talk?')).toBe([
      'When ____ happened today, I felt ____.',
      '',
      'I feel disconnected. Could we talk?',
    ].join('\n'))
  })

  it('does not change a draft that already names a moment', () => {
    expect(buildDraftWithSpecificMoment('When dinner plans changed tonight, I felt hurt.')).toBe(
      'When dinner plans changed tonight, I felt hurt.',
    )
  })
})

describe('buildDraftWithOwnership', () => {
  it('replaces blame language with ownership and shared understanding', () => {
    expect(buildDraftWithOwnership('You never care when plans change')).toBe([
      'When ____ happened today, I felt ____.',
      '',
      'I care about us, and I want this to be repair instead of blame.',
      '',
      'I want to say this without making you the whole problem.',
      '',
      'The impact on me was: ____.',
      '',
      'The part I can own is: ____.',
      '',
      'What I want us to understand together is: ____.',
    ].join('\n'))

    expect(getDraftCareChecks(buildDraftWithOwnership('You never care when plans change'))).toContainEqual(
      expect.objectContaining({ label: 'No global blame', passed: true }),
    )
  })
})

describe('buildDraftWithWarmth', () => {
  it('adds a care signal before a clear but cold draft', () => {
    expect(buildDraftWithWarmth('I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?')).toBe([
      'I care about us, and I want to say this in a way that keeps us close.',
      '',
      'I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?',
    ].join('\n'))
  })

  it('does not duplicate warmth when the draft already has it', () => {
    expect(buildDraftWithWarmth('I care about us. Could we talk tonight?')).toBe(
      'I care about us. Could we talk tonight?',
    )
  })
})

describe('buildDraftWithRoomForNo', () => {
  it('adds a lower-pressure alternative to a direct ask', () => {
    expect(buildDraftWithRoomForNo('I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?')).toBe([
      'I felt hurt when dinner plans changed tonight. Could we talk for 10 minutes?',
      '',
      'If that does not work for you, could you suggest a smaller version or another time?',
    ].join('\n'))
  })

  it('does not change a request that already leaves room for later', () => {
    expect(buildDraftWithRoomForNo('Could we talk tonight, or another time if that does not work?')).toBe(
      'Could we talk tonight, or another time if that does not work?',
    )
  })
})

describe('buildDraftReadyForSend', () => {
  it('turns a rough blame draft into a composer-ready draft', () => {
    const draft = buildDraftReadyForSend('You never care when plans change')

    expect(draft).toContain('I care about us')
    expect(draft).toContain('The part I can own is')
    expect(draft).toContain('Could we talk for 10 minutes today')
    expect(draft).toContain('smaller version or another time')
    expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
  })

  it('returns an empty draft when there is nothing to repair', () => {
    expect(buildDraftReadyForSend('   ')).toBe('')
  })
})

describe('prepareDraftForSend', () => {
  it('keeps a ready draft ready for immediate send', () => {
    const draft = [
      'When dinner plans changed today, I felt sad.',
      '',
      'I care about us and want to understand it without blame.',
      '',
      'Could we talk for 10 minutes today?',
      '',
      'If that does not work, could we choose another time?',
    ].join('\n')

    expect(prepareDraftForSend(draft)).toEqual({ ready: true, text: draft })
  })

  it('repairs an unready draft instead of marking it sendable', () => {
    const prepared = prepareDraftForSend('You never care when plans change')

    expect(prepared.ready).toBe(false)
    expect(prepared.text).toContain('I care about us')
    expect(getDraftCareChecks(prepared.text).filter((check) => !check.passed)).toEqual([])
  })

  it('does not send blank drafts', () => {
    expect(prepareDraftForSend('   ')).toEqual({ ready: false, text: '' })
  })
})
