interface HealthRingProps {
  score: number | null
}

export function HealthRing({ score }: HealthRingProps) {
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = score != null ? (score / 100) * circumference : 0
  const offset = circumference - progress

  const color =
    score == null
      ? 'text-stone-300'
      : score > 70
        ? 'text-emerald-500'
        : score > 40
          ? 'text-amber-500'
          : 'text-red-500'

  const bgColor =
    score == null
      ? 'text-stone-200'
      : score > 70
        ? 'text-emerald-100'
        : score > 40
          ? 'text-amber-100'
          : 'text-red-100'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={`stroke-current ${bgColor}`}
          />
          {/* Progress circle */}
          {score != null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`stroke-current ${color} transition-all duration-700 ease-out`}
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score != null ? (
            <>
              <span className={`text-4xl font-bold ${color}`}>{score}</span>
              <span className="text-xs text-stone-500 uppercase tracking-wide">
                Health
              </span>
            </>
          ) : (
            <span className="text-sm text-stone-400 text-center px-4">
              No data yet
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-stone-500">
        {score == null
          ? 'Connect WhatsApp to get your score'
          : score > 70
            ? 'Your relationship is thriving'
            : score > 40
              ? 'Room for growth'
              : 'Needs attention'}
      </p>
    </div>
  )
}
