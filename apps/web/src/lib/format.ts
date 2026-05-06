export function formatTimeAgo(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (locale === 'pt-BR') {
    if (diffH < 1) return 'agora mesmo'
    if (diffH < 24) return `ha ${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1) return 'ontem'
    return `ha ${diffD}d`
  }
  if (diffH < 1) return 'just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'yesterday'
  return `${diffD}d ago`
}
