import { describe, expect, it } from 'vitest'
import {
  buildCareSwapInviteDraft,
  buildChangedBehaviorApologyInviteDraft,
  buildGoalCelebrationDraft,
  buildGoalDiscussionDraft,
  buildGoalMidweekCheckInDraft,
  buildGoalProgressAppreciationDraft,
  buildGoalRenegotiationDraft,
  buildGoalSlipRepairDraft,
  buildGoalSupportPlanDraft,
  buildGoalTodayDraft,
  formatGoalDueDate,
  parseStoredGoalDraft,
} from './-goal-draft'
import { getDraftCareChecks } from './-components/chat/draft-care-check'

describe('goal discussion draft copy', () => {
  it('turns an active goal into a concrete chat prompt', () => {
    const draft = buildGoalDiscussionDraft({
      title: 'One phone-free conversation this week',
      description: 'Pick one 20-minute window with no phones.',
      dueDate: '2026-05-12',
    })

    expect(draft).toContain('One phone-free conversation this week')
    expect(draft).toContain('What this means to me')
    expect(draft).toContain('one small thing')
    expect(draft).toContain('May 12')
  })

  it('turns a completed goal into a celebration and learning prompt', () => {
    const draft = buildGoalCelebrationDraft({
      title: 'One appreciation message every day',
      description: 'Send one specific appreciation each day.',
    })

    expect(draft).toContain('completed this together')
    expect(draft).toContain('noticing what worked')
    expect(draft).toContain('what worked')
    expect(draft).toContain('repeat a smaller version')
  })

  it('turns a too-large goal into a no-guilt renegotiation prompt', () => {
    const draft = buildGoalRenegotiationDraft({
      title: 'Repair tension within 24 hours',
      description: 'Start with appreciation, own one part, and ask to understand.',
    })

    expect(draft).toContain('pressure or guilt')
    expect(draft).toContain('doable for both of us')
    expect(draft).toContain('make it smaller')
    expect(draft).toContain('actually keep')
  })

  it('turns an active goal into a midweek progress check-in', () => {
    const draft = buildGoalMidweekCheckInDraft({
      title: 'One appreciation message every day',
      description: 'Send one specific appreciation each day.',
      dueDate: '2026-05-12',
    })

    expect(draft).toContain('Quick goal check-in')
    expect(draft).toContain('adjusting before this turns into pressure')
    expect(draft).toContain('easier than expected')
    expect(draft).toContain('smallest version')
    expect(draft).toContain('May 12')
  })

  it('turns an active goal into a same-day tiny action prompt', () => {
    const draft = buildGoalTodayDraft({
      title: 'One phone-free conversation this week',
      description: 'Pick one 20-minute window with no phones.',
      dueDate: '2026-05-12',
    })

    expect(draft).toContain('smallest version we can actually do today')
    expect(draft).toContain('The bigger goal is: Pick one 20-minute window with no phones.')
    expect(draft).toContain('due May 12')
    expect(draft).toContain('making progress visible')
    expect(draft).toContain('My tiny version for today is')
  })

  it('turns a missed goal into a no-blame repair prompt', () => {
    const draft = buildGoalSlipRepairDraft({
      title: 'Repair tension within 24 hours',
      description: 'Start with appreciation and ask to understand.',
    })

    expect(draft).toContain('slipped on this goal')
    expect(draft).toContain('before it turns into blame')
    expect(draft).toContain('smallest repair version')
    expect(draft).toContain('My part is')
  })

  it('turns an active goal into a support-planning prompt', () => {
    const draft = buildGoalSupportPlanDraft({
      title: 'One phone-free conversation this week',
      description: 'Pick one 20-minute window with no phones.',
    })

    expect(draft).toContain('feel like teamwork')
    expect(draft).toContain('planning support')
    expect(draft).toContain('one obstacle')
    expect(draft).toContain('support each other before it slips')
    expect(draft).toContain('One kind of support')
  })

  it('turns an active goal into progress appreciation', () => {
    const draft = buildGoalProgressAppreciationDraft({
      title: 'One phone-free conversation this week',
      description: 'Pick one 20-minute window with no phones.',
    })

    expect(draft).toContain('notice progress')
    expect(draft).toContain('making effort visible')
    expect(draft).toContain('One thing I saw you try')
    expect(draft).toContain('next smallest step')
    expect(draft).toContain('smaller version')
  })

  it('builds a care-swap invitation for shared practical support', () => {
    const draft = buildCareSwapInviteDraft()

    expect(draft).toContain('10-minute care swap')
    expect(draft).toContain('support feel clearer')
    expect(draft).toContain('daily life feel lighter')
    expect(draft).toContain('My request is')
    expect(draft).toContain('support I can offer')
  })

  it('builds a changed-behavior apology invitation', () => {
    const draft = buildChangedBehaviorApologyInviteDraft()

    expect(draft).toContain('changed behavior, not just words')
    expect(draft).toContain('actually lands for you')
    expect(draft).toContain('The thing I want to own')
    expect(draft).toContain('The specific behavior I will practice differently next time')
    expect(draft).toContain('whether that would actually repair anything')
  })

  it('formats date-only due dates without timezone drift', () => {
    expect(formatGoalDueDate('2026-05-12')).toBe('May 12')
    expect(formatGoalDueDate(new Date('2026-05-12T00:00:00.000Z'))).toBe('May 12')
  })

  it('parses stored goal drafts while keeping old string drafts working', () => {
    expect(parseStoredGoalDraft('One phone-free dinner', '2026-05-12')).toEqual({
      title: 'One phone-free dinner',
      description: 'A tiny relationship practice for this week.',
      dueDate: '2026-05-12',
    })

    expect(parseStoredGoalDraft(JSON.stringify({
      title: 'Support Jaluza today',
      description: 'Listen without fixing.',
    }), '2026-05-12')).toEqual({
      title: 'Support Jaluza today',
      description: 'Listen without fixing.',
      dueDate: '2026-05-12',
    })
  })

  it('keeps representative goal chat drafts clear of follow-up care buttons', () => {
    const goal = {
      title: 'One phone-free conversation this week',
      description: 'Pick one 20-minute window with no phones.',
      dueDate: '2026-05-12',
    }
    const drafts = [
      buildGoalDiscussionDraft(goal),
      buildGoalCelebrationDraft(goal),
      buildGoalRenegotiationDraft(goal),
      buildGoalMidweekCheckInDraft(goal),
      buildGoalTodayDraft(goal),
      buildGoalSupportPlanDraft(goal),
      buildGoalProgressAppreciationDraft(goal),
      buildCareSwapInviteDraft(),
      buildChangedBehaviorApologyInviteDraft(),
      buildGoalSlipRepairDraft(goal),
    ]

    for (const draft of drafts) {
      const failedLabels = getDraftCareChecks(draft)
        .filter((check) => !check.passed)
        .map((check) => check.label)

      expect(failedLabels, draft).toEqual([])
    }
  })
})
