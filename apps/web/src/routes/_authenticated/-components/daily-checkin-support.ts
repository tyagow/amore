import type { Locale } from '~/lib/i18n'

export type CheckinMood = 'great' | 'good' | 'neutral' | 'low' | 'struggling'
export type SupportNeed = 'listen' | 'warmth' | 'help' | 'space' | 'later'

export const CHECKIN_GUIDANCE: Record<CheckinMood, { title: string; body: string; draft: string }> = {
  great: {
    title: 'Share the good while it is fresh',
    body: 'Positive moments become stronger when your partner hears what they did right.',
    draft: 'I am feeling good today, and I care about noticing what is working between us.\n\nOne thing I appreciated about you was ____.\n\nWould you tell me one small thing that helped you feel good too, or should we come back to it later?',
  },
  good: {
    title: 'Turn good into connection',
    body: 'Use this as a low-pressure moment to ask how your partner is doing too.',
    draft: 'I am feeling pretty good today, and I care about using that as a low-pressure moment to connect.\n\nHow are you feeling about us?\n\nIf now is not a good time, could we choose a smaller moment later?',
  },
  neutral: {
    title: 'Name the neutral without drifting',
    body: 'Neutral is a good time for a small bid for closeness before distance grows.',
    draft: 'I feel a little neutral today, and I care about staying connected before we drift.\n\nCould we have a small check-in later, or choose a smaller version if that is easier?',
  },
  low: {
    title: 'Ask for care clearly',
    body: 'Low moods are easier to support when your partner knows whether you need listening, space, or help.',
    draft: 'I am feeling low today, and I care about asking clearly instead of hoping you guess.\n\nI do not need you to fix it, but I would really appreciate ____.\n\nIf now is not a good time, could we choose a smaller support moment later?',
  },
  struggling: {
    title: 'Make support easy to give',
    body: 'When things feel heavy, a clear and gentle ask is kinder than hoping your partner guesses.',
    draft: 'I am struggling today, and I care about making support easier to give instead of making you guess.\n\nCould you please ____? It would help me feel less alone.\n\nIf now is not a good time, could we choose a smaller support moment later?',
  },
}

export const SUPPORT_NEEDS: { value: SupportNeed; label: string; answer: string; phrase: string }[] = [
  {
    value: 'listen',
    label: 'Just listen',
    answer: 'I could use listening, not fixing.',
    phrase: 'I do not need you to fix it. I would really appreciate you just listening for a bit.',
  },
  {
    value: 'warmth',
    label: 'Warmth',
    answer: 'I could use warmth and reassurance.',
    phrase: 'I would really appreciate some warmth and reassurance from you.',
  },
  {
    value: 'help',
    label: 'Practical help',
    answer: 'I could use practical help with one thing.',
    phrase: 'I would really appreciate practical help with one thing: ____.',
  },
  {
    value: 'space',
    label: 'A little space',
    answer: 'I could use a little space, but I still want us to feel okay.',
    phrase: 'I could use a little space, but I still want us to feel okay.',
  },
  {
    value: 'later',
    label: 'Check later',
    answer: 'I could use a quick check-in later today.',
    phrase: 'Could you check in with me later today?',
  },
]

const SUPPORT_NEEDS_PT_BR: Record<SupportNeed, { label: string; answer: string; phrase: string }> = {
  listen: {
    label: 'So escutar',
    answer: 'Eu preciso de escuta, nao de solucao.',
    phrase: 'Eu nao preciso que voce resolva. Eu agradeceria muito se voce so me escutasse por um pouco.',
  },
  warmth: {
    label: 'Acolhimento',
    answer: 'Eu preciso de acolhimento e seguranca.',
    phrase: 'Eu agradeceria muito um pouco de acolhimento e seguranca vindos de voce.',
  },
  help: {
    label: 'Ajuda pratica',
    answer: 'Eu preciso de ajuda pratica com uma coisa.',
    phrase: 'Eu agradeceria muito ajuda pratica com uma coisa: ____.',
  },
  space: {
    label: 'Um pouco de espaco',
    answer: 'Eu preciso de um pouco de espaco, mas ainda quero que a gente fique bem.',
    phrase: 'Eu preciso de um pouco de espaco, mas ainda quero que a gente fique bem.',
  },
  later: {
    label: 'Checar depois',
    answer: 'Eu preciso de um check-in rapido mais tarde hoje.',
    phrase: 'Voce poderia checar comigo mais tarde hoje?',
  },
}

const CHECKIN_GUIDANCE_PT_BR: Record<CheckinMood, { title: string; body: string; draft: string }> = {
  great: {
    title: 'Compartilhe o bom enquanto esta fresco',
    body: 'Momentos positivos ficam mais fortes quando sua parceria escuta o que fez bem.',
    draft: 'Estou me sentindo bem hoje, e quero perceber o que esta funcionando entre nos.\n\nUma coisa que apreciei em voce foi ____.\n\nVoce poderia me contar uma pequena coisa que tambem te ajudou a se sentir bem, ou prefere voltarmos nisso depois?',
  },
  good: {
    title: 'Transforme o bom em conexao',
    body: 'Use isso como um momento leve para perguntar como sua parceria tambem esta.',
    draft: 'Estou me sentindo relativamente bem hoje, e quero usar isso como um momento leve para a gente se conectar.\n\nComo voce esta se sentindo sobre nos?\n\nSe agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
  },
  neutral: {
    title: 'Nomeie o neutro sem se afastar',
    body: 'O neutro e uma boa hora para um pequeno pedido de proximidade antes da distancia crescer.',
    draft: 'Estou me sentindo meio neutro hoje, e quero continuar conectado antes que a gente se afaste.\n\nPodemos fazer um pequeno check-in mais tarde, ou escolher uma versao menor se for mais facil?',
  },
  low: {
    title: 'Peca cuidado com clareza',
    body: 'Humores baixos sao mais faceis de apoiar quando sua parceria sabe se voce precisa de escuta, espaco ou ajuda.',
    draft: 'Estou me sentindo pra baixo hoje, e quero pedir com clareza em vez de esperar que voce adivinhe.\n\nEu nao preciso que voce resolva, mas eu agradeceria muito ____.\n\nSe agora nao for uma boa hora, podemos escolher um momento menor de apoio mais tarde?',
  },
  struggling: {
    title: 'Facilite o apoio',
    body: 'Quando tudo parece pesado, um pedido claro e gentil e mais cuidadoso do que esperar que sua parceria adivinhe.',
    draft: 'Estou com dificuldade hoje, e quero tornar o apoio mais facil em vez de fazer voce adivinhar.\n\nVoce poderia ____? Isso me ajudaria a me sentir menos sozinho.\n\nSe agora nao for uma boa hora, podemos escolher um momento menor de apoio mais tarde?',
  },
}

const SUPPORT_GOAL_ACTIONS: Record<SupportNeed, string> = {
  listen: 'Listen for 10 minutes without fixing or defending',
  warmth: 'Offer one clear reassurance and one specific appreciation',
  help: 'Take one practical task off the other person without making them manage it',
  space: 'Give the requested space, then reconnect gently at the agreed time',
  later: 'Do the later check-in instead of letting the day drift',
}

const SUPPORT_GOAL_DESCRIPTIONS: Record<SupportNeed, string> = {
  listen: 'Set a small window to listen, reflect back what was heard, and ask if they want comfort or problem-solving before offering advice.',
  warmth: 'Make warmth visible today with one reassurance, one specific appreciation, and a gentle check that it landed.',
  help: 'Choose one practical task, take ownership of the next step, and do not make the other person manage the follow-through.',
  space: 'Respect the requested space without punishing distance, then reconnect at the agreed time with a simple care check.',
  later: 'Put the later check-in somewhere it will actually happen, then ask what would help before the day closes.',
}

const SUPPORT_GOAL_ACTIONS_PT_BR: Record<SupportNeed, string> = {
  listen: 'Escutar por 10 minutos sem resolver nem se defender',
  warmth: 'Oferecer uma seguranca clara e uma apreciacao especifica',
  help: 'Assumir uma tarefa pratica sem fazer a outra pessoa gerenciar',
  space: 'Respeitar o espaco pedido e reconectar com cuidado no horario combinado',
  later: 'Fazer o check-in mais tarde em vez de deixar o dia passar',
}

const SUPPORT_GOAL_DESCRIPTIONS_PT_BR: Record<SupportNeed, string> = {
  listen: 'Reserve uma pequena janela para escutar, refletir o que ouviu e perguntar se a pessoa quer conforto ou solucao antes de oferecer conselho.',
  warmth: 'Torne o acolhimento visivel hoje com uma seguranca, uma apreciacao especifica e uma checagem gentil para saber se chegou bem.',
  help: 'Escolha uma tarefa pratica, assuma o proximo passo e nao faca a outra pessoa gerenciar o acompanhamento.',
  space: 'Respeite o espaco pedido sem punir a distancia, depois reconecte no horario combinado com uma checagem simples de cuidado.',
  later: 'Coloque o check-in de mais tarde em algum lugar onde ele realmente va acontecer, depois pergunte o que ajudaria antes do dia terminar.',
}

export function getCheckinGuidance(locale: Locale) {
  return locale === 'pt-BR' ? CHECKIN_GUIDANCE_PT_BR : CHECKIN_GUIDANCE
}

export function getSupportNeedText(supportNeed: SupportNeed | null | undefined, locale: Locale) {
  if (!supportNeed) return null
  if (locale === 'pt-BR') return SUPPORT_NEEDS_PT_BR[supportNeed] ?? null
  return SUPPORT_NEEDS.find((need) => need.value === supportNeed) ?? null
}

function supportNeedText(supportNeed: SupportNeed | null | undefined, locale: Locale) {
  return getSupportNeedText(supportNeed, locale)
}

export function buildCheckinDraft(mood: CheckinMood, supportNeed: SupportNeed | null, locale: Locale = 'en') {
  const support = getSupportNeedText(supportNeed, locale)
  if (!support) return getCheckinGuidance(locale)[mood].draft

  if (locale === 'pt-BR') {
    return `${CHECKIN_GUIDANCE_PT_BR[mood].draft}\n\nO que ajudaria: ${support.phrase}`
  }

  return `${CHECKIN_GUIDANCE[mood].draft}\n\nWhat would help: ${support.phrase}`
}

export function buildSupportGoalTitle(supportNeed: SupportNeed, partnerName?: string, locale: Locale = 'en') {
  const actions = locale === 'pt-BR' ? SUPPORT_GOAL_ACTIONS_PT_BR : SUPPORT_GOAL_ACTIONS
  const action = actions[supportNeed]
  const name = partnerName?.trim()

  if (!action) {
    if (locale === 'pt-BR') {
      return name
        ? `Apoiar ${name} de uma forma concreta hoje`
        : 'Cumprir o pedido de apoio de hoje'
    }
    return name ? `Support ${name} in one concrete way today` : "Follow through on today's support ask"
  }

  if (locale === 'pt-BR') {
    return name ? `Apoiar ${name} hoje: ${action}` : `Cumprir hoje: ${action}`
  }

  return name
    ? `Support ${name} today: ${action}`
    : `Follow through today: ${action}`
}

export function buildSupportGoalDraft(supportNeed: SupportNeed, partnerName?: string, locale: Locale = 'en') {
  const title = buildSupportGoalTitle(supportNeed, partnerName, locale)
  const descriptions = locale === 'pt-BR' ? SUPPORT_GOAL_DESCRIPTIONS_PT_BR : SUPPORT_GOAL_DESCRIPTIONS
  const description = descriptions[supportNeed] ?? (
    locale === 'pt-BR'
      ? 'Cumprir o pedido de apoio de uma forma pequena e visivel hoje.'
      : 'Follow through on the support ask in one small, visible way today.'
  )

  return {
    title,
    description,
    dueDate: todayDateString(),
  }
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

export function inferSupportNeedFromAnswer(answer: string | null | undefined): SupportNeed | null {
  const lower = answer?.toLowerCase() ?? ''
  if (!lower) return null

  const matched = SUPPORT_NEEDS.find((need) => {
    return lower.includes(need.answer.toLowerCase()) || lower.includes(need.phrase.toLowerCase())
  })

  return matched?.value ?? null
}

export function buildSupportFollowupDraft(supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  if (!support) {
    if (locale === 'pt-BR') return 'Eu fiz check-in hoje e quero ser claro sobre o que me ajudaria a me sentir apoiado.'
    return 'I checked in today and I want to be clear about what would help me feel supported.'
  }

  if (locale === 'pt-BR') {
    return `Eu fiz check-in hoje, e quero tornar o apoio mais facil para nos dois.\n\n${support.phrase}\n\nPodemos tentar isso hoje, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
  }

  return `I checked in today, and I care about making support easy for both of us.\n\n${support.phrase}\n\nCould we try that today, or choose a smaller version later if now is not a good time?`
}

export function buildSupportThanksDraft(partnerName: string, supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `Quando pedi ${support.label.toLowerCase()}, o que ajudou foi: ____.`
      : 'Quando pedi apoio, o que ajudou foi: ____.'
    return [
      `Oi ${name}, quero reconhecer o cuidado que voce ofereceu hoje.`,
      '',
      supportLine,
      '',
      'Isso me fez sentir: ____.',
      '',
      'Obrigado por nao me deixar carregar isso sozinho.',
      '',
      'Tudo bem se eu nomear esse tipo de apoio de novo na proxima vez, ou seria melhor conversarmos depois sobre o que funciona para nos dois?',
    ].join('\n')
  }
  const supportLine = support
    ? `When I asked for ${support.label.toLowerCase()}, what helped was: ____.`
    : 'When I asked for support, what helped was: ____.'

  return [
    `Hey ${name}, I want to notice the care you gave today.`,
    '',
    supportLine,
    '',
    'It made me feel: ____.',
    '',
    'Thank you for not making me carry that alone.',
    '',
    'Would it be okay if I name this kind of support again next time, or should we talk later about what works for both of us?',
  ].join('\n')
}

export function buildSupportLandingCheckDraft(partnerName: string, supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `Mais cedo hoje eu nomeei isso como o que ajudaria: ${support.answer}`
      : 'Mais cedo eu tentei nomear o que me ajudaria.'
    return [
      `Oi ${name}, posso checar se meu pedido de apoio chegou com clareza?`,
      '',
      supportLine,
      '',
      'O que me ajudou foi: ____.',
      '',
      'O que ainda ficou dificil ou pouco claro foi: ____.',
      '',
      'Eu quero que o apoio fique mais facil para nos dois.',
      '',
      'Podemos ajustar uma pequena coisa para a proxima vez, ou conversar depois se agora nao for uma boa hora?',
    ].join('\n')
  }
  const supportLine = support
    ? `Earlier today I named this as what would help: ${support.answer}`
    : 'Earlier I tried to name what would help me.'

  return [
    `Hey ${name}, can I check whether my support ask landed clearly?`,
    '',
    supportLine,
    '',
    'What helped me was: ____.',
    '',
    'What still felt hard or unclear was: ____.',
    '',
    'I care about support feeling easier for both of us.',
    '',
    'Could we adjust one small thing for the next time, or talk later if now is not a good time?',
  ].join('\n')
}

export function buildSupportAvoidanceDraft(partnerName: string, supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `O que ainda me ajudaria e: ${support.phrase}`
      : 'O que ainda me ajudaria e um tipo pequeno e claro de apoio.'
    return [
      `Oi ${name}, quero tornar meu pedido de apoio mais facil de acertar, nao mais estressante.`,
      '',
      supportLine,
      '',
      'Quero que o apoio pareca gentil, nao mais uma tarefa.',
      '',
      'Uma coisa que provavelmente nao ajudaria hoje e: ____.',
      '',
      'Se voce perceber vontade de fazer isso, podemos tentar isto no lugar: ____?',
      '',
      'Se agora nao for uma boa hora, podemos escolher uma versao menor mais tarde?',
    ].join('\n')
  }
  const supportLine = support
    ? `What would help me is still: ${support.phrase}`
    : 'What would help me is still one small, clear kind of support.'

  return [
    `Hey ${name}, I want to make my support ask easier to get right, not more stressful.`,
    '',
    supportLine,
    '',
    'I care about making support feel gentle, not like another task.',
    '',
    'One thing that probably would not help today is: ____.',
    '',
    'If you notice yourself wanting to do that, could we try this instead: ____?',
    '',
    'If now is not a good time, could we choose a smaller version later?',
  ].join('\n')
}

export function buildPartnerCheckinInviteDraft(partnerName: string, supportNeed: SupportNeed | null, locale: Locale = 'en') {
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  const support = supportNeedText(supportNeed, locale)
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `percebi que hoje eu preciso disso: ${support.answer}`
      : 'fiz meu check-in hoje e percebi como estou emocionalmente.'
    return [
      `Oi ${name}, ${supportLine}`,
      '',
      'Nao quero te pressionar a fazer o mesmo, mas tambem nao quero adivinhar como foi o seu dia.',
      '',
      'Eu me importo em saber como voce realmente esta hoje.',
      '',
      'Como voce esta se sentindo hoje, e o que ajudaria voce a se sentir cuidado?',
      '',
      'Se agora nao for uma boa hora, podemos voltar nisso mais tarde?',
    ].join('\n')
  }
  const supportLine = support
    ? `I noticed I could use this today: ${support.answer}`
    : 'I checked in today and noticed where I am emotionally.'

  return [
    `Hey ${name}, ${supportLine}`,
    '',
    'I do not want to pressure you to do the same, but I also do not want to guess how your day feels.',
    '',
    'I care about knowing where you actually are today.',
    '',
    'How are you feeling today, and what would help you feel cared for?',
    '',
    'If now is not a good time, could we come back to it later?',
  ].join('\n')
}

export function buildReciprocalSupportDraft(partnerName: string, supportNeed: SupportNeed | null, locale: Locale = 'en') {
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  const support = supportNeedText(supportNeed, locale)
  const answer = support?.answer.replace(/[.!?]+$/, '')
  if (locale === 'pt-BR') {
    const myAsk = support
      ? `Eu nomeei meu proprio pedido: ${answer}`
      : 'Eu nomeei o que me ajudaria hoje'
    return [
      `Oi ${name}, ${myAsk}, e nao quero que hoje vire so sobre mim.`,
      '',
      'O que ajudaria voce a se sentir cuidado hoje?',
      '',
      'Voce pode pedir escuta, acolhimento, ajuda pratica, espaco ou um check-in mais tarde. Quero te encontrar nisso em vez de adivinhar.',
    ].join('\n')
  }
  const myAsk = support
    ? `I named my own ask: ${answer}`
    : 'I named what would help me today'

  return [
    `Hey ${name}, ${myAsk}, and I do not want today to become only about me.`,
    '',
    'What would help you feel cared for today?',
    '',
    'You can ask for listening, warmth, practical help, space, or a later check-in. I care about meeting you there instead of guessing.',
  ].join('\n')
}

export function buildPartnerSupportResponseDraft(partnerName: string, supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'voce' : 'you')

  if (!support) {
    if (locale === 'pt-BR') return `Oi ${name}, vi seu check-in e quero te apoiar do jeito que realmente ajuda hoje.`
    return `Hey ${name}, I saw your check-in and I want to support you in the way that actually helps today.`
  }

  if (locale === 'pt-BR') {
    return [
      `Oi ${name}, vi seu check-in e quero te apoiar do jeito que voce pediu hoje.`,
      '',
      `O que eu ouvi que ajudaria: ${support.answer}`,
      'Eu posso fazer isso. Eu vou ____.',
      '',
      'Se eu errar, por favor me diga com clareza. Quero responder com cuidado, nao fazer voce carregar isso sozinho.',
      '',
      'Isso pareceria apoio para voce hoje?',
      '',
      'Se agora nao for uma boa hora para explicar mais, podemos manter simples e voltar nisso depois.',
    ].join('\n')
  }

  return [
    `Hey ${name}, I saw your check-in and I want to support you in the way you asked today.`,
    '',
    `What I heard would help: ${support.answer}`,
    'I can do that. I will ____.',
    '',
    'If I miss it, please tell me plainly. I want to respond with care, not make you carry it alone.',
    '',
    'Would this feel supportive today?',
    '',
    'If now is not a good time to explain more, we can keep this simple and come back later.',
  ].join('\n')
}

export function buildPartnerSupportAvoidanceDraft(partnerName: string, supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'voce' : 'you')
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `Eu ouvi que o que ajudaria e: ${support.answer}`
      : 'Eu ouvi que voce pediu apoio hoje.'
    return [
      `Oi ${name}, quero te apoiar sem acabar deixando isso mais pesado.`,
      '',
      `${supportLine} Hoje quero acertar a parte do apoio.`,
      '',
      'Tem algo que eu deveria evitar fazer ou dizer enquanto tento te apoiar?',
      '',
      'Se sim, posso substituir por: ____.',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }
  const supportLine = support
    ? `I heard that what would help is: ${support.answer}`
    : 'I heard that you asked for support today.'

  return [
    `Hey ${name}, I want to support you without accidentally making this heavier.`,
    '',
    `${supportLine} Today I want to get the support part right.`,
    '',
    'Is there anything I should avoid doing or saying while I try to support you?',
    '',
    'If yes, I can replace it with: ____.',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildPartnerCheckinThanksDraft(partnerName: string, supportNeed: SupportNeed | null, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `Eu ouvi que hoje voce precisa disso: ${support.answer}`
      : 'Nao quero que seu check-in passe sem eu responder.'
    return [
      `Oi ${name}, obrigado por fazer check-in hoje.`,
      '',
      supportLine,
      '',
      'Uma forma de eu mostrar cuidado, em vez de so dizer que me importo, e: ____.',
      '',
      'Eu entendi o que ajudaria voce hoje?',
      '',
      'Se agora nao for uma boa hora para responder, podemos voltar nisso depois.',
    ].join('\n')
  }
  const supportLine = support
    ? `I heard that today you could use: ${support.answer}`
    : 'I do not want your check-in to pass by without me responding.'

  return [
    `Hey ${name}, thank you for checking in today.`,
    '',
    supportLine,
    '',
    'One way I can show care instead of only saying I care is: ____.',
    '',
    'Did I understand what would help you today?',
    '',
    'If now is not a good time to answer, we can come back to it later.',
  ].join('\n')
}

export function buildSupportCoachPrompt(supportNeed: SupportNeed, locale: Locale = 'en') {
  const support = supportNeedText(supportNeed, locale)

  if (locale === 'pt-BR') {
    return `Me ajude a pedir ${support?.label.toLowerCase() ?? 'apoio'} de um jeito claro, gentil e sem parecer cobranca.`
  }

  return `Help me ask for ${support?.label.toLowerCase() ?? 'support'} in a way that feels clear, kind, and not demanding.`
}

export function buildTonightPlanDraft(mood: CheckinMood | string | null | undefined, supportNeed: SupportNeed | null, locale: Locale = 'en') {
  const moodText = typeof mood === 'string' && mood.trim() ? mood.trim() : (locale === 'pt-BR' ? 'como estou emocionalmente' : 'where I am emotionally')
  const support = supportNeedText(supportNeed, locale)
  if (locale === 'pt-BR') {
    const supportLine = support
      ? `\n\nO que me ajudaria hoje a noite: ${support.phrase}`
      : '\n\nO que me ajudaria hoje a noite: uma coisa pequena que faca a gente se sentir calmo e conectado.'
    return `Podemos fazer um plano pequeno para hoje a noite com base no meu check-in?\n\nQuero que hoje a noite seja facil para nos dois, nao pesado.${supportLine}\n\nMeu humor hoje e: ${moodText}.\n\nUm pequeno plano que eu tambem posso oferecer: ____.\n\nPodemos escolher uma coisa simples e manter leve, ou escolher uma versao menor mais tarde se agora nao for uma boa hora?`
  }
  const supportLine = support
    ? `\n\nWhat would help me tonight: ${support.phrase}`
    : '\n\nWhat would help me tonight: one small thing that makes us feel calm and connected.'

  return `Can we make a tiny plan for tonight based on my check-in?\n\nI care about making tonight feel easy for both of us, not heavy.${supportLine}\n\nMy mood today is: ${moodText}.\n\nOne small plan I can offer too: ____.\n\nCould we choose one simple thing and keep it easy, or pick a smaller version later if now is not a good time?`
}

export function buildCheckinRhythmDraft({
  partnerName,
  togetherDays,
  mineMood,
  partnerMood,
  locale = 'en',
}: {
  partnerName: string
  togetherDays: number
  mineMood: string | null
  partnerMood: string | null
  locale?: Locale
}) {
  const name = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')
  if (locale === 'pt-BR') {
    const mineLine = mineMood ? `Meu ultimo humor no check-in foi ${mineMood}.` : 'Eu nao tenho feito check-in com consistencia.'
    const partnerLine = partnerMood ? `Seu ultimo humor no check-in foi ${partnerMood}.` : 'Nao quero adivinhar como voce tem se sentido.'
    return [
      `Oi ${name}, percebi nosso ritmo de check-ins nesta semana e quero usar isso como um sinal gentil, nao como placar.`,
      '',
      `Nos dois fizemos check-in em ${togetherDays}/7 dias.`,
      mineLine,
      partnerLine,
      '',
      'Quero que os check-ins sejam uteis, nao uma pressao.',
      '',
      'Podemos tirar dois minutos hoje para nomear o que tornou o check-in facil ou dificil, e escolher a menor versao que a gente realmente consegue manter?',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }
  const mineLine = mineMood ? `My last check-in mood was ${mineMood}.` : 'I have not been checking in consistently.'
  const partnerLine = partnerMood ? `Your last check-in mood was ${partnerMood}.` : 'I do not want to guess how you have been feeling.'

  return [
    `Hey ${name}, I noticed our check-in rhythm this week and I want to use it as a gentle signal, not a scorecard.`,
    '',
    `We both checked in on ${togetherDays}/7 days.`,
    mineLine,
    partnerLine,
    '',
    'I care about making check-ins useful, not turning them into pressure.',
    '',
    'Could we take two minutes today to name what made checking in easy or hard, then choose the smallest version we can actually keep?',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildCheckinRhythmGoalDraft({
  partnerName,
  togetherDays,
  locale = 'en',
}: {
  partnerName: string
  togetherDays: number
  locale?: Locale
}) {
  const name = partnerName || (locale === 'pt-BR' ? 'minha parceria' : 'my partner')

  if (locale === 'pt-BR') {
    return {
      title: `Facilitar check-ins com ${name}`,
      description: `Nos dois fizemos check-in em ${togetherDays}/7 dias. Escolham a menor versao diaria que pareca gentil em vez de placar, depois testem por uma semana.`,
      dueDate: oneWeekFromToday(),
    }
  }

  return {
    title: `Make check-ins easier with ${name}`,
    description: `We both checked in on ${togetherDays}/7 days. Pick the smallest daily version that feels kind instead of like a scorecard, then try it for one week.`,
    dueDate: oneWeekFromToday(),
  }
}

function oneWeekFromToday() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}
