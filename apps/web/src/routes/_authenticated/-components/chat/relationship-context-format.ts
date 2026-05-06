import { translateText, type Locale } from '~/lib/i18n'

export function formatRelationshipLabel(value: string, locale: Locale = 'en') {
  const label = value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase())

  return translateText(label, locale)
}

export function getInterestLabel(interest: unknown): string {
  if (typeof interest === 'string') {
    const trimmed = interest.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>
        return String(parsed.topic ?? parsed.title ?? parsed.name ?? parsed.label ?? 'Shared interest')
      } catch {
        return interest
      }
    }
    return interest
  }

  if (!interest || typeof interest !== 'object') return String(interest)

  const record = interest as Record<string, unknown>
  return String(record.topic ?? record.title ?? record.name ?? record.label ?? 'Shared interest')
}
