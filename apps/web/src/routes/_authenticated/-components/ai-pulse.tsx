import { formatTimeAgo } from '~/lib/format'
import { useI18n } from '~/lib/i18n'

interface AIPulseProps {
  lastAnalyzed: string | Date | null
  messagesSinceAnalysis: number | null
}

export function AIPulse({ lastAnalyzed, messagesSinceAnalysis }: AIPulseProps) {
  const { locale, t } = useI18n()
  const analyzedText = lastAnalyzed ? formatTimeAgo(lastAnalyzed, locale) : null

  return (
    <div className="flex items-center gap-2 text-xs text-warm-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-coral-500" />
      </span>
      <span>
        {t('AI active')}
        {analyzedText && <> &middot; {locale === 'pt-BR' ? 'analisado' : 'analyzed'} {analyzedText}</>}
        {messagesSinceAnalysis != null && messagesSinceAnalysis > 0 && (
          <> &middot; {messagesSinceAnalysis} {t('new messages')}</>
        )}
      </span>
    </div>
  )
}
