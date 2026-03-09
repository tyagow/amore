interface Insight {
  id: string
  type: string
  content: unknown
  severity: string | null
  generatedAt: string | Date
}

interface InsightsCardProps {
  insights: Insight[]
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

export function getInsightText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!content || typeof content !== 'object') return 'New insight available'
  const c = content as Record<string, unknown>
  if (c.tip) return String(c.tip)
  if (c.text) return String(c.text)
  if (c.summary) return String(c.summary)
  if (c.title) return String(c.title)
  if (c.message) return String(c.message)
  if (c.language) return `${c.language} (${Math.round(Number(c.confidence || 0) * 100)}%)`
  if (c.pattern) return `${String(c.pattern).replace(/_/g, ' ')}`
  if (c.description) return String(c.description)
  return 'New insight available'
}

export function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] ?? {
    label: type.replace(/_/g, ' '),
    bg: 'bg-warm-100',
    text: 'text-warm-600',
  }

  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  )
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="bg-gradient-to-br from-lavender-50 to-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <h3 className="font-display text-base text-warm-800 mb-4">
        Insights
      </h3>

      {insights.length > 0 ? (
        <div className="space-y-4 border-l-2 border-warm-200">
          {insights.map((insight) => (
            <div key={insight.id} className="pl-4 ml-2 relative space-y-1.5">
              <span className={`absolute -left-[calc(0.5rem+5px)] top-1 w-2 h-2 rounded-full flex-shrink-0 ${
                insight.severity === 'high' ? 'bg-coral-400' :
                insight.severity === 'medium' ? 'bg-amber-400' :
                'bg-warm-300'
              }`} />
              <div className="flex items-center gap-2">
                <TypeBadge type={insight.type} />
                <span className="text-[10px] text-warm-400">
                  {formatDate(insight.generatedAt)}
                </span>
              </div>
              <p className="text-sm text-warm-700 leading-relaxed line-clamp-2">
                {getInsightText(insight.content)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-warm-400">
            Connect WhatsApp to get relationship insights
          </p>
        </div>
      )}
    </div>
  )
}
