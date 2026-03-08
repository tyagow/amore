import { formatTimeAgo } from '~/lib/format'

interface HealthRingProps {
  score: number | null
  lastAnalyzed?: string | Date | null
  messagesSinceAnalysis?: number | null
  size?: number
}

export function HealthRing({ score, lastAnalyzed, messagesSinceAnalysis, size: sizeProp }: HealthRingProps) {
  const size = sizeProp ?? 200
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = score != null ? (score / 100) * circumference : 0
  const offset = circumference - progress

  const gradientId = score == null ? 'gray' : score > 70 ? 'green' : score > 40 ? 'amber' : 'red'

  const gradientColors: Record<string, [string, string]> = {
    gray: ['#d6d3d1', '#a8a29e'],
    green: ['#10b981', '#34d399'],
    amber: ['#f59e0b', '#fbbf24'],
    red: ['#ef4444', '#f87171'],
  }

  const [c1, c2] = gradientColors[gradientId]

  const freshnessText = lastAnalyzed
    ? `Analyzed ${formatTimeAgo(lastAnalyzed)}${messagesSinceAnalysis ? ` \u00B7 ${messagesSinceAnalysis} new messages` : ''}`
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <defs>
            <linearGradient id={`ring-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
            className="stroke-warm-200" />

          {/* Progress circle */}
          {score != null && (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
              strokeWidth={strokeWidth} strokeLinecap="round"
              stroke={`url(#ring-${gradientId})`}
              strokeDasharray={circumference} strokeDashoffset={offset}
              filter="url(#ring-glow)"
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score != null ? (
            <>
              <span className={`font-display ${size >= 200 ? 'text-5xl' : 'text-3xl'}`} style={{ color: c1 }}>{score}</span>
              <span className="text-xs text-warm-400 uppercase tracking-wide">Health</span>
            </>
          ) : (
            <span className="text-sm text-warm-400 text-center px-4">No data yet</span>
          )}
        </div>
      </div>

      <p className="text-sm text-warm-500">
        {score == null
          ? 'Connect WhatsApp to get your score'
          : score > 70
            ? 'Your relationship is thriving'
            : score > 40
              ? 'Room for growth'
              : 'Needs attention'}
      </p>

      {freshnessText && (
        <p className="text-xs text-warm-400">{freshnessText}</p>
      )}
    </div>
  )
}

