import type { Locale } from '~/lib/i18n'

type WeeklyResetNotes = Record<string, string>

const STEP_LABELS: Record<string, string> = {
  appreciate: 'One thing I appreciated',
  'hard-thing': 'One thing that felt hard',
  need: 'One thing I need more of',
  promise: 'One tiny promise for this week',
}

const STEP_LABELS_PT_BR: Record<string, string> = {
  appreciate: 'Uma coisa que apreciei',
  'hard-thing': 'Uma coisa que foi dificil',
  need: 'Uma coisa de que preciso mais',
  promise: 'Uma pequena promessa para esta semana',
}

export function buildWeeklyResetDraft(partnerName: string, notes: WeeklyResetNotes, locale: Locale = 'en') {
  const labels = locale === 'pt-BR' ? STEP_LABELS_PT_BR : STEP_LABELS
  const lines = Object.entries(labels).map(([key, label]) => {
    const value = notes[key]?.trim()
    return `${label}: ${value || (locale === 'pt-BR' ? 'Quero responder isso junto.' : 'I want to answer this together.')}`
  })

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, preenchi um reset semanal simples para nos.`,
      '',
      'Quero usar isso como um check-in gentil, nao como placar.',
      '',
      ...lines,
      '',
      'Podemos tirar 15 minutos para comparar respostas e escolher uma pequena coisa para esta semana?',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName}, I filled out a simple weekly reset for us.`,
    '',
    'I care about using this as a gentle check-in, not a scorecard.',
    '',
    ...lines,
    '',
    'Could we take 15 minutes to compare answers and choose one tiny thing for this week?',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildWeeklyNeedRequestDraft(partnerName: string, notes: WeeklyResetNotes, locale: Locale = 'en') {
  const need = notes.need?.trim() || (locale === 'pt-BR' ? 'uma pequena coisa que me ajudaria a me sentir mais perto na proxima semana' : 'one small thing that would help me feel closer next week')
  const hardThing = notes['hard-thing']?.trim()
  const context = hardThing
    ? locale === 'pt-BR'
      ? `Uma coisa que foi dificil nesta semana foi: ${hardThing}.`
      : `One thing that felt hard this week was: ${hardThing}.`
    : locale === 'pt-BR'
      ? 'Quero pedir antes que isso vire distancia ou ressentimento.'
      : 'I want to ask before this turns into distance or resentment.'

  if (locale === 'pt-BR') {
    return [
      `Oi ${partnerName}, posso fazer um pequeno pedido do reset semanal?`,
      '',
      context,
      '',
      'Quero pedir enquanto ainda e pequeno o bastante para tratar com cuidado.',
      '',
      `O que me ajudaria na proxima semana e: ${need}.`,
      '',
      'Podemos escolher juntos a menor versao disso para que pareca possivel para nos dois?',
      '',
      'Se agora nao for uma boa hora, podemos escolher um momento menor mais tarde?',
    ].join('\n')
  }

  return [
    `Hey ${partnerName}, can I make one small weekly reset ask?`,
    '',
    context,
    '',
    'I care about asking while it is still small enough to handle kindly.',
    '',
    `What would help me next week is: ${need}.`,
    '',
    'Could we choose the smallest version of that together so it feels doable for both of us?',
    '',
    'If now is not a good time, could we choose a smaller moment later?',
  ].join('\n')
}

export function buildWeeklyPromiseGoalTitle(notes: WeeklyResetNotes, locale: Locale = 'en') {
  const promise = notes.promise?.trim()
  if (!promise) return null

  if (locale === 'pt-BR') return `Nesta semana: ${promise}`
  return `This week: ${promise}`
}

export function buildWeeklyPromiseGoalDraft(notes: WeeklyResetNotes, locale: Locale = 'en') {
  const title = buildWeeklyPromiseGoalTitle(notes, locale)
  if (!title) return null

  const appreciate = notes.appreciate?.trim()
  const hardThing = notes['hard-thing']?.trim()
  const need = notes.need?.trim()
  const promise = notes.promise?.trim()
  if (locale === 'pt-BR') {
    const context = [
      appreciate ? `Comecar pela apreciacao: ${appreciate}.` : '',
      hardThing ? `Nomear o que foi dificil: ${hardThing}.` : '',
      need ? `Apoiar a necessidade: ${need}.` : '',
    ].filter(Boolean).join(' ')
    return {
      title,
      description: `${context} Manter a promessa pequena e especifica: ${promise}. Checar de novo na proxima semana em vez de deixar desaparecer.`,
    }
  }

  const context = [
    appreciate ? `Start from appreciation: ${appreciate}.` : '',
    hardThing ? `Name what felt hard: ${hardThing}.` : '',
    need ? `Support the need: ${need}.` : '',
  ].filter(Boolean).join(' ')

  return {
    title,
    description: `${context} Keep the promise small and specific: ${promise}. Check back next week instead of letting it fade.`,
  }
}
