import { describe, expect, it } from 'vitest'
import {
  SUPPORT_NEEDS,
  buildCheckinDraft,
  buildCheckinRhythmGoalDraft,
  buildCheckinRhythmDraft,
  buildPartnerCheckinThanksDraft,
  buildPartnerCheckinInviteDraft,
  buildPartnerSupportAvoidanceDraft,
  buildPartnerSupportResponseDraft,
  buildReciprocalSupportDraft,
  buildSupportCoachPrompt,
  buildSupportAvoidanceDraft,
  buildSupportFollowupDraft,
  buildSupportGoalDraft,
  buildSupportLandingCheckDraft,
  buildSupportGoalTitle,
  buildSupportThanksDraft,
  buildTonightPlanDraft,
  inferSupportNeedFromAnswer,
} from './daily-checkin-support'
import { getDraftCareChecks } from './chat/draft-care-check'

function expectCareReady(draft: string) {
  expect(getDraftCareChecks(draft).filter((check) => !check.passed)).toEqual([])
}

describe('daily check-in support helpers', () => {
  it('keeps every support option concrete and sendable', () => {
    expect(SUPPORT_NEEDS.map((need) => need.label)).toEqual([
      'Just listen',
      'Warmth',
      'Practical help',
      'A little space',
      'Check later',
    ])

    for (const need of SUPPORT_NEEDS) {
      expect(need.answer.length).toBeGreaterThan(12)
      expect(need.phrase.length).toBeGreaterThan(12)
    }
  })

  it('builds a low-mood draft with a selected support request', () => {
    expect(buildCheckinDraft('low', 'listen')).toContain('I am feeling low today')
    expect(buildCheckinDraft('low', 'listen')).toContain('What would help')
    expect(buildCheckinDraft('low', 'listen')).toContain('just listening')
    expectCareReady(buildCheckinDraft('low', 'listen'))
  })

  it('builds a struggling draft without forcing a selected support request', () => {
    const draft = buildCheckinDraft('struggling', null)

    expect(draft).toContain('I am struggling today')
    expect(draft).toContain('making support easier')
    expect(draft).toContain('smaller support moment later')
    expectCareReady(draft)
  })

  it('recovers a saved support need from the check-in answer', () => {
    expect(inferSupportNeedFromAnswer('I could use warmth and reassurance.')).toBe('warmth')
  })

  it('builds follow-up chat and coach prompts from a support need', () => {
    expect(buildSupportFollowupDraft('space')).toContain('a little space')
    expectCareReady(buildSupportFollowupDraft('space'))
    expect(buildSupportCoachPrompt('help')).toContain('practical help')
  })

  it('builds a thanks draft after support is received', () => {
    const draft = buildSupportThanksDraft('Jaluza', 'listen')

    expect(draft).toContain('Hey Jaluza, I want to notice the care you gave today.')
    expect(draft).toContain('When I asked for just listen')
    expect(draft).toContain('It made me feel')
    expect(draft).toContain('Thank you for not making me carry that alone.')
    expectCareReady(draft)
  })

  it('builds a landing check after a support ask', () => {
    const draft = buildSupportLandingCheckDraft('Jaluza', 'space')

    expect(draft).toContain('Hey Jaluza, can I check whether my support ask landed clearly?')
    expect(draft).toContain('I could use a little space')
    expect(draft).toContain('What helped me was')
    expect(draft).toContain('What still felt hard or unclear was')
    expect(draft).toContain('adjust one small thing')
    expectCareReady(draft)
  })

  it('builds a gentle what-not-to-do support draft', () => {
    const draft = buildSupportAvoidanceDraft('Jaluza', 'listen')

    expect(draft).toContain('Hey Jaluza, I want to make my support ask easier to get right')
    expect(draft).toContain('I do not need you to fix it')
    expect(draft).toContain('One thing that probably would not help today is')
    expect(draft).toContain('could we try this instead')
    expectCareReady(draft)
  })

  it('invites a partner check-in without pressure while preserving my support ask', () => {
    const draft = buildPartnerCheckinInviteDraft('Jaluza', 'help')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('I could use practical help with one thing')
    expect(draft).toContain('not want to pressure')
    expect(draft).toContain('what would help you feel cared for')
    expectCareReady(draft)
  })

  it('turns support needs into concrete follow-through goals', () => {
    expect(buildSupportGoalTitle('listen')).toBe(
      'Follow through today: Listen for 10 minutes without fixing or defending',
    )
    expect(buildSupportGoalTitle('help', 'Jaluza')).toBe(
      'Support Jaluza today: Take one practical task off the other person without making them manage it',
    )
  })

  it('builds a richer stored goal draft from a support need', () => {
    const draft = buildSupportGoalDraft('warmth')

    expect(draft.title).toBe('Follow through today: Offer one clear reassurance and one specific appreciation')
    expect(draft.description).toContain('Make warmth visible today')
    expect(draft.description).toContain('gentle check')
    expect(draft.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('builds a reciprocal support ask after naming my own need', () => {
    const draft = buildReciprocalSupportDraft('Jaluza', 'warmth')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('I named my own ask: I could use warmth and reassurance,')
    expect(draft).toContain('not want today to become only about me')
    expect(draft).toContain('What would help you feel cared for today?')
    expectCareReady(draft)
  })

  it('builds a caring response to a partner support ask', () => {
    const draft = buildPartnerSupportResponseDraft('Jaluza', 'listen')

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('I saw your check-in')
    expect(draft).toContain('I could use listening, not fixing')
    expect(draft).toContain('I can do that')
    expectCareReady(draft)
  })

  it('asks what to avoid before supporting a partner', () => {
    const draft = buildPartnerSupportAvoidanceDraft('Jaluza', 'help')

    expect(draft).toContain('Hey Jaluza, I want to support you without accidentally making this heavier.')
    expect(draft).toContain('I could use practical help with one thing')
    expect(draft).toContain('Is there anything I should avoid')
    expect(draft).toContain('If yes, I can replace it with')
    expectCareReady(draft)
  })

  it('thanks a partner for checking in before moving to support', () => {
    const draft = buildPartnerCheckinThanksDraft('Jaluza', 'warmth')

    expect(draft).toContain('Hey Jaluza, thank you for checking in today.')
    expect(draft).toContain('I heard that today you could use: I could use warmth and reassurance.')
    expect(draft).toContain('One way I can show care')
    expect(draft).toContain('Did I understand what would help you today?')
    expectCareReady(draft)
  })

  it('turns a check-in into a simple plan for tonight', () => {
    const draft = buildTonightPlanDraft('low', 'warmth')

    expect(draft).toContain('tiny plan for tonight')
    expect(draft).toContain('My mood today is: low')
    expect(draft).toContain('warmth and reassurance')
    expect(draft).toContain('One small plan I can offer too')
    expect(draft).toContain('smaller version later')
    expectCareReady(draft)
  })

  it('turns the weekly check-in rhythm into a no-scorecard conversation', () => {
    const draft = buildCheckinRhythmDraft({
      partnerName: 'Jaluza',
      togetherDays: 2,
      mineMood: 'low',
      partnerMood: null,
    })

    expect(draft).toContain('Hey Jaluza')
    expect(draft).toContain('not a scorecard')
    expect(draft).toContain('2/7 days')
    expect(draft).toContain('My last check-in mood was low')
    expect(draft).toContain('I do not want to guess')
    expect(draft).toContain('smallest version')
    expectCareReady(draft)
  })

  it('turns the check-in rhythm into a tiny goal draft', () => {
    const draft = buildCheckinRhythmGoalDraft({
      partnerName: 'Jaluza',
      togetherDays: 2,
    })

    expect(draft.title).toBe('Make check-ins easier with Jaluza')
    expect(draft.description).toContain('2/7 days')
    expect(draft.description).toContain('smallest daily version')
    expect(draft.description).toContain('scorecard')
    expect(draft.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
