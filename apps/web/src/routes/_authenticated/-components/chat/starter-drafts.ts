import { buildAfterYesDraft } from './after-yes-draft'
import { buildBeforeAdviceDraft } from './before-advice-draft'
import { buildBothTrueDraft } from './both-true-draft'
import { buildReassuranceDraft } from './reassurance-draft'
import { buildRedoMessageDraft } from './redo-message-draft'
import { buildRespectNoDraft } from './respect-no-draft'
import {
  buildNoReplyFollowupDraft,
  buildSilenceRepairDraft,
} from './silence-repair-draft'
import type { Locale } from '~/lib/i18n'

export type StarterDraft = {
  label: string
  text: string
}

export function getStarters(locale: Locale = 'en'): StarterDraft[] {
  if (locale !== 'pt-BR') return STARTERS

  return [
    {
      label: 'Appreciate',
      text: [
        'Percebi algo que agradeci em voce hoje.',
        '',
        'Uma coisa especifica foi: ____.',
        '',
        'Eu me importo em nomear o que esta funcionando entre nos, nao so o que precisa ser consertado.',
        '',
        'Voce poderia me dizer uma coisa pequena que te ajudou a se sentir apreciado(a) tambem, ou voltamos a isso depois?',
      ].join('\n'),
    },
    {
      label: 'Check in',
      text: [
        'Quero fazer um check-in hoje sem deixar pesado.',
        '',
        'Eu me importo em entender como a gente esta antes que algo fique distante demais.',
        '',
        'Como voce esta se sentindo sobre nos agora?',
        '',
        'Se agora nao for um bom momento, podemos escolher um momento menor depois?',
      ].join('\n'),
    },
    {
      label: 'Repair',
      text: [
        'Quero reparar algo de hoje em vez de deixar isso parado entre nos.',
        '',
        'Eu me importo em deixar isso mais seguro, nao em ganhar um ponto.',
        '',
        'Uma parte que posso assumir e: ____.',
        '',
        'A gente poderia conversar por 10 minutos hoje?',
        '',
        'Se agora nao for um bom momento, podemos escolher um momento menor depois?',
      ].join('\n'),
    },
    {
      label: 'Need',
      text: [
        'Uma coisa de que preciso esta semana e ____.',
        '',
        'Eu me importo em pedir com clareza em vez de transformar isso em distancia.',
        '',
        'Isso me ajudaria a me sentir mais perto porque ____.',
        '',
        'Voce estaria aberto(a) a uma versao pequena disso, ou escolhemos outro momento para conversar?',
      ].join('\n'),
    },
    {
      label: 'Own my part',
      text: [
        'Tenho pensado hoje sobre a minha parte nisso.',
        '',
        'Eu me importo em assumir sem fazer voce carregar a reparacao sozinho(a).',
        '',
        'Acho que eu poderia ter ____.',
        '',
        'Como isso chegou em voce?',
        '',
        'Se agora nao for um bom momento, podemos voltar a isso depois?',
      ].join('\n'),
    },
    { label: 'Reassure', text: buildReassuranceDraft({}, locale) },
    { label: 'Break silence', text: buildSilenceRepairDraft({}, locale) },
    { label: 'No reply', text: buildNoReplyFollowupDraft({}, locale) },
    { label: 'Respect no', text: buildRespectNoDraft({}, locale) },
    { label: 'Redo message', text: buildRedoMessageDraft({}, locale) },
    { label: 'Before advice', text: buildBeforeAdviceDraft({}, locale) },
    { label: 'After yes', text: buildAfterYesDraft({}, locale) },
    { label: 'Both true', text: buildBothTrueDraft({}, locale) },
  ]
}

export const STARTERS: StarterDraft[] = [
  {
    label: 'Appreciate',
    text: [
      'I noticed something I appreciated about you today.',
      '',
      'One specific thing was: ____.',
      '',
      'I care about naming what is working between us, not only what needs fixing.',
      '',
      'Would you tell me one small thing that helped you feel appreciated too, or should we come back to it later?',
    ].join('\n'),
  },
  {
    label: 'Check in',
    text: [
      'I want to check in today without making it heavy.',
      '',
      'I care about understanding how we are doing before anything gets too far away from us.',
      '',
      'How are you feeling about us right now?',
      '',
      'If now is not a good time, could we choose a smaller moment later?',
    ].join('\n'),
  },
  {
    label: 'Repair',
    text: [
      'I want to repair something from today instead of letting it sit between us.',
      '',
      'I care about making this feel safer, not winning a point.',
      '',
      'One part I can own is: ____.',
      '',
      'Could we talk for 10 minutes today?',
      '',
      'If now is not a good time, could we choose a smaller moment later?',
    ].join('\n'),
  },
  {
    label: 'Need',
    text: [
      'One thing I need this week is ____.',
      '',
      'I care about asking clearly instead of turning it into distance.',
      '',
      'It would help me feel closer because ____.',
      '',
      'Would you be open to a small version of that, or should we choose another time to talk about it?',
    ].join('\n'),
  },
  {
    label: 'Own my part',
    text: [
      'I have been thinking today about my part in this.',
      '',
      'I care about owning it without making you carry the repair alone.',
      '',
      'I think I could have ____.',
      '',
      'How did that land for you?',
      '',
      'If now is not a good time, could we come back to it later?',
    ].join('\n'),
  },
  {
    label: 'Reassure',
    text: buildReassuranceDraft(),
  },
  {
    label: 'Break silence',
    text: buildSilenceRepairDraft(),
  },
  {
    label: 'No reply',
    text: buildNoReplyFollowupDraft(),
  },
  {
    label: 'Respect no',
    text: buildRespectNoDraft(),
  },
  {
    label: 'Redo message',
    text: buildRedoMessageDraft(),
  },
  {
    label: 'Before advice',
    text: buildBeforeAdviceDraft(),
  },
  {
    label: 'After yes',
    text: buildAfterYesDraft(),
  },
  {
    label: 'Both true',
    text: buildBothTrueDraft(),
  },
]
