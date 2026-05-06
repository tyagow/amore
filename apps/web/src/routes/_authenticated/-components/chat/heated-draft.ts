const BLAME_PATTERNS = [
  /\byou\s+never\b/i,
  /\byou\s+always\b/i,
  /\byou\s+don'?t\s+care\b/i,
  /\bwhy\s+do\s+you\s+always\b/i,
]

const CONTEMPT_PATTERNS = [
  /\bridiculous\b/i,
  /\bselfish\b/i,
  /\bchildish\b/i,
  /\bpathetic\b/i,
]

const FINAL_THREAT_PATTERNS = [
  /\bi'?m\s+done\b/i,
  /\bi\s+am\s+done\b/i,
  /\bwe'?re\s+done\b/i,
  /\bthis\s+is\s+over\b/i,
  /\bi\s+want\s+(a\s+)?divorce\b/i,
  /\bi\s+want\s+to\s+break\s+up\b/i,
]

export interface HeatedDraftWarning {
  title: string
  body: string
  recommendedAction: 'pause' | 'soften'
  recommendedLabel: string
}

export function getHeatedDraftWarning(text: string): HeatedDraftWarning | null {
  const draft = text.trim()
  if (!draft) return null

  if (FINAL_THREAT_PATTERNS.some((pattern) => pattern.test(draft))) {
    return {
      title: 'This sounds final while activated',
      body: 'Relationship-ending language can be hard to take back. If you are flooded, send a pause with a return time before deciding what you mean.',
      recommendedAction: 'pause',
      recommendedLabel: 'Use pause instead',
    }
  }

  if (CONTEMPT_PATTERNS.some((pattern) => pattern.test(draft))) {
    return {
      title: 'This may land as contempt',
      body: 'Name the hurt without labeling your partner. A softer start or space request is more likely to keep repair possible.',
      recommendedAction: 'soften',
      recommendedLabel: 'Use softer version',
    }
  }

  if (BLAME_PATTERNS.some((pattern) => pattern.test(draft))) {
    return {
      title: 'This may land as blame',
      body: 'Try naming the feeling and one specific event instead of a global pattern. That gives your partner something they can respond to.',
      recommendedAction: 'soften',
      recommendedLabel: 'Use softer version',
    }
  }

  if (draft.length > 700) {
    return {
      title: 'This is a lot to receive at once',
      body: 'Consider sending the core point first, then asking if they can keep talking. Shorter repair attempts are easier to answer.',
      recommendedAction: 'soften',
      recommendedLabel: 'Use shorter start',
    }
  }

  return null
}
