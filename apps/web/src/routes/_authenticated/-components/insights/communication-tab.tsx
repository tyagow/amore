import type { getInsightsData } from '~/server/insights'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// --- SVG helpers for half-donut ---

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

// --- Initiation Balance ---

function InitiationBalance({
  senderStats,
  userId,
  partnerName,
}: {
  senderStats: InsightsData['senderStats']
  userId: string
  partnerName: string | undefined
}) {
  const myStats = senderStats.find((s) => s.sender_id === userId)
  const partnerStats = senderStats.find((s) => s.sender_id !== userId)
  const youCount = Number(myStats?.msg_count || 0)
  const partnerCount = Number(partnerStats?.msg_count || 0)
  const total = youCount + partnerCount

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-warm-400">No message data yet</p>
      </div>
    )
  }

  const youPct = Math.round((youCount / total) * 100)
  const partnerPct = 100 - youPct

  const label =
    Math.abs(youPct - 50) <= 10
      ? 'Balanced'
      : youPct > 50
        ? 'You message more'
        : `${partnerName || 'Partner'} messages more`

  const size = 160
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
      >
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Partner arc (background) */}
          <path
            d={describeArc(0, 0, radius, 180, 360)}
            fill="none"
            stroke="#E8DFD5"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* You arc (foreground) */}
          <path
            d={describeArc(0, 0, radius, 180, 180 + (youPct / 100) * 180)}
            fill="none"
            stroke="#C96B4F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </g>
        {/* Percentage in center */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill="#3D3228"
        >
          {youPct}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 8}
          textAnchor="middle"
          fontSize="10"
          fill="#A89888"
        >
          you
        </text>
      </svg>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-coral-400 inline-block" />
          <span className="text-warm-600">
            You {youPct}%
          </span>
          <span className="text-warm-300 text-xs">({youCount.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-warm-200 inline-block" />
          <span className="text-warm-600">
            {partnerName || 'Partner'} {partnerPct}%
          </span>
          <span className="text-warm-300 text-xs">({partnerCount.toLocaleString()})</span>
        </div>
      </div>

      <p className="text-sm font-medium text-warm-600">{label}</p>
    </div>
  )
}

// --- Message Volume Bar Chart ---

function MessageVolumeChart({
  sentimentByDay,
}: {
  sentimentByDay: InsightsData['sentimentByDay']
}) {
  // Show last 14 days
  const days = sentimentByDay.slice(-14)

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-warm-400">No daily message data yet</p>
      </div>
    )
  }

  const maxCount = Math.max(...days.map((d) => Number(d.msg_count)), 1)
  const chartHeight = 120
  const labelH = 20
  const svgH = chartHeight + labelH

  return (
    <svg width="100%" viewBox={`0 0 ${days.length * 32} ${svgH}`} preserveAspectRatio="none">
      {days.map((d, i) => {
        const count = Number(d.msg_count)
        const barH = (count / maxCount) * chartHeight
        const x = i * 32
        const date = new Date(d.day)
        const label = date.toLocaleDateString('en-US', { day: 'numeric' })
        // Show month abbreviation on first bar and when month changes
        const showMonth =
          i === 0 ||
          new Date(days[i - 1].day).getMonth() !== date.getMonth()

        return (
          <g key={d.day}>
            {/* Bar */}
            <rect
              x={x + 4}
              y={chartHeight - barH}
              width={24}
              height={Math.max(barH, 1)}
              rx={4}
              fill="#E8845A"
              opacity={0.7}
            />
            {/* Count label on top of bar */}
            {count > 0 && (
              <text
                x={x + 16}
                y={chartHeight - barH - 4}
                textAnchor="middle"
                fontSize="8"
                fill="#A89888"
              >
                {count}
              </text>
            )}
            {/* Date label */}
            <text
              x={x + 16}
              y={chartHeight + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#A89888"
            >
              {showMonth
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// --- Active Hours Heatmap ---

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = ['12am', '6am', '12pm', '6pm']

function ActiveHoursHeatmap({
  hourlyActivity,
}: {
  hourlyActivity: InsightsData['hourlyActivity']
}) {
  if (hourlyActivity.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-warm-400">No activity data yet</p>
      </div>
    )
  }

  // Build 7x24 matrix
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  let maxCount = 0
  for (const entry of hourlyActivity) {
    const dow = Number(entry.dow)
    const hour = Number(entry.hour)
    const count = Number(entry.count)
    if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) {
      matrix[dow][hour] = count
      if (count > maxCount) maxCount = count
    }
  }

  function getColor(count: number): string {
    if (count === 0) return '#FAF5F0' // warm-50-ish
    const ratio = count / maxCount
    if (ratio < 0.25) return '#EDE5DB' // warm-200
    if (ratio < 0.5) return '#EBB9A7' // coral-200
    if (ratio < 0.75) return '#E8845A' // coral-400
    return '#C96B4F' // coral-600
  }

  const cellW = 18
  const cellH = 18
  const gap = 2
  const labelW = 32
  const labelH = 16
  const svgW = labelW + 24 * (cellW + gap)
  const svgH = labelH + 7 * (cellH + gap)

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* Hour labels (every 6 hours) */}
      {[0, 6, 12, 18].map((h, idx) => (
        <text
          key={h}
          x={labelW + h * (cellW + gap) + cellW / 2}
          y={10}
          textAnchor="middle"
          fontSize="8"
          fill="#A89888"
        >
          {HOUR_LABELS[idx]}
        </text>
      ))}

      {/* Grid */}
      {matrix.map((row, dow) => (
        <g key={dow}>
          {/* Day label */}
          <text
            x={0}
            y={labelH + dow * (cellH + gap) + cellH / 2 + 3}
            fontSize="8"
            fill="#A89888"
          >
            {DOW_LABELS[dow]}
          </text>
          {/* Hour cells */}
          {row.map((count, hour) => (
            <rect
              key={hour}
              x={labelW + hour * (cellW + gap)}
              y={labelH + dow * (cellH + gap)}
              width={cellW}
              height={cellH}
              rx={3}
              fill={getColor(count)}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

// --- Message Length Stats ---

function MessageLengthStats({
  senderStats,
  userId,
  partnerName,
}: {
  senderStats: InsightsData['senderStats']
  userId: string
  partnerName: string | undefined
}) {
  const myStats = senderStats.find((s) => s.sender_id === userId)
  const partnerStats = senderStats.find((s) => s.sender_id !== userId)

  const myAvg = Math.round(Number(myStats?.avg_length || 0))
  const partnerAvg = Math.round(Number(partnerStats?.avg_length || 0))

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">{myAvg}</p>
        <p className="text-xs text-warm-400 mt-1">Your avg. length</p>
        <p className="text-[10px] text-warm-300 mt-0.5">characters/message</p>
      </div>
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">{partnerAvg}</p>
        <p className="text-xs text-warm-400 mt-1">{partnerName || 'Partner'}'s avg.</p>
        <p className="text-[10px] text-warm-300 mt-0.5">characters/message</p>
      </div>
    </div>
  )
}

// --- Main Component ---

export function CommunicationTab({ data }: { data: InsightsData }) {
  const hasSenderStats = data.senderStats.length > 0
  const hasActivity = data.hourlyActivity.length > 0
  const hasSentiment = data.sentimentByDay.length > 0
  const hasAnyData = hasSenderStats || hasActivity || hasSentiment

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-sage-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg text-warm-800 mb-2">
          Communication insights coming soon
        </h3>
        <p className="text-sm text-warm-400 max-w-sm mx-auto leading-relaxed">
          Keep chatting with your partner on WhatsApp. Once we have enough messages, detailed
          communication analytics will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Initiation Balance */}
      {hasSenderStats && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Message Balance</h3>
          <InitiationBalance
            senderStats={data.senderStats}
            userId={data.userId}
            partnerName={data.partner?.name ?? undefined}
          />
        </div>
      )}

      {/* Message Volume Over Time */}
      {hasSentiment && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Daily Message Volume</h3>
          <p className="text-xs text-warm-400 mb-3">Last 14 days</p>
          <MessageVolumeChart sentimentByDay={data.sentimentByDay} />
        </div>
      )}

      {/* Active Hours Heatmap */}
      {hasActivity && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Active Hours</h3>
          <p className="text-xs text-warm-400 mb-3">When you chat the most</p>
          <div className="overflow-x-auto">
            <ActiveHoursHeatmap hourlyActivity={data.hourlyActivity} />
          </div>
        </div>
      )}

      {/* Message Length Stats */}
      {hasSenderStats && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Message Length</h3>
          <MessageLengthStats
            senderStats={data.senderStats}
            userId={data.userId}
            partnerName={data.partner?.name ?? undefined}
          />
        </div>
      )}
    </div>
  )
}
