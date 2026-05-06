const PATTERN_LABELS: Record<string, string> = {
  avgResponseMinutes: 'Average response time',
  avgLengthBySender: 'Message depth by person',
  initiationBalance: 'Who starts conversations',
  messageCountBySender: 'Conversation share',
}

const PATTERN_LABELS_PT_BR: Record<string, string> = {
  avgResponseMinutes: 'Tempo medio de resposta',
  avgLengthBySender: 'Profundidade das mensagens por pessoa',
  initiationBalance: 'Quem inicia as conversas',
  messageCountBySender: 'Participacao na conversa',
}

const LOVE_LANGUAGE_LABELS: Record<string, string> = {
  acts_of_service: 'Acts of service',
  physical_touch: 'Physical touch',
  quality_time: 'Quality time',
  words_of_affirmation: 'Words of affirmation',
  receiving_gifts: 'Receiving gifts',
}

const LOVE_LANGUAGE_LABELS_PT_BR: Record<string, string> = {
  acts_of_service: 'Atos de servico',
  physical_touch: 'Toque fisico',
  quality_time: 'Tempo de qualidade',
  words_of_affirmation: 'Palavras de afirmacao',
  receiving_gifts: 'Presentes',
}

type InsightLocale = 'en' | 'pt-BR'

function humanizeKey(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
}

function sentenceCase(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getInsightText(content: unknown, locale: InsightLocale = 'en'): string {
  if (typeof content === 'string') {
    return locale === 'pt-BR' ? legacyPortugueseFallback(content) : content
  }
  if (!content || typeof content !== 'object') {
    return locale === 'pt-BR' ? 'Novo insight disponivel' : 'New insight available'
  }

  const c = content as Record<string, unknown>
  const legacyText = c.tip ?? c.text ?? c.summary ?? c.title ?? c.message ?? c.description
  if (legacyText) {
    return locale === 'pt-BR' ? legacyPortugueseFallback(String(legacyText), c) : String(legacyText)
  }

  if (c.language) {
    const language = String(c.language)
    const label =
      locale === 'pt-BR'
        ? (LOVE_LANGUAGE_LABELS_PT_BR[language] ?? sentenceCase(humanizeKey(language)))
        : (LOVE_LANGUAGE_LABELS[language] ?? sentenceCase(humanizeKey(language)))
    const confidence = Math.round(Number(c.confidence || 0) * 100)
    if (confidence <= 0) return label
    return locale === 'pt-BR' ? `${label} (${confidence}% sinal)` : `${label} (${confidence}% signal)`
  }

  if (c.pattern) {
    const pattern = String(c.pattern)
    return locale === 'pt-BR'
      ? (PATTERN_LABELS_PT_BR[pattern] ?? sentenceCase(humanizeKey(pattern)))
      : (PATTERN_LABELS[pattern] ?? sentenceCase(humanizeKey(pattern)))
  }

  return locale === 'pt-BR' ? 'Novo insight disponivel' : 'New insight available'
}

function legacyPortugueseFallback(text: string, content?: Record<string, unknown>): string {
  if (!looksEnglish(text)) return text

  if (content?.score != null || /health score|relationship score/i.test(text)) {
    return 'A pontuacao do relacionamento sugere um ponto de cuidado. Use este insight para escolher uma conversa pequena, concreta e acolhedora.'
  }

  if (content?.language || /quality time|acts of service|words of affirmation|physical touch|receiving gifts/i.test(text)) {
    return 'Ha um sinal de linguagem de amor para transformar em um gesto pequeno e especifico hoje.'
  }

  if (
    content?.pattern ||
    /conversational load|response time|message depth|starts conversations|conversation share|communication/i.test(text)
  ) {
    return 'Ha um padrao de comunicacao que vale conversar com calma, sem transformar o dado em culpa.'
  }

  if (/coach|challenge|try|question|responding|conversation/i.test(text)) {
    return 'Ha uma sugestao de coaching salva. Rode uma nova analise em portugues para receber uma versao completa no idioma atual.'
  }

  return 'Insight antigo salvo em outro idioma. Rode uma nova analise em portugues para atualizar este conteudo.'
}

function looksEnglish(text: string) {
  if (/[ãõáàâêéíóôúç]/i.test(text)) return false
  return /\b(the|and|you|your|with|conversation|relationship|partner|message|messages|score|signal|this|that|what|when|where|how)\b/i.test(text)
}
