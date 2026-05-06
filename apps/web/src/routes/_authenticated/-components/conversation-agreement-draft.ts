import type { Locale } from '~/lib/i18n'

export type ConversationAgreementNotes = {
  pausePhrase?: string
  phoneBoundary?: string
  repairWindow?: string
  topicBoundary?: string
}

function clean(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export function buildConversationAgreementDraft(
  partnerName: string,
  notes: ConversationAgreementNotes,
  locale: Locale = 'en',
) {
  const pausePhrase = clean(notes.pausePhrase)
  const phoneBoundary = clean(notes.phoneBoundary)
  const repairWindow = clean(notes.repairWindow)
  const topicBoundary = clean(notes.topicBoundary)

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, quero que a gente tenha um acordo calmo antes da proxima conversa dificil, nao so improvisar quando ja estivermos ativados.`,
      '',
      pausePhrase ? `Nossa frase de pausa: "${pausePhrase}"` : 'Nossa frase de pausa: ____.',
      phoneBoundary ? `Nosso limite com celular: ${phoneBoundary}` : 'Nosso limite com celular: ____.',
      repairWindow ? `Se a gente se desencontrar, reparamos em ate: ${repairWindow}` : 'Se a gente se desencontrar, reparamos em ate: ____.',
      topicBoundary ? `Uma coisa que nao vamos misturar na conversa: ${topicBoundary}` : 'Uma coisa que nao vamos misturar na conversa: ____.',
      '',
      'Podemos escolher isso enquanto as coisas estao calmas, e tentar uma vez nesta semana?',
      '',
      'Se agora nao for uma boa hora, podemos escolher uma versao menor mais tarde?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName}, I want us to have one calm agreement before the next hard conversation, not only improvise when we are already activated.`,
    '',
    pausePhrase
      ? `Our pause phrase: "${pausePhrase}"`
      : 'Our pause phrase: ____.',
    phoneBoundary
      ? `Our phone boundary: ${phoneBoundary}`
      : 'Our phone boundary: ____.',
    repairWindow
      ? `If we miss each other, we repair within: ${repairWindow}`
      : 'If we miss each other, we repair within: ____.',
    topicBoundary
      ? `One thing we will not mix into the conversation: ${topicBoundary}`
      : 'One thing we will not mix into the conversation: ____.',
    '',
    'Can we choose these while things are calm, then try them once this week?',
    '',
    'If now is not a good time, could we choose a smaller version later?',
  ].join('\n')
}

export function buildConversationAgreementGoalTitle(notes: ConversationAgreementNotes, locale: Locale = 'en') {
  const pausePhrase = clean(notes.pausePhrase)
  const repairWindow = clean(notes.repairWindow)

  if (pausePhrase && repairWindow) {
    if (locale === 'pt-BR') return `Usar "${pausePhrase}" e reparar em ate ${repairWindow}`
    return `Use "${pausePhrase}" and repair within ${repairWindow}`
  }

  if (pausePhrase) {
    if (locale === 'pt-BR') return `Usar "${pausePhrase}" como nossa frase de pausa`
    return `Use "${pausePhrase}" as our pause phrase`
  }

  if (repairWindow) {
    if (locale === 'pt-BR') return `Reparar em ate ${repairWindow} depois de conversas dificeis`
    return `Repair within ${repairWindow} after hard conversations`
  }

  return ''
}

export function buildConversationAgreementGoalDraft(notes: ConversationAgreementNotes, locale: Locale = 'en') {
  const title = buildConversationAgreementGoalTitle(notes, locale)
  if (!title) return null

  const pausePhrase = clean(notes.pausePhrase)
  const phoneBoundary = clean(notes.phoneBoundary)
  const repairWindow = clean(notes.repairWindow)
  const topicBoundary = clean(notes.topicBoundary)
  if (locale === 'pt-BR') {
    const pieces = [
      pausePhrase ? `Usar "${pausePhrase}" como frase de pausa antes da conversa ficar insegura.` : '',
      phoneBoundary ? `Manter este limite com celular: ${phoneBoundary}.` : '',
      repairWindow ? `Se voces se desencontrarem, reparar em ate ${repairWindow}.` : '',
      topicBoundary ? `Nao misturar: ${topicBoundary}.` : '',
    ].filter(Boolean)
    return {
      title,
      description: `${pieces.join(' ')} Testem o acordo uma vez nesta semana enquanto as coisas estiverem calmas o bastante para praticar.`,
    }
  }

  const pieces = [
    pausePhrase ? `Use "${pausePhrase}" as the pause phrase before the conversation gets unsafe.` : '',
    phoneBoundary ? `Keep this phone boundary: ${phoneBoundary}.` : '',
    repairWindow ? `If you miss each other, repair within ${repairWindow}.` : '',
    topicBoundary ? `Do not mix in: ${topicBoundary}.` : '',
  ].filter(Boolean)

  return {
    title,
    description: `${pieces.join(' ')} Try the agreement once this week while things are calm enough to practice it.`,
  }
}

export function buildAgreementSlipRepairDraft(
  partnerName: string,
  notes: ConversationAgreementNotes,
  locale: Locale = 'en',
) {
  const pausePhrase = clean(notes.pausePhrase)
  const repairWindow = clean(notes.repairWindow)
  const topicBoundary = clean(notes.topicBoundary)

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, acho que a gente perdeu uma parte do acordo para conversas dificeis, e quero reparar isso sem transformar em outra discussao.`,
      '',
      'Quero que o acordo ajude a gente, nao que vire uma arma.',
      '',
      pausePhrase
        ? `O acordo ao qual quero voltar: usar "${pausePhrase}" quando precisamos desacelerar.`
        : 'O acordo ao qual quero voltar: ____.',
      repairWindow
        ? `A janela de reparo que nomeamos foi: ${repairWindow}.`
        : 'A janela de reparo que nomeamos foi: ____.',
      topicBoundary
        ? `Uma coisa que nao quero misturar de volta agora: ${topicBoundary}.`
        : 'Uma coisa que nao quero misturar de volta agora: ____.',
      '',
      'A parte que posso assumir e: ____.',
      '',
      'Podemos reiniciar em torno do acordo hoje, ou escolher uma versao menor se isso parecer demais?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName}, I think we missed part of the hard-talk agreement, and I want to repair that without turning it into another argument.`,
    '',
    'I care about making the agreement help us, not using it as a weapon.',
    '',
    pausePhrase
      ? `The agreement I want to come back to: use "${pausePhrase}" when we need to slow down.`
      : 'The agreement I want to come back to: ____.',
    repairWindow
      ? `The repair window we named was: ${repairWindow}.`
      : 'The repair window we named was: ____.',
    topicBoundary
      ? `One thing I do not want to mix back in right now: ${topicBoundary}.`
      : 'One thing I do not want to mix back in right now: ____.',
    '',
    'The part I can own is: ____.',
    '',
    'Could we reset around the agreement today, or pick a smaller version if that feels like too much?',
  ].join('\n')
}
