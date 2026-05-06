import { Link } from '@tanstack/react-router'
import { getDashboardInsightAction } from './insight-action-draft'
import { getInsightText } from './insight-text'
import { formatTimeAgo } from '~/lib/format'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

interface Insight {
  id: string
  type: string
  content: unknown
  severity: string | null
  generatedAt: string | Date
}

interface InsightsCardProps {
  insights: Insight[]
  partnerName?: string | null
}

const TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  health_score: { label: 'Health Score', bg: 'bg-coral-50', text: 'text-coral-700' },
  communication_pattern: { label: 'Communication', bg: 'bg-blue-50', text: 'text-blue-700' },
  love_language: { label: 'Love Language', bg: 'bg-pink-50', text: 'text-pink-700' },
  coaching_tip: { label: 'Coaching', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  conflict_alert: { label: 'Conflict', bg: 'bg-red-50', text: 'text-red-700' },
  goal_suggestion: { label: 'Goal', bg: 'bg-violet-50', text: 'text-violet-700' },
  sentiment_trend: { label: 'Sentiment', bg: 'bg-amber-50', text: 'text-amber-700' },
  wish: { label: 'Wish', bg: 'bg-rose-50', text: 'text-rose-700' },
  important_date: { label: 'Date', bg: 'bg-indigo-50', text: 'text-indigo-700' },
}

const TYPE_PRIORITY: Record<string, number> = {
  health_score: 0,
  conflict_alert: 1,
  coaching_tip: 2,
  goal_suggestion: 3,
  communication_pattern: 4,
  sentiment_trend: 5,
  wish: 6,
  important_date: 7,
  love_language: 8,
}

export function TypeBadge({ type }: { type: string }) {
  const { t } = useI18n()
  const style = TYPE_STYLES[type] ?? {
    label: type.replace(/_/g, ' '),
    bg: 'bg-warm-100',
    text: 'text-warm-600',
  }

  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${style.bg} ${style.text}`}
    >
      {t(style.label)}
    </span>
  )
}

export function InsightsCard({ insights, partnerName }: InsightsCardProps) {
  const { locale, t } = useI18n()
  const safePartnerName = partnerName ?? (locale === 'pt-BR' ? 'voce' : 'you')
  const visibleInsights = [...insights]
    .sort((a, b) => (TYPE_PRIORITY[a.type] ?? 10) - (TYPE_PRIORITY[b.type] ?? 10))
    .slice(0, 6)
  const hiddenCount = Math.max(0, insights.length - visibleInsights.length)

  return (
    <div className="bg-gradient-to-br from-lavender-50 to-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base text-warm-800">{t('Insights')}</h3>
          <p className="mt-0.5 text-xs text-warm-500">{t('The signals worth acting on first.')}</p>
        </div>
        {insights.length > 0 && (
          <Link
            to="/insights"
            search={{ tab: 'overview' }}
            className="shrink-0 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-lavender-500 transition-colors hover:bg-white"
          >
            {t('View all')}
          </Link>
        )}
      </div>

      {insights.length > 0 ? (
        <div className="space-y-4 border-l-2 border-warm-200">
          {visibleInsights.map((insight) => {
            const action = getDashboardInsightAction({
              type: insight.type,
              content: insight.content,
              partnerName: safePartnerName,
              locale,
            })

            return (
              <div key={insight.id} className="pl-4 ml-2 relative space-y-1.5">
                <span className={`absolute -left-[calc(0.5rem+5px)] top-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  insight.severity === 'high' ? 'bg-coral-400' :
                  insight.severity === 'medium' ? 'bg-amber-400' :
                  'bg-warm-300'
                }`} />
                <div className="flex items-center gap-2">
                  <TypeBadge type={insight.type} />
                  <span className="text-[10px] text-warm-400">
                    {formatTimeAgo(insight.generatedAt, locale)}
                  </span>
                </div>
                <p className="text-sm text-warm-700 leading-relaxed line-clamp-2">
                  {getInsightText(insight.content, locale)}
                </p>
                {action && (
                  <Link
                    to={action.to}
                    onClick={() => {
                      if (action.storageKey === 'amore-chat-draft') {
                        storeChatDraft(action.draft, locale)
                        return
                      }

                      storeGoalDraft(action.draft, locale)
                    }}
                    className="inline-flex rounded-full bg-coral-50 px-3 py-1.5 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-100"
                  >
                    {t(action.label)}
                  </Link>
                )}
              </div>
            )
          })}
          {hiddenCount > 0 && (
            <div className="pl-4 ml-2 text-xs font-medium text-warm-500">
              {locale === 'pt-BR'
                ? `${hiddenCount} insight${hiddenCount === 1 ? '' : 's'} a mais esperando na pagina completa.`
                : `${hiddenCount} more insight${hiddenCount === 1 ? '' : 's'} waiting on the full page.`}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-warm-400">
            {t('Connect WhatsApp to get relationship insights')}
          </p>
        </div>
      )}
    </div>
  )
}
