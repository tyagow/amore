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
  'communication pattern': {
    label: 'Communication',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  'love language': {
    label: 'Love Language',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
  },
  'coaching tip': {
    label: 'Coaching Tip',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  conflict: {
    label: 'Conflict',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
  pattern: {
    label: 'Pattern',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
}

function getInsightText(content: unknown): string {
  if (typeof content === 'string') return content
  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text: string }).text)
  }
  if (content && typeof content === 'object' && 'summary' in content) {
    return String((content as { summary: string }).summary)
  }
  return 'New insight available'
}

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] ?? {
    label: type,
    bg: 'bg-stone-100',
    text: 'text-stone-600',
  }

  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
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
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
        Insights
      </h3>

      {insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TypeBadge type={insight.type} />
                <span className="text-[10px] text-stone-400">
                  {formatDate(insight.generatedAt)}
                </span>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed line-clamp-2">
                {getInsightText(insight.content)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-stone-400">
            Connect WhatsApp to get relationship insights
          </p>
        </div>
      )}
    </div>
  )
}
