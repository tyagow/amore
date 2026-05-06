import type { Locale } from '~/lib/i18n'

export type StoredGoalDraft = {
  title: string
  description: string
  dueDate: string
}

export function parseStoredGoalDraft(rawDraft: string, fallbackDueDate: string): StoredGoalDraft {
  const fallback = {
    title: rawDraft,
    description: 'A tiny relationship practice for this week.',
    dueDate: fallbackDueDate,
  }

  try {
    const parsed = JSON.parse(rawDraft) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback
    }

    const draft = parsed as Record<string, unknown>
    const title = typeof draft.title === 'string' ? draft.title.trim() : ''
    if (!title) return fallback

    return {
      title,
      description: typeof draft.description === 'string' && draft.description.trim()
        ? draft.description.trim()
        : fallback.description,
      dueDate: typeof draft.dueDate === 'string' && draft.dueDate.trim()
        ? draft.dueDate.trim()
        : fallback.dueDate,
    }
  } catch {
    return fallback
  }
}

export function buildGoalDiscussionDraft(goal: {
  title: string
  description: string | null
  dueDate?: string | Date | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const dueDate = goal.dueDate
      ? `\n\nPodemos fazer check-in antes de ${formatGoalDueDate(goal.dueDate, 'pt-BR')}?`
      : ''
    const description = goal.description ? `\n\nO que isso significa para mim: ${goal.description}` : ''
    return `Quero que a gente continue conectado em torno desta meta: ${goal.title}.${description}\n\nPodemos cada um compartilhar uma pequena coisa que deixaria isso mais facil de manter nesta semana?${dueDate}`
  }
  const dueDate = goal.dueDate
    ? `\n\nCould we check in before ${formatGoalDueDate(goal.dueDate)}?`
    : ''
  const description = goal.description ? `\n\nWhat this means to me: ${goal.description}` : ''

  return `I want us to stay connected around this goal: ${goal.title}.${description}\n\nCould we each share one small thing that would make this easier to keep this week?${dueDate}`
}

export function buildGoalCelebrationDraft(goal: {
  title: string
  description: string | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nO que praticamos: ${goal.description}` : ''
    return `Fico feliz que concluimos isso juntos: ${goal.title}.${description}\n\nQuero que a gente perceba o que funcionou, nao so passe para a proxima coisa.\n\nPodemos tirar um minuto para nomear o que funcionou, o que foi dificil e se queremos repetir uma versao menor na proxima semana?`
  }
  const description = goal.description ? `\n\nWhat we practiced: ${goal.description}` : ''

  return `I am glad we completed this together: ${goal.title}.${description}\n\nI care about us noticing what worked, not just moving on to the next thing.\n\nCan we take a minute to name what worked, what felt hard, and whether we want to repeat a smaller version next week?`
}

export function buildGoalRenegotiationDraft(goal: {
  title: string
  description: string | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA versao original era: ${goal.description}` : ''
    return `Nao quero que esta meta vire pressao ou culpa: ${goal.title}.${description}\n\nQuero tornar isso possivel para nos dois.\n\nPodemos deixar menor e mais realista para esta semana?\n\nUma versao que acho que conseguiriamos manter e: ____.\n\nSe isso nao funcionar, podemos escolher outra versao menor juntos?`
  }
  const description = goal.description ? `\n\nThe original version was: ${goal.description}` : ''

  return `I do not want this goal to become pressure or guilt: ${goal.title}.${description}\n\nI care about making this doable for both of us.\n\nCould we make it smaller and more realistic for this week?\n\nA version I think we could actually keep is: ____.\n\nIf that does not work, could we choose another smaller version together?`
}

export function buildGoalMidweekCheckInDraft(goal: {
  title: string
  description: string | null
  dueDate?: string | Date | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA promessa era: ${goal.description}` : ''
    const dueDate = goal.dueDate
      ? `\n\nAntes de ${formatGoalDueDate(goal.dueDate, 'pt-BR')}, podemos cada um nomear um proximo passo?`
      : '\n\nPodemos cada um nomear um proximo passo para as proximas 24 horas?'
    return `Check-in rapido da meta hoje: ${goal.title}.${description}\n\nQuero que a gente ajuste antes que isso vire pressao.\n\nO que foi mais facil do que esperavamos?\n\nO que tem atrapalhado?\n\nQual e a menor versao que ainda conseguimos fazer hoje?${dueDate}`
  }
  const description = goal.description ? `\n\nThe promise was: ${goal.description}` : ''
  const dueDate = goal.dueDate
    ? `\n\nBefore ${formatGoalDueDate(goal.dueDate)}, could we each name one next step?`
    : '\n\nCould we each name one next step for the next 24 hours?'

  return `Quick goal check-in today: ${goal.title}.${description}\n\nI care about us adjusting before this turns into pressure.\n\nWhat has been easier than expected?\n\nWhat has been getting in the way?\n\nWhat is the smallest version we can still do today?${dueDate}`
}

export function buildGoalTodayDraft(goal: {
  title: string
  description: string | null
  dueDate?: string | Date | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA meta maior e: ${goal.description}` : ''
    const dueDate = goal.dueDate
      ? `\n\nO prazo e ${formatGoalDueDate(goal.dueDate, 'pt-BR')}, entao quero fazer um movimento visivel hoje em vez de esperar.`
      : ''
    return `Para nossa meta "${goal.title}", quero escolher a menor versao que realmente conseguimos fazer hoje.${description}${dueDate}\n\nQuero tornar o progresso visivel sem transformar isso em pressao.\n\nMinha versao pequena para hoje e: ____.\n\nVoce poderia escolher a sua tambem, ou me dizer o que tornaria a minha mais facil de receber?\n\nSe isso nao funcionar, podemos escolher uma versao ainda menor?`
  }
  const description = goal.description ? `\n\nThe bigger goal is: ${goal.description}` : ''
  const dueDate = goal.dueDate
    ? `\n\nThis is due ${formatGoalDueDate(goal.dueDate)}, so I want to make one visible move today instead of waiting.`
    : ''

  return `For our goal "${goal.title}", I want to choose the smallest version we can actually do today.${description}${dueDate}\n\nI care about making progress visible without turning this into pressure.\n\nMy tiny version for today is: ____.\n\nCould you choose yours too, or tell me what would make mine easier to receive?\n\nIf that does not work, could we choose an even smaller version?`
}

export function buildGoalSupportPlanDraft(goal: {
  title: string
  description: string | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA meta e: ${goal.description}` : ''
    return `Quero que esta meta pareca trabalho em equipe, nao mais uma coisa que a gente julga em silencio: ${goal.title}.${description}\n\nQuero que a gente planeje apoio antes que qualquer um se sinta sozinho com isso.\n\nPodemos cada um nomear um obstaculo que pode dificultar, e depois escolher uma forma de apoiar um ao outro antes que escorregue?\n\nUm obstaculo para mim e: ____.\n\nUm tipo de apoio que ajudaria e: ____.\n\nSe isso nao funcionar, podemos escolher um plano de apoio menor?`
  }
  const description = goal.description ? `\n\nThe goal is: ${goal.description}` : ''

  return `I want this goal to feel like teamwork, not another thing we silently judge each other on: ${goal.title}.${description}\n\nI care about us planning support before either of us feels alone with it.\n\nCan we each name one obstacle that might make this hard, then choose one way to support each other before it slips?\n\nOne obstacle for me is: ____.\n\nOne kind of support that would help is: ____.\n\nIf that does not work, could we choose a smaller support plan?`
}

export function buildGoalProgressAppreciationDraft(goal: {
  title: string
  description: string | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA meta e: ${goal.description}` : ''
    return `Quero perceber o progresso nesta meta antes de focarmos so no que ainda falta: ${goal.title}.${description}\n\nQuero que a gente torne o esforco visivel.\n\nUma coisa que vi voce tentar foi: ____.\n\nUma coisa que estou tentando e: ____.\n\nPodemos nomear o que esta funcionando, e depois escolher o proximo menor passo ou uma versao menor se isso parecer demais?`
  }
  const description = goal.description ? `\n\nThe goal is: ${goal.description}` : ''

  return `I want to notice progress on this goal before we only focus on what is unfinished: ${goal.title}.${description}\n\nI care about us making effort visible.\n\nOne thing I saw you try was: ____.\n\nOne thing I am trying is: ____.\n\nCould we name what is working, then choose the next smallest step or a smaller version if this feels like too much?`
}

export function buildCareSwapInviteDraft(locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    return [
      'Podemos fazer uma troca de cuidado de 10 minutos nesta semana?',
      '',
      'Quero que o apoio diario fique mais claro e mais leve para nos dois.',
      '',
      'Quero que cada um nomeie uma pequena coisa que deixaria a vida diaria mais leve, nao como reclamacao, mas como um pedido claro.',
      '',
      'Meu pedido e: ____.',
      '',
      'O apoio que posso te oferecer e: ____.',
      '',
      'Se isso nao funcionar, podemos escolher um pedido menor cada um?',
    ].join('\n')
  }
  return [
    'Could we do a 10-minute care swap this week?',
    '',
    'I care about making daily support feel clearer and lighter for both of us.',
    '',
    'I want each of us to name one small thing that would make daily life feel lighter, not as a complaint but as a clear request.',
    '',
    'My request is: ____.',
    '',
    'The support I can offer you is: ____.',
    '',
    'If that does not work, could we choose one smaller request each?',
  ].join('\n')
}

export function buildChangedBehaviorApologyInviteDraft(locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    return [
      'Quero fazer um pedido de desculpas nesta semana que inclua mudanca de comportamento, nao so palavras.',
      '',
      'Quero reparar isso de um jeito que realmente chegue para voce.',
      '',
      'O que quero assumir e: ____.',
      '',
      'O impacto que consigo entender e: ____.',
      '',
      'O comportamento especifico que vou praticar diferente da proxima vez e: ____.',
      '',
      'Voce estaria disposto a me dizer se isso realmente repararia algo para voce?',
      '',
      'Se isso nao funcionar, posso escutar primeiro e perguntar de novo em outro momento.',
    ].join('\n')
  }
  return [
    'I want to make one apology this week that includes changed behavior, not just words.',
    '',
    'I care about repairing this in a way that actually lands for you.',
    '',
    'The thing I want to own is: ____.',
    '',
    'The impact I can understand is: ____.',
    '',
    'The specific behavior I will practice differently next time is: ____.',
    '',
    'Would you be willing to tell me whether that would actually repair anything for you?',
    '',
    'If that does not work, I can listen first and ask again another time.',
  ].join('\n')
}

export function buildGoalSlipRepairDraft(goal: {
  title: string
  description: string | null
}, locale: Locale = 'en'): string {
  if (locale === 'pt-BR') {
    const description = goal.description ? `\n\nA promessa era: ${goal.description}` : ''
    return `Acho que talvez a gente tenha escorregado nesta meta: ${goal.title}.${description}\n\nQuero reparar o deslize antes que vire culpa ou ressentimento silencioso.\n\nPodemos cada um nomear uma coisa que atrapalhou, e depois escolher a menor versao de reparo para as proximas 24 horas?\n\nMinha parte e: ____.\n\nUma versao menor que consigo fazer e: ____.\n\nSe isso nao funcionar, podemos escolher outra versao menor ou outro horario?`
  }
  const description = goal.description ? `\n\nThe promise was: ${goal.description}` : ''

  return `I think we may have slipped on this goal: ${goal.title}.${description}\n\nI care about repairing the slip before it turns into blame or quiet resentment.\n\nCan we each name one thing that got in the way, then choose the smallest repair version for the next 24 hours?\n\nMy part is: ____.\n\nA smaller version I can do is: ____.\n\nIf that does not work, could we choose another smaller version or another time?`
}

export function formatGoalDueDate(date: string | Date, locale = 'en-US'): string {
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : 'en-US'
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(dateLocale, {
      month: 'short',
      day: 'numeric',
    })
  }

  if (date instanceof Date) {
    return new Intl.DateTimeFormat(dateLocale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  }

  return new Date(date).toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
  })
}
