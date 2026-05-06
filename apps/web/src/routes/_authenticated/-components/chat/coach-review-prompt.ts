export function buildCoachReviewPrompt(text: string) {
  const draft = text.trim()

  if (!draft) {
    return 'Help me write a message that is honest, kind, and specific. I want to reduce defensiveness, name one real moment, include warmth, leave room for no or later, and make repair easier.'
  }

  return `Help me improve this message before I send it.\n\nDraft:\n${limitDraft(draft)}\n\nPlease help me keep the truth, lower defensiveness, name one real moment, include warmth, leave room for no or later, and make the request clear.`
}

function limitDraft(value: string) {
  const compact = value.replace(/\n{3,}/g, '\n\n').trim()

  if (compact.length <= 600) return compact

  return `${compact.slice(0, 597).trim()}...`
}
