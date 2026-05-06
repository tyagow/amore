import type { Locale } from '~/lib/i18n'

export function buildCareInstructionsDraft(partnerName: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, quero entender melhor como cuidar de voce quando as coisas estao dificeis, em vez de adivinhar no momento.`,
      '',
      'Quero tornar momentos dificeis mais seguros para nos dois.',
      '',
      'Podemos responder isso enquanto estamos calmos?',
      '1. Quando voce esta chateado, o que ajuda primeiro: proximidade, espaco, ajuda pratica, seguranca ou escuta?',
      '2. Que frase pode significar "preciso pausar, mas vou voltar"?',
      '3. Depois que eu te erro ou te machuco, que tipo de reparo realmente ajuda?',
      '4. O que devo evitar fazer mesmo quando estou tentando ajudar?',
      '',
      'Eu tambem vou responder, porque quero que isso seja mutuo.',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }
  return [
    `Hey ${partnerName}, I want to understand how to care for you better when things are hard, instead of guessing in the moment.`,
    '',
    'I care about making hard moments safer for both of us.',
    '',
    'Could we each answer these while we are calm?',
    '1. When you are upset, what helps first: closeness, space, practical help, reassurance, or listening?',
    '2. What phrase can mean "I need a pause, but I am coming back"?',
    '3. After I miss you or hurt you, what kind of repair actually helps?',
    '4. What should I avoid doing even if I am trying to help?',
    '',
    'I will answer these too, because I want this to feel mutual.',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildCareAvoidanceDraft(partnerName: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName || 'amor'}, quero melhorar em nao tornar momentos dificeis ainda mais dificeis.`,
      '',
      'Quero te apoiar do jeito que realmente ajuda.',
      '',
      'Quando voce esta chateado ou sobrecarregado, o que devo evitar fazer mesmo quando estou tentando ajudar?',
      '',
      'Algumas possibilidades, e voce pode corrigir todas:',
      '1. Dar conselho rapido demais.',
      '2. Fazer perguntas demais.',
      '3. Ficar quieto sem dizer que vou voltar.',
      '4. Me defender antes de entender voce.',
      '',
      'Qual e uma coisa que voce gostaria que eu parasse de fazer primeiro?',
      '',
      'Se agora nao for uma boa hora, podemos voltar nisso depois?',
    ].join('\n')
  }
  return [
    `Hey ${partnerName || 'love'}, I want to get better at not making hard moments harder.`,
    '',
    'I care about supporting you in the way that actually helps.',
    '',
    'When you are upset or overwhelmed, what should I avoid doing even if I am trying to help?',
    '',
    'A few possibilities, and you can correct all of these:',
    '1. Giving advice too fast.',
    '2. Asking too many questions.',
    '3. Getting quiet without saying I am coming back.',
    '4. Defending myself before I understand you.',
    '',
    'What is one thing you wish I would stop doing first?',
    '',
    'If now is not a good time, could we come back to it later?',
  ].join('\n')
}

export function buildOverwhelmSignalsDraft(partnerName: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName || 'amor'}, quero perceber mais cedo quando as coisas estao ficando demais para voce, antes de ja estarmos em um momento dificil.`,
      '',
      'Quero notar a sobrecarga antes que ela vire distancia ou pressao.',
      '',
      'Podemos nomear alguns sinais iniciais?',
      '1. Quando voce esta sobrecarregado, o que costuma acontecer com sua voz, corpo, mensagens ou energia?',
      '2. Qual e uma forma gentil de eu checar sem fazer voce se sentir observado ou gerenciado?',
      '3. O que devo fazer primeiro: oferecer proximidade, dar espaco, reduzir decisoes, ajudar de forma pratica ou simplesmente escutar?',
      '',
      'Um sinal inicial que percebo em mim e: ____.',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }
  return [
    `Hey ${partnerName || 'love'}, I want to notice earlier when things are getting too much for you, before we are already in a hard moment.`,
    '',
    'I care about catching overwhelm before it turns into distance or pressure.',
    '',
    'Could we name a few early signs?',
    '1. When you are overwhelmed, what do you usually do with your voice, body, texting, or energy?',
    '2. What is a gentle way I can check in without making you feel watched or managed?',
    '3. What should I do first: offer closeness, give space, reduce decisions, help practically, or simply listen?',
    '',
    'One early sign I notice in myself is: ____.',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildShareMyCareInstructionsDraft({
  partnerName,
  loveLanguagePrimary,
  loveLanguageSecondary,
  communicationType,
  communicationDescription,
  interests,
}: {
  partnerName: string
  loveLanguagePrimary?: string | null
  loveLanguageSecondary?: string | null
  communicationType?: string | null
  communicationDescription?: string | null
  interests?: string[]
}, locale: Locale = 'en') {
  const loveLanguages = [loveLanguagePrimary, loveLanguageSecondary]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' and ')
  const interestList = interests?.map((value) => value.trim()).filter(Boolean).join(', ')
  const communicationParts = [communicationType, communicationDescription]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(': ')

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName || 'amor'}, quero facilitar que voce cuide de mim tambem, entao aqui esta meu primeiro rascunho do que ajuda.`,
      '',
      'Quero que isso seja mutuo e preciso, nao que voce tenha que adivinhar.',
      '',
      `1. O que geralmente me ajuda a me sentir amado: ${loveLanguages || '____.'}`,
      `2. Como tendo a me comunicar ou processar: ${communicationParts || '____.'}`,
      `3. Pequenas coisas que me ajudam a reconectar: ${interestList || '____.'}`,
      '4. Quando estou chateado, o que provavelmente ajuda primeiro e: ____.',
      '5. Uma frase de pausa que ainda significa que vou voltar poderia ser: ____.',
      '6. Uma coisa que quero que voce evite, mesmo tentando ajudar, e: ____.',
      '',
      'Voce pode editar isso comigo para ficar preciso em vez de precisar adivinhar?',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName || 'love'}, I want to make it easier to care for me too, so here is my first draft of what helps.`,
    '',
    'I care about making this mutual and accurate, not making you guess.',
    '',
    `1. What usually helps me feel loved: ${loveLanguages || '____.'}`,
    `2. How I tend to communicate or process: ${communicationParts || '____.'}`,
    `3. Small things that help me reconnect: ${interestList || '____.'}`,
    '4. When I am upset, what helps first is probably: ____.',
    '5. A pause phrase that still means I am coming back could be: ____.',
    '6. One thing I want you to avoid, even if you are trying to help, is: ____.',
    '',
    'Can you edit this with me so it is accurate instead of making you guess?',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildCareMissRepairDraft(partnerName: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName || 'amor'}, acho que errei o que te ajuda quando as coisas estao dificeis, e nao quero me defender disso.`,
      '',
      'Quero acertar isso porque quero que momentos dificeis sejam mais seguros para nos dois.',
      '',
      'A parte que posso assumir e: ____.',
      '',
      'O que tentei fazer foi: ____.',
      'Como isso pode ter chegado foi: ____.',
      '',
      'Voce pode me dizer o primeiro sinal que devo observar da proxima vez?',
      '',
      'Se agora nao for uma boa hora, podemos voltar nisso mais tarde hoje ou escolher um reparo menor?',
    ].join('\n')
  }
  return [
    `Hey ${partnerName || 'love'}, I think I missed what helps you when things are hard, and I do not want to defend that.`,
    '',
    'I care about getting this right because I want hard moments to feel safer for both of us.',
    '',
    'The part I can own is: ____.',
    '',
    'What I tried to do was: ____.',
    'How it may have landed instead: ____.',
    '',
    'Can you tell me the first signal I should watch for next time?',
    '',
    'If now is not a good time, could we come back to this later today or choose one smaller repair?',
  ].join('\n')
}

export function buildCareInstructionsGoalTitle(partnerName: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') return `Criar instrucoes de cuidado com ${partnerName || 'minha parceria'}`
  return `Create care instructions with ${partnerName || 'my partner'}`
}

export function buildCareInstructionsGoalDraft(partnerName: string, locale: Locale = 'en') {
  const safeName = partnerName || (locale === 'pt-BR' ? 'minha parceria' : 'my partner')

  return {
    title: buildCareInstructionsGoalTitle(partnerName, locale),
    description: locale === 'pt-BR'
      ? `Responder o manual de cuidado com ${safeName}: o que ajuda primeiro quando alguem esta chateado, que frase de pausa ainda significa voltar, que reparo ajuda e o que evitar mesmo tentando ajudar.`
      : `Answer the care manual with ${safeName}: what helps first when upset, what pause phrase still means coming back, what repair helps, and what to avoid even when trying to help.`,
  }
}
