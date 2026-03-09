import type { getInsightsData } from '~/server/insights'
import { getInsightText, TypeBadge } from '../insights-card'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// --- Health Score Trend Chart ---

function HealthScoreChart({ history }: { history: InsightsData['healthHistory'] }) {
  const width = 600
  const height = 180
  const padL = 0
  const padR = 0
  const padT = 12
  const padB = 28
  const innerW = width - padL - padR
  const innerH = height - padT - padB

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-warm-400">
        Not enough health score data yet
      </div>
    )
  }

  // Zone boundaries
  const zones = [
    { min: 70, max: 100, color: '#10b981', opacity: 0.08 },
    { min: 40, max: 70, color: '#f59e0b', opacity: 0.08 },
    { min: 0, max: 40, color: '#ef4444', opacity: 0.08 },
  ]

  const scores = history.map((h) => Number(h.score))
  const minScore = 0
  const maxScore = 100

  function yPos(val: number) {
    return padT + innerH - ((val - minScore) / (maxScore - minScore)) * innerH
  }
  function xPos(i: number) {
    return padL + (i / (history.length - 1)) * innerW
  }

  const points = scores.map((s, i) => ({ x: xPos(i), y: yPos(s) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`

  // Date labels - show ~5 evenly spaced
  const labelCount = Math.min(5, history.length)
  const labelIndices: number[] = []
  for (let i = 0; i < labelCount; i++) {
    labelIndices.push(Math.round((i / (labelCount - 1)) * (history.length - 1)))
  }

  const gradientId = 'health-area-grad'

  // Current vs previous score for trend
  const currentScore = scores[scores.length - 1]
  const prevScore = scores.length > 1 ? scores[scores.length - 2] : currentScore
  const diff = currentScore - prevScore
  const trendArrow = diff > 2 ? '\u2191' : diff < -2 ? '\u2193' : '\u2192'
  const trendColor = diff > 2 ? 'text-emerald-600' : diff < -2 ? 'text-red-500' : 'text-warm-500'
  const scoreColor = currentScore >= 70 ? 'text-emerald-600' : currentScore >= 40 ? 'text-amber-600' : 'text-red-500'

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className={`text-3xl font-bold ${scoreColor}`}>{currentScore}</span>
        <span className={`text-lg font-medium ${trendColor}`}>{trendArrow}</span>
        <span className="text-sm text-warm-400">Health Score</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C96B4F" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C96B4F" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Background zones */}
        {zones.map((z) => (
          <rect
            key={z.min}
            x={padL}
            y={yPos(z.max)}
            width={innerW}
            height={yPos(z.min) - yPos(z.max)}
            fill={z.color}
            opacity={z.opacity}
            rx={2}
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#C96B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current value dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#C96B4F" />

        {/* X-axis date labels */}
        {labelIndices.map((idx) => {
          const d = new Date(history[idx].recordedAt)
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <text
              key={idx}
              x={xPos(idx)}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#A89888"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// --- Quick Stats Row ---

function QuickStats({
  messageStats,
  sentimentByDay,
  lastAnalyzed,
}: {
  messageStats: InsightsData['messageStats']
  sentimentByDay: InsightsData['sentimentByDay']
  lastAnalyzed: InsightsData['couple']['lastAnalyzed']
}) {
  // Communication streak: consecutive days with messages (from most recent day backwards)
  let streak = 0
  if (sentimentByDay.length > 0) {
    const sorted = [...sentimentByDay].sort((a, b) => b.day.localeCompare(a.day))
    let prevDate: Date | null = null
    for (const entry of sorted) {
      const d = new Date(entry.day)
      if (!prevDate) {
        streak = 1
        prevDate = d
        continue
      }
      const diffDays = Math.round((prevDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        streak++
        prevDate = d
      } else {
        break
      }
    }
  }

  // Days since last analysis
  let daysSinceAnalysis = '--'
  if (lastAnalyzed) {
    const diff = Math.floor(
      (Date.now() - new Date(lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24)
    )
    daysSinceAnalysis = diff === 0 ? 'Today' : diff === 1 ? '1 day' : `${diff} days`
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">
          {messageStats.totalMessages.toLocaleString()}
        </p>
        <p className="text-xs text-warm-400 mt-1">
          Total messages
        </p>
        <p className="text-[10px] text-warm-300 mt-0.5">
          ~{messageStats.dailyAverage}/day
        </p>
      </div>
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-coral-500">{streak}</p>
        <p className="text-xs text-warm-400 mt-1">Day streak</p>
        <p className="text-[10px] text-warm-300 mt-0.5">Consecutive days</p>
      </div>
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">{daysSinceAnalysis}</p>
        <p className="text-xs text-warm-400 mt-1">Last analysis</p>
        <p className="text-[10px] text-warm-300 mt-0.5">AI insights</p>
      </div>
    </div>
  )
}

// --- Recent Insights Feed ---

function RecentInsightsFeed({ insights }: { insights: InsightsData['allInsights'] }) {
  const recent = insights.slice(0, 10)

  if (recent.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-warm-400">
          No insights yet. Keep chatting to generate relationship insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-l-2 border-warm-200 ml-1">
      {recent.map((insight) => {
        const date = new Date(insight.generatedAt)
        const label = formatRelativeDate(date)

        return (
          <div key={insight.id} className="pl-4 ml-2 relative space-y-1">
            <span
              className={`absolute -left-[calc(0.5rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white ${
                insight.severity === 'high'
                  ? 'bg-coral-400'
                  : insight.severity === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-warm-300'
              }`}
            />
            <div className="flex items-center gap-2">
              <TypeBadge type={insight.type} />
              <span className="text-[10px] text-warm-400">{label}</span>
            </div>
            <p className="text-sm text-warm-700 leading-relaxed line-clamp-2">
              {getInsightText(insight.content)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// --- Main Component ---

export function OverviewTab({ data }: { data: InsightsData }) {
  const hasAnyData =
    data.healthHistory.length > 0 ||
    data.allInsights.length > 0 ||
    data.messageStats.totalMessages > 0

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-coral-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-coral-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg text-warm-800 mb-2">
          Your insights will appear here
        </h3>
        <p className="text-sm text-warm-400 max-w-sm mx-auto leading-relaxed">
          Connect WhatsApp and start chatting with your partner. We'll analyze your conversations and
          surface meaningful patterns, health scores, and coaching tips.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Health Score Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">Health Score Trend</h3>
        <HealthScoreChart history={data.healthHistory} />
      </div>

      {/* Quick Stats Row */}
      <QuickStats
        messageStats={data.messageStats}
        sentimentByDay={data.sentimentByDay}
        lastAnalyzed={data.couple.lastAnalyzed}
      />

      {/* Recent Insights Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">Recent Insights</h3>
        <RecentInsightsFeed insights={data.allInsights} />
      </div>
    </div>
  )
}
