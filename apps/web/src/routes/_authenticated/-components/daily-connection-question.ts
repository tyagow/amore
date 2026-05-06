import { getProfileInterestItems } from './profile-action-draft'
import type { Locale } from '~/lib/i18n'

interface MoodData {
  mood: string
}

export interface DailyConnectionQuestionInput {
  partnerName: string
  partnerMood: MoodData | null
  partnerInterests: unknown
  healthScore: number | null
  locale?: Locale
}

export interface DailyConnectionQuestion {
  label: string
  title: string
  question: string
  reason: string
  chatDraft: string
  goalTitle: string
  goalDraft: {
    title: string
    description: string
  }
  coachPrompt: string
}

const HARD_MOODS = new Set(['low', 'struggling'])

export function buildDailyConnectionQuestion(input: DailyConnectionQuestionInput): DailyConnectionQuestion {
  const partnerName = input.partnerName || 'your partner'
  const ptPartnerName = input.partnerName || 'sua parceria'
  const topInterest = getProfileInterestItems(input.partnerInterests)[0]
  const mood = input.partnerMood?.mood ?? null
  const needsRepair = input.healthScore !== null && input.healthScore < 70

  if (input.locale === 'pt-BR') {
    if (mood && HARD_MOODS.has(mood)) {
      const question = 'O que ajudaria voce a se sentir um pouco menos sozinho(a) hoje a noite?'
      return {
        label: 'Pergunta do dia',
        title: `Perguntar a ${ptPartnerName} que apoio realmente chegaria bem`,
        question,
        reason: `${ptPartnerName} compartilhou um humor mais dificil. Uma pergunta util da escolhas em vez de exigir explicacao.`,
        chatDraft: `Oi ${ptPartnerName}, sei que hoje pode estar mais pesado.\n\nEu me importo em apoiar voce do jeito que realmente chega bem.\n\n${question}\n\nPosso escutar, ajudar com algo concreto, dar carinho ou dar um pouco de espaco. O que seria melhor? Se agora nao for um bom momento, podemos voltar nisso depois.`,
        goalTitle: `Perguntar a ${ptPartnerName} que apoio ajudaria hoje a noite`,
        goalDraft: {
          title: `Perguntar a ${ptPartnerName} que apoio ajudaria hoje a noite`,
          description: 'Perguntar o que ajudaria a pessoa a se sentir menos sozinha, oferecer escolhas claras e aceitar a resposta sem exigir explicacao.',
        },
        coachPrompt: `Ajude-me a perguntar a ${ptPartnerName} que apoio ajudaria enquanto a pessoa esta se sentindo ${mood}, sem soar ansioso ou exigente.`,
      }
    }

    if (needsRepair) {
      const question = 'Qual e uma coisa que voce gostaria que eu entendesse melhor sobre esta semana?'
      return {
        label: 'Pergunta do dia',
        title: 'Usar uma pergunta para baixar a defensividade',
        question,
        reason: 'Quando ha tensao, a curiosidade precisa vir antes das solucoes.',
        chatDraft: `Oi ${ptPartnerName}, eu me importo em te entender antes de tentar consertar qualquer coisa.\n\n${question}\n\nVou tentar escutar sem me defender primeiro. Se agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`,
        goalTitle: `Fazer uma pergunta de reparo para ${ptPartnerName}`,
        goalDraft: {
          title: `Fazer uma pergunta de reparo para ${ptPartnerName}`,
          description: 'Perguntar o que a pessoa gostaria que voce entendesse melhor sobre a semana, depois escutar sem se defender antes de responder.',
        },
        coachPrompt: `Ajude-me a fazer uma pergunta de reparo sem defensividade para ${ptPartnerName} e me preparar para escutar antes de responder.`,
      }
    }

    const question = 'Qual foi uma coisa pequena que fez voce se sentir perto de mim recentemente?'
    return {
      label: 'Pergunta do dia',
      title: 'Encontrar o que ja esta funcionando',
      question,
      reason: 'Casais repetem o que conseguem notar. Esta pergunta ajuda os dois a identificar conexao, nao apenas problemas.',
      chatDraft: `Oi ${ptPartnerName}, quero notar tambem o que esta funcionando entre a gente.\n\nEu me importo em repetirmos os momentos que ajudam a gente a se sentir perto.\n\n${question}\n\nPosso compartilhar a minha depois de voce, ou podemos escolher um momento menor mais tarde se agora nao for bom.`,
      goalTitle: `Perguntar a ${ptPartnerName} o que ajudou a se sentir perto`,
      goalDraft: {
        title: `Perguntar a ${ptPartnerName} o que ajudou a se sentir perto`,
        description: 'Perguntar uma coisa pequena que recentemente ajudou a pessoa a se sentir perto, depois compartilhar a sua.',
      },
      coachPrompt: `Ajude-me a transformar uma pergunta positiva de relacionamento em uma conversa curta e acolhedora com ${ptPartnerName}.`,
    }
  }

  if (mood && HARD_MOODS.has(mood)) {
    const question = 'What would help you feel a little less alone tonight?'
    return {
      label: 'Question of the day',
      title: `Ask ${partnerName} what support would actually land`,
      question,
      reason: `${partnerName} shared a harder mood. A useful question gives them choices instead of making them explain everything.`,
      chatDraft: `Hey ${partnerName}, I know today may feel heavier.\n\nI care about supporting you in the way that actually lands.\n\n${question}\n\nI can listen, help with one concrete thing, give warmth, or give a little space. What would feel best? If now is not a good time, we can come back to it later.`,
      goalTitle: `Ask ${partnerName} what support would help tonight`,
      goalDraft: {
        title: `Ask ${partnerName} what support would help tonight`,
        description: 'Ask what would help them feel less alone, offer clear choices, and accept their answer without making them explain everything.',
      },
      coachPrompt: `Help me ask ${partnerName} what support would help while they are feeling ${mood}, without sounding anxious or demanding.`,
    }
  }

  if (needsRepair) {
    const question = 'What is one thing you wish I understood better about this week?'
    return {
      label: 'Question of the day',
      title: 'Use one question to lower defensiveness',
      question,
      reason: 'When tension is present, curiosity has to come before solutions.',
      chatDraft: `Hey ${partnerName}, I care about understanding you before I try to fix anything.\n\n${question}\n\nI will try to listen without defending myself first. If now is not a good time, could we choose a smaller moment later today?`,
      goalTitle: `Ask one repair question to ${partnerName}`,
      goalDraft: {
        title: `Ask one repair question to ${partnerName}`,
        description: 'Ask what they wish you understood better about this week, then listen without defending yourself before you respond.',
      },
      coachPrompt: `Help me ask ${partnerName} one non-defensive repair question and prepare to listen before responding.`,
    }
  }

  if (topInterest) {
    const question = `What has been making ${topInterest} feel meaningful or fun for you lately?`
    return {
      label: 'Question of the day',
      title: `Learn one thing about ${topInterest}`,
      question,
      reason: `${topInterest} is a doorway into ${partnerName}'s world. Curiosity is a small daily bid for closeness.`,
      chatDraft: `Hey ${partnerName}, I want to know your world better.\n\nI care about what lights you up, not just what needs solving.\n\n${question}\n\nI am not asking to solve anything. I just want to understand what you enjoy about it, or come back to it later if now is not a good time.`,
      goalTitle: `Ask ${partnerName} one question about ${topInterest}`,
      goalDraft: {
        title: `Ask ${partnerName} one question about ${topInterest}`,
        description: `Ask what has made ${topInterest} meaningful or fun lately. Listen for what they enjoy instead of turning it into advice or a task.`,
      },
      coachPrompt: `Help me ask ${partnerName} a warm follow-up question about ${topInterest} that feels natural and not like an interview.`,
    }
  }

  const question = 'What is one small thing that helped you feel close to me recently?'
  return {
    label: 'Question of the day',
    title: 'Find what is already working',
    question,
    reason: 'Couples repeat what they notice. This question helps both people identify connection instead of only problems.',
    chatDraft: `Hey ${partnerName}, I want to notice what is working between us too.\n\nI care about us repeating the moments that help us feel close.\n\n${question}\n\nI can share mine after you, or we can pick a smaller moment later if now is not a good time.`,
    goalTitle: `Ask ${partnerName} what helped them feel close`,
    goalDraft: {
      title: `Ask ${partnerName} what helped them feel close`,
      description: 'Ask one small thing that recently helped them feel close, then share yours so the conversation notices what is working.',
    },
    coachPrompt: `Help me turn a positive relationship question into a short, warm conversation with ${partnerName}.`,
  }
}
