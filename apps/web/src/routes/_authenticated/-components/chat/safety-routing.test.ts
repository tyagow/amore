import { describe, expect, it } from 'vitest'

import { getSafetyRoutingDraft } from './safety-routing'

describe('getSafetyRoutingDraft', () => {
  it('routes self-harm language away from repair advice', () => {
    const routing = getSafetyRoutingDraft('I want to kill myself after this fight')

    expect(routing?.kind).toBe('self_harm')
    expect(routing?.draft).toContain('do not use an AI-mediated conversation')
    expect(routing?.draft.toLowerCase()).not.toContain('repair message to send')
  })

  it('routes abuse and fear language to external support', () => {
    const routing = getSafetyRoutingDraft('I am scared of them and feel trapped')

    expect(routing?.kind).toBe('abuse')
    expect(routing?.draft).toContain('specialized support')
  })

  it('does not block ordinary repair drafts', () => {
    expect(getSafetyRoutingDraft('I got defensive and want to own my part')).toBeNull()
  })
})
