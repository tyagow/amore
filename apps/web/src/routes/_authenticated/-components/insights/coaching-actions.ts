import type { Locale } from '~/lib/i18n'

export function buildGoalSuggestionDraft(title: string, description: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return `Vi uma meta de relacionamento hoje que pode ajudar a gente: ${title}.\n\nEu me importo em fazer isso parecer possivel para nos dois, nao como tarefa.\n\n${description || 'A gente poderia deixar isso pequeno o bastante para realmente tentar esta semana?'}\n\nVoce estaria aberto(a) a escolher uma versao bem pequena disso comigo, ou escolher uma versao menor depois se agora nao for um bom momento?`
  }

  return `I saw a relationship goal today that could help us: ${title}.\n\nI care about making this feel doable for both of us, not like homework.\n\n${description || 'Could we make this small enough to actually try this week?'}\n\nWould you be open to choosing one tiny version of this together, or picking a smaller version later if now is not a good time?`
}

export function buildGoalSuggestionGoalDraft(title: string, description: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return {
      title: title || 'Escolher uma pequena pratica do relacionamento',
      description: `${description || 'Escolher uma versao pequena desta pratica que voces realmente possam tentar esta semana.'} Decidir quando vai acontecer, manter pequeno e checar depois se ajudou.`,
    }
  }

  return {
    title: title || 'Choose one tiny relationship practice',
    description: `${description || 'Choose one tiny version of this practice that you can actually try this week.'} Decide when it will happen, keep it small, and check whether it helped afterward.`,
  }
}

export function buildConflictRepairDraft(message: string, locale: Locale = 'en') {
  if (locale === 'pt-BR') {
    return `Nao quero que essa tensao vire nos contra nos hoje.\n\nEu me importo em manter a conexao enquanto organizamos isso.\n\nO que estou percebendo: ${message || 'algo parece estranho entre nos'}.\n\nPodemos recomecar com mais gentileza? Quero entender o que foi dificil para voce e compartilhar meu lado sem te atacar.\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`
  }

  return `I do not want this tension to become us versus each other today.\n\nI care about keeping us connected while we sort it out.\n\nWhat I am noticing: ${message || 'something feels off between us'}.\n\nCan we restart more gently? I want to understand what felt hard for you and share my side without attacking you.\n\nIf now is not a good time, could we choose a smaller moment later today?`
}
