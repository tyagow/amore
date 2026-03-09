import { useMemo } from 'react'
import type { getInsightsData } from '~/server/insights'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// ── helpers ──────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function sentimentColor(avg: number) {
  if (avg > 0.2) return '#6B9B6B' // green / sage
  if (avg < -0.2) return '#E8845A' // coral
  return '#A89888' // warm neutral
}

function sentimentLabel(avg: number) {
  if (avg > 0.5) return 'Very positive'
  if (avg > 0.2) return 'Positive'
  if (avg > -0.2) return 'Neutral'
  if (avg > -0.5) return 'Negative'
  return 'Very negative'
}

const moodColors: Record<string, string> = {
  great: '#34D399', // emerald-400
  good: '#8BAA8B', // sage-400
  neutral: '#A89888', // warm-400
  low: '#FBBF24', // amber-400
  struggling: '#F87171', // red-400
}

function moodColor(mood: string) {
  return moodColors[mood.toLowerCase()] ?? '#A89888'
}

// ── Sentiment Area Chart ─────────────────────────────────────────────────

function SentimentChart({
  data,
}: {
  data: Array<{ day: string; avg_sentiment: number; msg_count: number }>
}) {
  const width = 600
  const height = 200
  const padX = 40
  const padTop = 20
  const padBottom = 30
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom

  const { points, areaPath, linePath, bestIdx, worstIdx, avg, xLabels } =
    useMemo(() => {
      const vals = data.map((d) => Number(d.avg_sentiment))
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const range = max - min || 1

      const pts = data.map((d, i) => ({
        x: padX + (i / (data.length - 1)) * innerW,
        y: padTop + innerH - ((Number(d.avg_sentiment) - min) / range) * innerH,
      }))

      let bIdx = 0
      let wIdx = 0
      vals.forEach((v, i) => {
        if (v > vals[bIdx]) bIdx = i
        if (v < vals[wIdx]) wIdx = i
      })

      const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
      const areaD = [
        lineD,
        `L ${pts[pts.length - 1].x},${padTop + innerH}`,
        `L ${pts[0].x},${padTop + innerH}`,
        'Z',
      ].join(' ')

      const labelInterval = Math.max(1, Math.floor(data.length / 6))
      const labels = data
        .map((d, i) => ({ label: formatDate(d.day), x: pts[i].x, show: i % labelInterval === 0 || i === data.length - 1 }))
        .filter((l) => l.show)

      const a = vals.reduce((s, v) => s + v, 0) / vals.length

      return { points: pts, areaPath: areaD, linePath: lineD, bestIdx: bIdx, worstIdx: wIdx, avg: a, xLabels: labels }
    }, [data, innerW, innerH])

  const color = sentimentColor(avg)
  const gradientId = 'sentiment-area-grad'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 200 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* zero line */}
      <line
        x1={padX}
        y1={padTop + innerH / 2}
        x2={padX + innerW}
        y2={padTop + innerH / 2}
        stroke="#E5DDD5"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      {/* area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* best day dot + label */}
      <circle cx={points[bestIdx].x} cy={points[bestIdx].y} r="5" fill="#6B9B6B" stroke="white" strokeWidth="2" />
      <text
        x={points[bestIdx].x}
        y={points[bestIdx].y - 10}
        textAnchor="middle"
        fontSize="9"
        fill="#6B9B6B"
        fontWeight="600"
      >
        Best
      </text>

      {/* worst day dot + label */}
      <circle cx={points[worstIdx].x} cy={points[worstIdx].y} r="5" fill="#E8845A" stroke="white" strokeWidth="2" />
      <text
        x={points[worstIdx].x}
        y={points[worstIdx].y + 16}
        textAnchor="middle"
        fontSize="9"
        fill="#E8845A"
        fontWeight="600"
      >
        Worst
      </text>

      {/* x-axis labels */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={height - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#A89888"
        >
          {l.label}
        </text>
      ))}
    </svg>
  )
}

// ── Mood Timeline ────────────────────────────────────────────────────────

function MoodTimeline({
  moods,
  userId,
  partnerName,
}: {
  moods: InsightsData['moodHistory']
  userId: string
  partnerName: string
}) {
  const myMoods = moods.filter((m) => m.userId === userId).reverse()
  const partnerMoods = moods.filter((m) => m.userId !== userId).reverse()

  const Track = ({
    label,
    items,
  }: {
    label: string
    items: typeof moods
  }) => (
    <div>
      <p className="text-xs font-medium text-warm-500 mb-2">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-warm-300 italic">No mood data</p>
      ) : (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {items.map((m) => (
            <div key={m.id} className="flex flex-col items-center flex-shrink-0" title={`${m.mood} — ${formatDate(String(m.createdAt))}`}>
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: moodColor(m.mood) }}
              />
              <span className="text-[8px] text-warm-400 mt-0.5 capitalize leading-none">{m.mood}</span>
              <span className="text-[7px] text-warm-300 leading-none">
                {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Track label="You" items={myMoods} />
      <Track label={partnerName} items={partnerMoods} />
    </div>
  )
}

// ── Best / Worst day cards ───────────────────────────────────────────────

function BestWorstCards({
  data,
}: {
  data: Array<{ day: string; avg_sentiment: number; msg_count: number }>
}) {
  const best = data.reduce((a, b) => (Number(b.avg_sentiment) > Number(a.avg_sentiment) ? b : a), data[0])
  const worst = data.reduce((a, b) => (Number(b.avg_sentiment) < Number(a.avg_sentiment) ? b : a), data[0])

  const Card = ({
    label,
    day,
    accent,
    bg,
  }: {
    label: string
    day: typeof best
    accent: string
    bg: string
  }) => (
    <div className={`flex-1 rounded-xl p-4 ${bg}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>{label}</p>
      <p className="font-display text-lg text-warm-900 mt-1">{formatDate(day.day)}</p>
      <p className="text-xs text-warm-500 mt-0.5">
        {sentimentLabel(Number(day.avg_sentiment))} &middot; {Number(day.avg_sentiment).toFixed(2)} &middot;{' '}
        {Number(day.msg_count)} messages
      </p>
    </div>
  )

  return (
    <div className="flex gap-3">
      <Card label="Best day" day={best} accent="text-emerald-600" bg="bg-emerald-50" />
      <Card label="Worst day" day={worst} accent="text-coral-600" bg="bg-coral-50" />
    </div>
  )
}

// ── Emotional Balance bar ────────────────────────────────────────────────

function EmotionalBalance({
  data,
}: {
  data: Array<{ day: string; avg_sentiment: number; msg_count: number }>
}) {
  const total = data.length
  const positive = data.filter((d) => Number(d.avg_sentiment) > 0.2).length
  const negative = data.filter((d) => Number(d.avg_sentiment) < -0.2).length
  const neutral = total - positive - negative

  const pct = (n: number) => Math.round((n / total) * 100)

  return (
    <div>
      {/* bar */}
      <div className="flex h-4 rounded-full overflow-hidden">
        {positive > 0 && (
          <div className="bg-emerald-400" style={{ width: `${pct(positive)}%` }} />
        )}
        {neutral > 0 && (
          <div className="bg-warm-300" style={{ width: `${pct(neutral)}%` }} />
        )}
        {negative > 0 && (
          <div className="bg-coral-400" style={{ width: `${pct(negative)}%` }} />
        )}
      </div>
      {/* legend */}
      <div className="flex gap-4 mt-2 text-xs text-warm-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          Positive {pct(positive)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warm-300 inline-block" />
          Neutral {pct(neutral)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-coral-400 inline-block" />
          Negative {pct(negative)}%
        </span>
      </div>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warm-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-warm-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <p className="text-sm text-warm-400">{message}</p>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export function EmotionsTab({ data }: { data: InsightsData }) {
  const hasSentiment = data.sentimentByDay.length >= 2
  const hasMoods = data.moodHistory.length > 0

  if (!hasSentiment && !hasMoods) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <EmptyState message="No emotion data yet. Keep chatting — sentiment and mood tracking will appear here as your conversations are analyzed." />
        </div>
      </div>
    )
  }

  const partnerName = data.partner?.name ?? 'Partner'

  return (
    <div className="space-y-6">
      {/* Sentiment Trend Chart */}
      {hasSentiment && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Sentiment Trend</h3>
          <SentimentChart data={data.sentimentByDay} />
        </div>
      )}

      {/* Mood Timeline */}
      {hasMoods && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Mood Timeline</h3>
          <MoodTimeline moods={data.moodHistory} userId={data.userId} partnerName={partnerName} />
        </div>
      )}

      {/* Best & Worst Days */}
      {hasSentiment && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Best &amp; Worst Days</h3>
          <BestWorstCards data={data.sentimentByDay} />
        </div>
      )}

      {/* Emotional Balance */}
      {hasSentiment && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Emotional Balance</h3>
          <EmotionalBalance data={data.sentimentByDay} />
        </div>
      )}
    </div>
  )
}
