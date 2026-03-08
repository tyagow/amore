import { useState } from 'react'

interface CoachingTip {
  category: string
  tip: string
  context: string
}

interface CoachingInsight {
  id: string
  content: {
    tips: CoachingTip[]
    alertPartnerName: string
    moodLevel: string
    moodNote: string | null
  }
  generatedAt: string | Date
}

interface CoachingCardProps {
  coaching: CoachingInsight[]
}

const MOOD_LABEL: Record<string, string> = {
  low: 'feeling low',
  struggling: 'struggling',
}

export function CoachingCard({ coaching }: CoachingCardProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = coaching.filter((c) => !dismissed.has(c.id))

  if (visible.length === 0) return null

  // Show the most recent coaching insight
  const latest = visible[0]
  const { tips, alertPartnerName, moodLevel, moodNote } = latest.content
  const moodDescription = MOOD_LABEL[moodLevel] ?? `feeling ${moodLevel}`

  return (
    <div className="bg-amber-50 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg" role="img" aria-label="support">
              {'\u{1F49B}'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-warm-800">
              {alertPartnerName} might need some support right now
            </h3>
            <p className="text-xs text-warm-500 mt-0.5">
              They shared that they&apos;re {moodDescription}
              {moodNote ? ` — "${moodNote}"` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            setDismissed((prev) => new Set([...prev, latest.id]))
          }
          className="text-warm-400 hover:text-warm-600 transition-colors p-1 -mt-1 -mr-1"
          aria-label="Dismiss coaching tips"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 space-y-3">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="bg-warm-50/70 rounded-xl p-4 border border-amber-100"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {tip.category}
              </span>
            </div>
            <p className="text-sm text-warm-800 leading-relaxed">{tip.tip}</p>
            <p className="text-xs text-warm-500 mt-1.5 italic">
              {tip.context}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
