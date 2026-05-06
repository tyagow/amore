import { getProfileInterestItems } from './profile-action-draft'
import type { Locale } from '~/lib/i18n'

interface MoodData {
  mood: string
}

interface LoveLanguageSignal {
  language?: string | null
  confidence?: number | null
}

export interface DailyCarePlanInput {
  partnerName: string
  healthScore: number | null
  partnerMood: MoodData | null
  partnerLoveLanguages: unknown
  partnerInterests: unknown
  hasActiveGoals: boolean
  locale?: Locale
}

export interface DailyCarePlan {
  label: string
  title: string
  reason: string
  steps: string[]
  chatDraft: string
  goalTitle: string
  goalDraft: {
    title: string
    description: string
  }
  coachPrompt: string
}

const LOW_MOODS = new Set(['low', 'struggling'])

export function buildDailyCarePlan(input: DailyCarePlanInput): DailyCarePlan {
  const partnerName = input.partnerName || 'your partner'
  const ptPartnerName = input.partnerName || 'sua parceria'
  const topLoveLanguage = getTopLoveLanguage(input.partnerLoveLanguages)
  const topInterest = getProfileInterestItems(input.partnerInterests)[0]
  const mood = input.partnerMood?.mood ?? null
  const needsRepair = input.healthScore !== null && input.healthScore < 70

  if (input.locale === 'pt-BR') {
    if (mood && LOW_MOODS.has(mood)) {
      return {
        label: 'Plano de cuidado',
        title: `Ajudar ${ptPartnerName} a se sentir menos sozinho(a) hoje`,
        reason: `${ptPartnerName} compartilhou um humor mais dificil. Comece com firmeza acolhedora antes de conselho, conserto ou analise.`,
        steps: [
          'Envie um check-in acolhedor sem pedir que explique tudo.',
          'Ofereca uma opcao concreta de apoio que a pessoa possa aceitar ou recusar.',
          'Volte depois em vez de presumir que silencio significa que esta tudo bem.',
        ],
        chatDraft: `Oi ${ptPartnerName}, percebi que hoje pode estar mais pesado para voce.\n\nEu me importo em ser uma presenca firme, sem fazer voce explicar tudo.\n\nCarinho, ajuda pratica, companhia quieta ou um pouco de espaco ajudaria mais agora?\n\nSe agora nao for um bom momento, posso voltar depois.`,
        goalTitle: `Checar com carinho como ${ptPartnerName} esta hoje`,
        goalDraft: {
          title: `Checar com carinho como ${ptPartnerName} esta hoje`,
          description: 'Enviar um check-in acolhedor, oferecer uma opcao concreta de apoio e voltar depois sem tratar o silencio como se estivesse tudo bem.',
        },
        coachPrompt: `Ajude-me a apoiar ${ptPartnerName} enquanto a pessoa esta se sentindo ${mood}. Quero ser estavel, nao intenso nem cheio de solucoes.`,
      }
    }

    if (needsRepair) {
      return {
        label: 'Plano de cuidado',
        title: 'Reparar primeiro, depois reconectar',
        reason: 'A pontuacao do relacionamento sugere que vale cuidar da tensao antes de adicionar mais planos.',
        steps: [
          'Nomeie uma apreciacao real antes da preocupacao.',
          'Assuma uma parte sem se defender.',
          'Pergunte o que ficou pesado para a pessoa e escute a resposta.',
        ],
        chatDraft: `Oi ${ptPartnerName}, quero reparar algo com cuidado.\n\nUma coisa que eu aprecio em voce e ____.\n\nUma parte que posso assumir e ____.\n\nPodemos separar 10 minutos para falar do que ficou pesado para voce, ou escolher um momento menor mais tarde se agora for demais?`,
        goalTitle: `Ter uma conversa de reparo de 10 minutos com ${ptPartnerName}`,
        goalDraft: {
          title: `Ter uma conversa de reparo de 10 minutos com ${ptPartnerName}`,
          description: 'Nomear uma apreciacao real, assumir uma parte sem se defender, perguntar o que ficou pesado e escutar antes de responder.',
        },
        coachPrompt: `Ajude-me a preparar uma conversa curta de reparo com ${ptPartnerName}. Quero incluir apreciacao, responsabilidade e uma pergunta que me ajude a entender o lado da pessoa.`,
      }
    }

    return {
      label: 'Plano de cuidado',
      title: input.hasActiveGoals ? 'Manter a menor promessa visivel' : 'Escolher uma promessa pequena',
      reason: input.hasActiveGoals
        ? 'Consistencia cria seguranca. Um pequeno cumprimento importa mais que um gesto dramatico.'
        : 'O app fica mais util quando insight vira uma promessa que os dois conseguem ver.',
      steps: [
        'Escolha uma acao que leve menos de 20 minutos.',
        'Diga exatamente quando voce vai fazer.',
        'Volte e marque como feita em vez de deixar abstrata.',
      ],
      chatDraft: `Oi ${ptPartnerName}, quero que a gente escolha uma promessa pequena para esta semana.\n\nEu me importo em deixar simples o bastante para parecer seguro cumprir.\n\nAlgo simples o bastante para realmente cumprir: ____.\n\nIsso ajudaria a gente a se sentir mais conectado, ou devemos escolher uma versao menor?`,
      goalTitle: `Escolher uma promessa pequena com ${ptPartnerName}`,
      goalDraft: {
        title: `Escolher uma promessa pequena com ${ptPartnerName}`,
        description: 'Escolher uma acao de menos de 20 minutos, dizer exatamente quando sera feita e voltar para marcar como concluida.',
      },
      coachPrompt: `Ajude-me a escolher uma promessa pequena de relacionamento com ${ptPartnerName} que seja concreta, emocionalmente util e realista esta semana.`,
    }
  }

  if (mood && LOW_MOODS.has(mood)) {
    return {
      label: 'Care plan',
      title: `Help ${partnerName} feel less alone today`,
      reason: `${partnerName} shared a harder mood. Start with steadiness before advice, fixing, or analysis.`,
      steps: [
        'Send one warm check-in without asking them to explain everything.',
        'Offer one concrete support option they can accept or decline.',
        'Check back later instead of assuming silence means everything is fine.',
      ],
      chatDraft: `Hey ${partnerName}, I noticed today may feel heavier for you.\n\nI care about being steady with you instead of making you explain everything.\n\nWould warmth, practical help, quiet company, or a little space help most right now?\n\nIf now is not a good time, I can check back later.`,
      goalTitle: `Check in gently with ${partnerName} today`,
      goalDraft: {
        title: `Check in gently with ${partnerName} today`,
        description: 'Send one warm check-in, offer one concrete support option they can accept or decline, and check back later without making silence mean everything is fine.',
      },
      coachPrompt: `Help me support ${partnerName} while they are feeling ${mood}. I want to be steady, not overwhelming or solution-heavy.`,
    }
  }

  if (needsRepair) {
    return {
      label: 'Care plan',
      title: 'Repair first, then reconnect',
      reason: 'The relationship score suggests tension is worth addressing before adding more plans.',
      steps: [
        'Name one real appreciation before the concern.',
        'Own one part without defending yourself.',
        'Ask what felt heavy for them and listen for the answer.',
      ],
      chatDraft: `Hey ${partnerName}, I want to repair something gently.\n\nOne thing I appreciate about you is ____.\n\nOne part I can own is ____.\n\nCould we take 10 minutes to talk about what felt heavy for you, or choose a smaller moment later today if now is too much?`,
      goalTitle: `Have one 10-minute repair conversation with ${partnerName}`,
      goalDraft: {
        title: `Have one 10-minute repair conversation with ${partnerName}`,
        description: 'Name one real appreciation, own one part without defending yourself, then ask what felt heavy and listen before responding.',
      },
      coachPrompt: `Help me prepare a short repair conversation with ${partnerName}. I want it to include appreciation, ownership, and a question that helps me understand their side.`,
    }
  }

  if (topLoveLanguage) {
    return {
      label: 'Care plan',
      title: `Make ${topLoveLanguage.toLowerCase()} visible`,
      reason: `${partnerName}'s strongest love-language signal is ${topLoveLanguage}. Turn that insight into one small action today.`,
      steps: [
        loveLanguageStep(topLoveLanguage, partnerName),
        'Keep it small enough to complete today.',
        'Tell them why you chose it so the care is easy to receive.',
      ],
      chatDraft: `Hey ${partnerName}, I was thinking about how care lands for you.\n\nI care about showing up in a way that actually reaches you.\n\nWould one small ${topLoveLanguage.toLowerCase()} gesture from me today feel good, or would a smaller version later land better?`,
      goalTitle: `Do one ${topLoveLanguage.toLowerCase()} gesture for ${partnerName}`,
      goalDraft: {
        title: `Do one ${topLoveLanguage.toLowerCase()} gesture for ${partnerName}`,
        description: `${loveLanguageStep(topLoveLanguage, partnerName)} Keep it small enough to complete today and tell them why you chose it so the care is easy to receive.`,
      },
      coachPrompt: `Help me choose one small ${topLoveLanguage} gesture for ${partnerName} that feels specific, natural, and doable today.`,
    }
  }

  if (topInterest) {
    return {
      label: 'Care plan',
      title: `Be curious about ${topInterest}`,
      reason: `A shared life is built from small bids for attention. ${topInterest} is a concrete doorway into ${partnerName}'s world.`,
      steps: [
        `Ask one open question about ${topInterest}.`,
        'Listen for what they enjoy, not only the facts.',
        'Offer one small way to join, support, or make room for it.',
      ],
      chatDraft: `Hey ${partnerName}, I know ${topInterest} matters to you this week.\n\nI care about knowing that part of your world better.\n\nWhat have you been enjoying about it lately? If now is not a good time, could we come back to it later?`,
      goalTitle: `Ask ${partnerName} about ${topInterest}`,
      goalDraft: {
        title: `Ask ${partnerName} about ${topInterest}`,
        description: `Ask one open question about ${topInterest}, listen for what they enjoy, and offer one small way to join, support, or make room for it.`,
      },
      coachPrompt: `Help me ask ${partnerName} a warm, non-generic question about ${topInterest} and turn it into a small connection moment.`,
    }
  }

  return {
    label: 'Care plan',
    title: input.hasActiveGoals ? 'Keep the smallest promise visible' : 'Choose one tiny promise',
    reason: input.hasActiveGoals
      ? 'Consistency builds safety. One small follow-through matters more than a dramatic gesture.'
      : 'The app is more useful when insight becomes a promise you can both see.',
    steps: [
      'Pick one action that takes less than 20 minutes.',
      'Say exactly when you will do it.',
      'Come back and mark it done instead of letting it stay abstract.',
    ],
    chatDraft: `Hey ${partnerName}, I want us to choose one small promise for this week.\n\nI care about making it simple enough that it feels safe to keep.\n\nSomething simple enough to actually keep: ____.\n\nWould that help us feel more connected, or should we choose a smaller version?`,
    goalTitle: `Choose one tiny promise with ${partnerName}`,
    goalDraft: {
      title: `Choose one tiny promise with ${partnerName}`,
      description: 'Pick one action that takes less than 20 minutes, say exactly when you will do it, and come back to mark it done instead of leaving it abstract.',
    },
    coachPrompt: `Help me choose one tiny relationship promise with ${partnerName} that is concrete, emotionally useful, and realistic this week.`,
  }
}

function getTopLoveLanguage(value: unknown) {
  if (!Array.isArray(value)) return null

  const signals = value
    .filter((item): item is LoveLanguageSignal => !!item && typeof item === 'object')
    .map((item) => ({
      language: typeof item.language === 'string' ? item.language.trim() : '',
      confidence: typeof item.confidence === 'number' ? item.confidence : 0,
    }))
    .filter((item) => item.language)
    .sort((a, b) => b.confidence - a.confidence)

  return signals[0]?.language ?? null
}

function loveLanguageStep(language: string, partnerName: string) {
  const normalized = language.toLowerCase()

  if (normalized.includes('service')) return `Take one task off ${partnerName}'s plate before they have to ask.`
  if (normalized.includes('time')) return `Protect one short window of undistracted time with ${partnerName}.`
  if (normalized.includes('affirmation')) return `Send one specific sentence about what you value in ${partnerName}.`
  if (normalized.includes('touch')) return `Offer a small affectionate moment and let ${partnerName} choose what feels good.`
  if (normalized.includes('gift')) return `Bring or send one tiny thing that says you noticed ${partnerName}.`

  return `Choose one small gesture that makes ${language.toLowerCase()} concrete for ${partnerName}.`
}
