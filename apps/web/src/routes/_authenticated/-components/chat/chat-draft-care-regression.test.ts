import { describe, expect, it } from 'vitest'
import { buildAftercareDraft } from './aftercare-draft'
import { buildAfterYesDraft } from './after-yes-draft'
import { buildApologyDraft } from './apology-draft'
import { buildAppreciationDraft } from './appreciation-draft'
import { buildBeforeAdviceDraft } from './before-advice-draft'
import { buildBidRepairDraft } from './bid-repair-draft'
import { buildBothTrueDraft } from './both-true-draft'
import { buildConflictMapDraft } from './conflict-map-draft'
import { getDraftCareChecks } from './draft-care-check'
import { buildFollowUpDraft } from './follow-up-draft'
import { buildListenFirstDraft } from './listen-draft'
import { buildLongingDraft } from './longing-draft'
import { buildNeedDraft } from './need-draft'
import { buildPauseBeforeSendDraft } from './pause-draft'
import { buildReassuranceDraft } from './reassurance-draft'
import { buildRedoMessageDraft } from './redo-message-draft'
import { buildRepairDraft } from './repair-draft'
import { buildRespectNoDraft } from './respect-no-draft'
import {
  buildNoReplyFollowupDraft,
  buildSilenceRepairDraft,
} from './silence-repair-draft'
import { buildSpaceDraft } from './space-draft'

const representativeDrafts = [
  buildAftercareDraft('I felt hurt when we ended the call without saying goodnight.'),
  buildAfterYesDraft(),
  buildApologyDraft({
    action: 'I dismissed your concern too quickly',
    impact: 'it probably made you feel alone with it',
    ownership: 'I got defensive instead of listening first',
    repair: 'could I listen again and summarize what I missed?',
  }),
  buildAppreciationDraft({
    noticed: 'you made dinner even though you were tired',
    quality: 'it showed me your generosity',
    impact: 'I felt cared for and less alone',
    invitation: 'could we cook together one night this week?',
  }),
  buildBeforeAdviceDraft(),
  buildBidRepairDraft({
    missed: 'you tried to tell me about your day and I stayed on my phone',
    impact: 'it probably made you feel unimportant',
    wish: 'I wish I had put the phone down and listened',
    offer: 'can I ask about it now and listen properly?',
  }),
  buildBothTrueDraft(),
  buildConflictMapDraft({
    observation: 'the plans changed after I had already organized my night',
    feeling: 'I felt unimportant and caught off guard',
    story: 'I started telling myself my time did not matter',
    request: 'could we tell each other earlier when plans shift?',
  }),
  buildFollowUpDraft('Hey, I felt hurt when plans changed after I arranged my night. I got defensive after that.'),
  buildListenFirstDraft({
    heard: 'you felt dismissed when I changed plans late',
    emotion: 'unimportant and frustrated',
    ownership: 'I told you too late and made it sound casual',
    question: 'what would have helped you feel considered?',
  }),
  buildLongingDraft({
    complaint: 'plans change and I find out late',
    longing: 'to feel considered before the decision is final',
    request: 'tell me earlier, even if the answer is not perfect yet',
    appreciation: 'you usually care about making things right',
  }),
  buildNeedDraft({
    need: 'more predictable time together',
    why: 'I relax when I know we have space for us',
    request: 'could we pick one evening before the week starts?',
    flexibility: 'I am flexible on the day',
  }),
  buildPauseBeforeSendDraft('Hey, you never listen to me. I am tired of repeating everything.'),
  buildReassuranceDraft(),
  buildRedoMessageDraft(),
  buildRepairDraft({
    feeling: 'I felt dismissed after dinner',
    ownership: 'I reacted too fast',
    need: 'I need a calmer restart',
    request: 'talk after dinner?',
  }),
  buildRespectNoDraft(),
  buildNoReplyFollowupDraft(),
  buildSilenceRepairDraft(),
  buildSpaceDraft({
    capacity: 'I am too activated to listen well right now',
    reassurance: 'I love you and I want to do this carefully',
    returnTime: 'I can come back after dinner at 8',
    request: 'could we pause and try again then?',
  }),
]

describe('chat draft care regression', () => {
  it('keeps representative guided drafts clear of follow-up care buttons', () => {
    for (const draft of representativeDrafts) {
      const failedLabels = getDraftCareChecks(draft)
        .filter((check) => !check.passed)
        .map((check) => check.label)

      expect(failedLabels, draft).toEqual([])
    }
  })

  it('keeps representative Portuguese guided drafts out of English templates', () => {
    const ptDrafts = [
      buildAftercareDraft('Eu fiquei magoado quando a ligacao terminou fria.', 'pt-BR'),
      buildAfterYesDraft({}, 'pt-BR'),
      buildApologyDraft({ action: 'eu respondi seco depois do jantar' }, 'pt-BR'),
      buildAppreciationDraft({ noticed: 'voce preparou o jantar' }, 'pt-BR'),
      buildBeforeAdviceDraft({}, 'pt-BR'),
      buildBidRepairDraft({ missed: 'voce tentou falar do seu dia e eu fiquei no celular' }, 'pt-BR'),
      buildBothTrueDraft({}, 'pt-BR'),
      buildConflictMapDraft({ observation: 'os planos mudaram em cima da hora' }, 'pt-BR'),
      buildFollowUpDraft('Oi, fiquei magoado quando os planos mudaram.', 'pt-BR'),
      buildListenFirstDraft({ heard: 'voce se sentiu deixado de lado' }, 'pt-BR'),
      buildLongingDraft({ complaint: 'os planos mudam tarde' }, 'pt-BR'),
      buildNeedDraft({ need: '', why: '', request: '', flexibility: '' }, 'pt-BR'),
      buildPauseBeforeSendDraft('Oi, estou muito ativado agora.', 'pt-BR'),
      buildReassuranceDraft({}, 'pt-BR'),
      buildRedoMessageDraft({}, 'pt-BR'),
      buildRepairDraft({}, 'pt-BR'),
      buildRespectNoDraft({}, 'pt-BR'),
      buildNoReplyFollowupDraft({}, 'pt-BR'),
      buildSilenceRepairDraft({}, 'pt-BR'),
      buildSpaceDraft({}, 'pt-BR'),
    ]

    for (const draft of ptDrafts) {
      expect(draft).not.toMatch(/\b(I care|Could we|Would you|If now is not|What I|Can I)\b/)
    }
  })
})
