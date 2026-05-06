import { useI18n } from '~/lib/i18n'

interface SentimentPoint {
  day: string
  avg_sentiment: number
}

interface SentimentSparklineProps {
  data: SentimentPoint[]
  width?: number
  height?: number
  className?: string
}

export function SentimentSparkline({
  data,
  width = 100,
  height = 40,
  className,
}: SentimentSparklineProps) {
  const { t } = useI18n()
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className={className}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="10" fill="#A89888">
          {t('Not enough data')}
        </text>
      </svg>
    )
  }

  const padding = 2
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  // Normalize sentiment values (typically -1 to 1) to pixel coordinates
  const minVal = Math.min(...data.map((d) => d.avg_sentiment))
  const maxVal = Math.max(...data.map((d) => d.avg_sentiment))
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * innerW
    const y = padding + innerH - ((d.avg_sentiment - minVal) / range) * innerH
    return { x, y }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Build area fill path (polyline + bottom edge)
  const areaPath = [
    `M ${points[0].x},${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${height}`,
    `L ${points[0].x},${height}`,
    'Z',
  ].join(' ')

  // Color based on average sentiment
  const avg = data.reduce((sum, d) => sum + d.avg_sentiment, 0) / data.length
  const strokeColor = avg > 0.2 ? '#6B9B6B' : avg < -0.2 ? '#E8845A' : '#A89888'
  const fillColor = avg > 0.2 ? '#6B9B6B' : avg < -0.2 ? '#E8845A' : '#A89888'

  const gradientId = `sparkline-fill-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg width={width} height={height} className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
      />
    </svg>
  )
}
