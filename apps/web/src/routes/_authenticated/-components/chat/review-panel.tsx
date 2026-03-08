function getToneBadgeClasses(tone: string): string {
  const lower = tone.toLowerCase()

  if (
    lower.includes('warm') ||
    lower.includes('supportive') ||
    lower.includes('kind') ||
    lower.includes('loving')
  ) {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (
    lower.includes('defensive') ||
    lower.includes('aggressive') ||
    lower.includes('harsh') ||
    lower.includes('passive-aggressive')
  ) {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-amber-100 text-amber-700'
}

export function ReviewPanel({
  review,
  onUseRevised,
  onDismiss,
}: {
  review: { tone: string; suggestions: string[]; revised: string }
  onUseRevised: () => void
  onDismiss: () => void
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl mx-4 mb-2 p-3">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${getToneBadgeClasses(review.tone)}`}
        >
          {review.tone}
        </span>
        <button
          onClick={onDismiss}
          className="text-warm-400 hover:text-warm-600 text-xs p-1"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>

      {review.suggestions.length > 0 && (
        <ul className="mb-2 space-y-1">
          {review.suggestions.map((s, i) => (
            <li
              key={i}
              className="text-xs text-warm-600 flex items-start gap-1.5"
            >
              <span className="text-warm-400 mt-0.5">&bull;</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="p-2.5 bg-warm-50 rounded-lg mb-2">
        <p className="text-xs text-warm-500 font-medium mb-1">
          Suggested revision:
        </p>
        <p className="text-sm text-warm-700 leading-relaxed">
          {review.revised}
        </p>
      </div>

      <button
        onClick={onUseRevised}
        className="w-full text-xs font-medium text-coral-600 hover:text-coral-700 py-1.5 rounded-lg hover:bg-coral-50 transition-colors"
      >
        Use revised version
      </button>
    </div>
  )
}
