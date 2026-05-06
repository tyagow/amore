export type AILocale = 'en' | 'pt-BR'

export function normalizeAILocale(value: unknown): AILocale {
  return value === 'pt-BR' || value === 'pt_BR' || value === 'pt' || value === 'pt-br'
    ? 'pt-BR'
    : 'en'
}

export function getAILocaleInstruction(locale: AILocale = 'en'): string {
  return locale === 'pt-BR'
    ? '\n\nLanguage: respond in Brazilian Portuguese (pt-BR). Keep relationship terms natural for Brazil. Preserve names, quoted user messages, JSON keys, enum values, IDs, timestamps, and source data exactly as provided.'
    : '\n\nLanguage: respond in English.'
}

export function localized(locale: AILocale, english: string, ptBR: string): string {
  return locale === 'pt-BR' ? ptBR : english
}
