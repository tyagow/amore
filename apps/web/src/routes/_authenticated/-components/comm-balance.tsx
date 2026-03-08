interface CommBalanceProps {
  youPercent: number
  partnerPercent: number
  className?: string
}

export function CommBalance({ youPercent, partnerPercent, className }: CommBalanceProps) {
  const total = youPercent + partnerPercent
  const youPct = total > 0 ? Math.round((youPercent / total) * 100) : 50
  const partnerPct = 100 - youPct

  const label =
    Math.abs(youPct - 50) <= 10
      ? 'Balanced'
      : youPct > 50
        ? 'You initiate more'
        : 'Partner initiates more'

  // Half donut (180 degrees) SVG
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ''}`}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
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
      </svg>
      <div className="flex items-center gap-3 text-[10px] text-warm-500">
        <span>{youPct}% you</span>
        <span>{partnerPct}% partner</span>
      </div>
      <p className="text-[10px] font-medium text-warm-600">{label}</p>
    </div>
  )
}

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
