import { describe, expect, it } from 'vitest'
import {
  HOT_MOMENT_STATES,
  buildHotMomentReturnDraft,
  buildHotMomentResetDraft,
} from './hot-moment-reset-draft'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('hot moment reset draft', () => {
  it('offers concrete activated states', () => {
    expect(Object.keys(HOT_MOMENT_STATES)).toEqual([
      'sharp',
      'shutdown',
      'flooded',
      'spiraling',
    ])
  })

  it('builds a pause request that protects connection', () => {
    const draft = buildHotMomentResetDraft({
      state: 'flooded',
      returnTime: '30 minutes',
      resetAction: 'take a walk and write down what I heard',
    })

    expect(draft).toContain('too activated')
    expect(draft).toContain('I care about us')
    expect(draft).toContain('I need 30 minutes')
    expect(draft).toContain('I am not leaving')
    expect(draft).toContain('take a walk')
    expect(draft).toContain('one thing I understood from you')
    expect(draft).toContain('smaller pause or another time')
    expectCareReady(draft)
  })

  it('keeps defaults specific when the user has not customized the reset', () => {
    const draft = buildHotMomentResetDraft({ state: 'shutdown' })

    expect(draft).toContain('I need 20 minutes')
    expect(draft).toContain('breathe, cool down, and come back ready to listen')
    expectCareReady(draft)
  })

  it('builds a return script after the pause', () => {
    const draft = buildHotMomentReturnDraft({
      state: 'sharp',
      returnTime: '15 minutes',
    })

    expect(draft).toContain('back after the 15 minutes pause')
    expect(draft).toContain('what was happening for me')
    expect(draft).toContain('One thing I understood from you')
    expect(draft).toContain('One thing I want to own')
    expect(draft).toContain('another time')
    expectCareReady(draft)
  })
})
