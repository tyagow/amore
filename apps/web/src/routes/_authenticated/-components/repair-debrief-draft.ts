import type { Locale } from '~/lib/i18n'

type RepairDebriefNotes = {
  understood?: string
  ownership?: string
  reassurance?: string
  nextStep?: string
}

function clean(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export function buildRepairDebriefDraft(partnerName: string, notes: RepairDebriefNotes, locale: Locale = 'en') {
  const understood = clean(notes.understood)
  const ownership = clean(notes.ownership)
  const reassurance = clean(notes.reassurance)
  const nextStep = clean(notes.nextStep)

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, nao quero que nossa conversa de reparo desapareca depois que a gente encerra.`,
      '',
      'Quero tornar o reparo visivel hoje, nao fazer voce adivinhar se importou.',
      '',
      understood ? `O que ouvi de voce: ${understood}` : 'O que ouvi de voce: ____.',
      ownership ? `O que estou assumindo: ${ownership}` : 'O que estou assumindo: ____.',
      reassurance ? `O que quero te assegurar: ${reassurance}` : 'O que quero te assegurar: ____.',
      nextStep ? `A proxima pequena coisa que vou fazer: ${nextStep}` : 'A proxima pequena coisa que vou fazer: ____.',
      '',
      'Capturei a parte mais importante, ou tem uma coisa menor que devo entender melhor depois?',
    ].join('\n')
  }

  const lines = [
    `Hey ${partnerName}, I do not want our repair conversation to disappear after we close it.`,
    '',
    'I care about making the repair visible today, not making you guess whether it mattered.',
    '',
    understood
      ? `What I heard from you: ${understood}`
      : 'What I heard from you: ____.',
    ownership
      ? `What I am taking responsibility for: ${ownership}`
      : 'What I am taking responsibility for: ____.',
    reassurance
      ? `What I want to reassure you about: ${reassurance}`
      : 'What I want to reassure you about: ____.',
    nextStep
      ? `The next small thing I will do: ${nextStep}`
      : 'The next small thing I will do: ____.',
    '',
    'Did I capture the most important part, or is there one smaller thing I should understand better later?',
  ]

  return lines.join('\n')
}

export function buildRepairDebriefGoalTitle(notes: RepairDebriefNotes, locale: Locale = 'en') {
  const nextStep = clean(notes.nextStep)
  if (!nextStep) return ''

  const withoutPeriod = nextStep.replace(/[.!?]+$/, '')
  return locale === 'pt-BR' ? `Dar seguimento: ${withoutPeriod}` : `Follow through: ${withoutPeriod}`
}

export function buildRepairDebriefGoalDraft(notes: RepairDebriefNotes, locale: Locale = 'en') {
  const title = buildRepairDebriefGoalTitle(notes, locale)
  if (!title) return null

  const understood = clean(notes.understood)
  const ownership = clean(notes.ownership)
  const reassurance = clean(notes.reassurance)
  const nextStep = clean(notes.nextStep).replace(/[.!?]+$/, '')
  if (locale === 'pt-BR') {
    const context = [
      understood ? `Lembrar o que a pessoa precisava que fosse entendido: ${understood}.` : '',
      ownership ? `Manter a responsabilidade clara: ${ownership}.` : '',
      reassurance ? `Dar seguranca: ${reassurance}.` : '',
    ].filter(Boolean).join(' ')
    return {
      title,
      description: `${context} Fazer o seguimento: ${nextStep}. Manter pequeno, visivel e conectado a conversa de reparo.`.trim(),
    }
  }

  const context = [
    understood ? `Remember what they needed understood: ${understood}.` : '',
    ownership ? `Keep ownership clear: ${ownership}.` : '',
    reassurance ? `Reassure them: ${reassurance}.` : '',
  ].filter(Boolean).join(' ')

  return {
    title,
    description: `${context} Do the follow-through: ${nextStep}. Keep it small, visible, and connected to the repair conversation.`.trim(),
  }
}

export function buildRepairLandingCheckDraft(partnerName: string, notes: RepairDebriefNotes, locale: Locale = 'en') {
  const understood = clean(notes.understood)
  const nextStep = clean(notes.nextStep)

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, quero checar se meu reparo realmente chegou, nao so presumir que chegou.`,
      '',
      'Quero que o reparo pareca real para voce, nao so encerrado para mim.',
      '',
      understood ? `O que eu estava tentando mostrar que entendi: ${understood}` : 'O que eu estava tentando mostrar que entendi hoje: ____.',
      nextStep ? `O seguimento que nomeei foi: ${nextStep}` : 'O seguimento que nomeei hoje foi: ____.',
      '',
      'Isso ajudou voce a se sentir mais entendido, ou ainda perdi uma parte?',
      '',
      'Se agora nao for uma boa hora, podemos escolher um check-in menor ou voltar nisso depois?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName}, I want to check whether my repair actually landed, not just assume it did.`,
    '',
    'I care about making the repair feel real to you, not just finished for me.',
    '',
    understood
      ? `What I was trying to show I understood: ${understood}`
      : 'What I was trying to show I understood today: ____.',
    nextStep
      ? `The follow-through I named was: ${nextStep}`
      : 'The follow-through I named today was: ____.',
    '',
    'Did that help you feel more understood, or is there one part I still missed?',
    '',
    'If now is not a good time, could we choose a smaller check-in or come back to it later?',
  ].join('\n')
}
