import { buildAftercareDraft } from './chat/aftercare-draft'
import { buildApologyDraft } from './chat/apology-draft'
import { buildListenFirstDraft } from './chat/listen-draft'
import { buildSofterStartDraft } from './chat/soften-draft'
import type { Locale } from '~/lib/i18n'

export const REPAIR_CHOICE_MODES = {
  listen: {
    label: 'Listen first',
    body: 'Use when your partner needs to feel understood before you explain.',
  },
  own: {
    label: 'Own my part',
    body: 'Use when defensiveness is the main thing to repair.',
  },
  start: {
    label: 'Start softer',
    body: 'Use before raising something hard so it starts as teamwork.',
  },
  aftercare: {
    label: 'End safely',
    body: 'Use after a hard talk so nobody has to guess where things stand.',
  },
} as const

export type RepairChoiceMode = keyof typeof REPAIR_CHOICE_MODES

export function buildRepairChoiceDraft(
  mode: RepairChoiceMode,
  context: string,
  partnerName: string,
  locale: Locale = 'en',
) {
  const cleanContext = context.replace(/\s+/g, ' ').trim()
  const safePartnerName = partnerName.trim() || 'you'

  if (locale === 'pt-BR') {
    const ptPartnerName = partnerName.trim() || 'voce'

    if (mode === 'listen') {
      return [
        'Quero garantir que estou te escutando hoje antes de responder. Eu me importo em te entender, nao em montar minha defesa.',
        '',
        `O que eu ouvi: ${cleanContext || `${ptPartnerName}, voce ficou magoado(a) e eu quero entender o impacto real`}.`,
        '',
        'Faz sentido que voce tenha sentido ____.',
        '',
        'Uma parte que posso assumir: talvez eu nao tenha percebido como isso foi para voce.',
        '',
        'Posso fazer uma pergunta para entender melhor: o que voce mais precisava que eu entendesse naquele momento?',
        '',
        'Se agora nao funcionar, posso so escutar primeiro e perguntar depois.',
      ].join('\n')
    }

    if (mode === 'own') {
      return [
        `Quero assumir minha parte em ${cleanContext || 'como eu apareci naquele momento'}.`,
        '',
        `Imagino que isso possa ter feito ${ptPartnerName} se sentir sozinho(a) com o problema.`,
        '',
        'Nao quero pedir que voce siga em frente antes de eu reconhecer meu impacto.',
        '',
        'Voce toparia me dizer o que ajudaria a reparar isso agora?',
      ].join('\n')
    }

    if (mode === 'aftercare') {
      return [
        'Quero fechar essa conversa com cuidado, nao deixar cada um adivinhar onde estamos.',
        '',
        `O que eu quero lembrar: ${cleanContext || 'a gente tentou falar de algo dificil e ainda somos um time'}.`,
        '',
        'Uma coisa que eu assumo: ____.',
        '',
        'Uma coisa que eu quero que voce saiba: eu me importo com voce e com a gente.',
        '',
        'Qual seria um proximo passo pequeno o bastante para manter a reparacao viva?',
      ].join('\n')
    }

    return [
      `Quero falar sobre ${cleanContext || 'algo dificil'} de um jeito mais suave.`,
      '',
      'Nao estou trazendo isso para vencer. Estou trazendo porque quero que a gente entenda o que aconteceu e cuide melhor um do outro.',
      '',
      'A minha parte e: ____.',
      '',
      'O que eu gostaria de pedir e: ____.',
      '',
      'Voce teria espaco para conversar sobre isso comigo hoje, ou seria melhor escolhermos um momento menor?',
    ].join('\n')
  }

  if (mode === 'listen') {
    return buildListenFirstDraft({
      heard: cleanContext || `${safePartnerName}, you felt hurt and I want to understand the real impact`,
      emotion: '',
      ownership: 'I may have missed what this was like for you',
      question: 'what did you most need me to understand in that moment?',
    })
  }

  if (mode === 'own') {
    return buildApologyDraft({
      action: cleanContext || 'how I showed up in that moment',
      impact: `it may have made ${safePartnerName} feel alone with the problem`,
      ownership: 'I want to own my part before asking you to move on',
      repair: 'could I listen to what would help repair this now?',
    })
  }

  if (mode === 'aftercare') {
    return buildAftercareDraft(cleanContext, locale)
  }

  return buildSofterStartDraft(cleanContext, locale)
}
