import { getProfileInterestItems } from './profile-action-draft'
import type { Locale } from '~/lib/i18n'

interface MoodData {
  mood: string
}

export interface MicroDatePlanInput {
  partnerName: string
  partnerMood: MoodData | null
  partnerInterests: unknown
  healthScore: number | null
  locale?: Locale
}

export interface MicroDatePlan {
  label: string
  title: string
  reason: string
  timebox: string
  steps: string[]
  chatDraft: string
  goalTitle: string
  goalDraft: {
    title: string
    description: string
  }
}

const HARD_MOODS = new Set(['low', 'struggling'])

export function buildMicroDatePlan(input: MicroDatePlanInput): MicroDatePlan {
  const partnerName = input.partnerName || 'your partner'
  const ptPartnerName = input.partnerName || 'sua parceria'
  const topInterest = getProfileInterestItems(input.partnerInterests)[0]
  const mood = input.partnerMood?.mood ?? null
  const needsGentleRepair = input.healthScore !== null && input.healthScore < 70

  if (input.locale === 'pt-BR') {
    if (mood && HARD_MOODS.has(mood)) {
      return {
        label: 'Microencontro',
        title: `Uma noite mais suave com ${ptPartnerName}`,
        reason: `${ptPartnerName} talvez tenha pouca capacidade hoje. Deixe a conexao quieta, opcional e facil de receber.`,
        timebox: '20 minutos',
        steps: [
          'Ofereca duas escolhas de baixa pressao.',
          'Deixe o silencio contar como conexao.',
          'Termine nomeando uma coisa pela qual voce sente gratidao.',
        ],
        chatDraft: `Oi ${ptPartnerName}, sei que hoje talvez nao tenha muito espaco.\n\nEu me importo em fazer a conexao parecer facil de receber hoje a noite.\n\nUm reset quieto de 20 minutos ajudaria? Podemos sentar juntos, dar uma caminhada curta ou nao fazer nada util por um pouco. Sem pressao se espaco parecer melhor.`,
        goalTitle: `Oferecer a ${ptPartnerName} um reset quieto de 20 minutos`,
        goalDraft: {
          title: `Oferecer a ${ptPartnerName} um reset quieto de 20 minutos`,
          description: 'Oferecer duas escolhas de baixa pressao, deixar o silencio contar como conexao e terminar com uma gratidao.',
        },
      }
    }

    if (needsGentleRepair) {
      return {
        label: 'Microencontro',
        title: 'Reconectar sem fingir que nada aconteceu',
        reason: 'Quando ha tensao, a atividade deve baixar a pressao e deixar espaco para um pequeno momento de reparo.',
        timebox: '30 minutos',
        steps: [
          'Comece com algo neutro e facil.',
          'Compartilhe uma apreciacao antes de discutir a tensao.',
          'Pare enquanto a conversa ainda parece segura.',
        ],
        chatDraft: `Oi ${ptPartnerName}, nao quero que a gente finja que esta tudo perfeito nem deixar a noite pesada.\n\nEu me importo em reconectar sem passar correndo pelo que foi dificil.\n\nPodemos fazer um reset leve de 30 minutos e depois cada um nomear uma apreciacao e uma coisa que quer entender melhor?\n\nSe agora nao for um bom momento, podemos escolher uma versao menor mais tarde?`,
        goalTitle: `Fazer um reset de reparo leve com ${ptPartnerName}`,
        goalDraft: {
          title: `Fazer um reset de reparo leve com ${ptPartnerName}`,
          description: 'Comecar com algo neutro, compartilhar uma apreciacao antes de falar da tensao e parar enquanto a conversa ainda parece segura.',
        },
      }
    }

    return {
      label: 'Microencontro',
      title: 'Proteger um pequeno momento sem celular',
      reason: 'O plano mais util e aquele que voces conseguem cumprir. Deixe curto, especifico e com poucas distracoes.',
      timebox: '20 minutos',
      steps: [
        'Escolha um dia e horario exatos.',
        'Guarde os celulares onde ninguem precise vigiar.',
        'Faca uma pergunta e compartilhe uma apreciacao.',
      ],
      chatDraft: `Oi ${ptPartnerName}, podemos proteger um momento sem celular de 20 minutos esta semana?\n\nEu me importo em fazer um pequeno momento parecer presente e facil.\n\nNada elaborado. Quero um momento pequeno para fazermos uma pergunta real e compartilharmos uma apreciacao.\n\nSe agora nao for um bom momento, podemos escolher uma versao menor mais tarde?`,
      goalTitle: `Proteger 20 minutos sem celular com ${ptPartnerName}`,
      goalDraft: {
        title: `Proteger 20 minutos sem celular com ${ptPartnerName}`,
        description: 'Escolher dia e horario, guardar os celulares, fazer uma pergunta real e compartilhar uma apreciacao.',
      },
    }
  }

  if (mood && HARD_MOODS.has(mood)) {
    return {
      label: 'Micro-date',
      title: `A softer night with ${partnerName}`,
      reason: `${partnerName} may not have much capacity today. Make connection quiet, optional, and easy to receive.`,
      timebox: '20 minutes',
      steps: [
        'Offer two low-pressure choices.',
        'Let silence count as connection.',
        'End by naming one thing you are grateful for.',
      ],
      chatDraft: `Hey ${partnerName}, I know today may not have much space in it.\n\nI care about making connection feel easy to receive tonight.\n\nWould a quiet 20-minute reset help? We could sit together, take a short walk, or do nothing useful for a bit. No pressure if space would feel better.`,
      goalTitle: `Offer ${partnerName} a quiet 20-minute reset`,
      goalDraft: {
        title: `Offer ${partnerName} a quiet 20-minute reset`,
        description: 'Offer two low-pressure choices, let silence count as connection, and end by naming one thing you are grateful for.',
      },
    }
  }

  if (needsGentleRepair) {
    return {
      label: 'Micro-date',
      title: 'Reconnect without pretending nothing happened',
      reason: 'When there is tension, the activity should lower pressure and leave room for a short repair moment.',
      timebox: '30 minutes',
      steps: [
        'Start with something neutral and easy.',
        'Share one appreciation before discussing the tension.',
        'Stop while the conversation still feels safe.',
      ],
      chatDraft: `Hey ${partnerName}, I do not want us to pretend everything is perfect or make tonight heavy.\n\nI care about reconnecting without rushing past what felt hard.\n\nCould we do one low-pressure 30-minute reset, then each name one appreciation and one thing we want to understand better?\n\nIf now is not a good time, could we choose a smaller version later?`,
      goalTitle: `Do one low-pressure repair reset with ${partnerName}`,
      goalDraft: {
        title: `Do one low-pressure repair reset with ${partnerName}`,
        description: 'Start with something neutral, share one appreciation before discussing tension, and stop while the conversation still feels safe.',
      },
    }
  }

  if (topInterest) {
    return {
      label: 'Micro-date',
      title: `Join ${partnerName}'s world for a little while`,
      reason: `${topInterest} is already meaningful to ${partnerName}. A tiny plan built around it can feel more personal than a generic date.`,
      timebox: '25 minutes',
      steps: [
        `Ask ${partnerName} to choose one small version of ${topInterest}.`,
        'Join with curiosity instead of trying to perform.',
        'Ask what they enjoy about it before sharing your own reaction.',
      ],
      chatDraft: `Hey ${partnerName}, I was thinking about ${topInterest} and how it matters to you.\n\nI care about knowing that part of your world in a way that feels easy.\n\nCould we do a tiny 25-minute version together this week? You can choose the easiest version. I mostly want to be curious and share something that is yours.\n\nIf now is not a good time, could we choose a smaller version later?`,
      goalTitle: `Plan a tiny ${topInterest} moment with ${partnerName}`,
      goalDraft: {
        title: `Plan a tiny ${topInterest} moment with ${partnerName}`,
        description: `Ask ${partnerName} to choose one small version of ${topInterest}, join with curiosity, and ask what they enjoy about it before sharing your reaction.`,
      },
    }
  }

  return {
    label: 'Micro-date',
    title: 'Protect one small no-phone pocket',
    reason: 'The most useful plan is the one you can actually keep. Make it short, specific, and distraction-light.',
    timebox: '20 minutes',
    steps: [
      'Pick one exact day and time.',
      'Put phones away where neither person has to police it.',
      'Ask one question and share one appreciation.',
    ],
    chatDraft: `Hey ${partnerName}, could we protect one 20-minute no-phone pocket this week?\n\nI care about making one small moment feel present and easy.\n\nNothing elaborate. I want one small moment where we ask one real question and share one appreciation.\n\nIf now is not a good time, could we choose a smaller version later?`,
    goalTitle: `Protect one 20-minute no-phone pocket with ${partnerName}`,
    goalDraft: {
      title: `Protect one 20-minute no-phone pocket with ${partnerName}`,
      description: 'Pick one exact day and time, put phones away where neither person has to police it, then ask one real question and share one appreciation.',
    },
  }
}

export function buildMicroDateRescheduleDraft(partnerName: string, locale: Locale = 'en') {
  const safeName = partnerName || 'your partner'

  if (locale === 'pt-BR') {
    const ptName = partnerName || 'sua parceria'
    return [
      `Oi ${ptName}, eu ainda quero esse pequeno tempo de conexao com voce, e tambem nao quero que vire pressao.`,
      '',
      'Eu me importo em manter isso acolhedor e possivel, mesmo que o plano original precise mudar.',
      '',
      'Se hoje a noite nao encaixar, podemos escolher uma versao menor ou outro horario agora para isso nao desaparecer em silencio?',
      '',
      'Uma versao menor poderia ser: 10 minutos, celulares longe, uma apreciacao, e parar enquanto ainda parece facil.',
      '',
      'Isso funciona para voce, ou outra versao seria melhor?',
    ].join('\n')
  }

  return [
    `Hey ${safeName}, I still want the small connection time with you, and I also do not want it to become pressure.`,
    '',
    'I care about us keeping this warm and doable, even if the original plan needs to change.',
    '',
    'If tonight does not fit, could we pick a smaller version or another time now so it does not silently disappear?',
    '',
    'A smaller version could be: 10 minutes, phones away, one appreciation, then stop while it still feels easy.',
    '',
    'Does that work for you, or would another version feel better?',
  ].join('\n')
}
