// --- Health Score Ring ---

function SidebarHealthScore({ score }: { score: number | null }) {
  const displayScore = score ?? 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  let strokeColor = 'text-red-400'
  if (displayScore > 70) strokeColor = 'text-emerald-500'
  else if (displayScore > 40) strokeColor = 'text-amber-500'

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4 flex flex-col items-center">
      <h4 className="text-xs font-medium text-warm-500 mb-3">
        Relationship Health
      </h4>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-warm-100"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={score === null ? circumference : offset}
            className={`${strokeColor} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-warm-800">
            {score === null ? '--' : displayScore}
          </span>
        </div>
      </div>
    </div>
  )
}

// --- Mood Indicator ---

function MoodIndicator({
  mood,
  loading,
}: {
  mood: string | null
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-warm-100 animate-pulse" />
          <div className="h-4 w-32 bg-warm-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!mood) return null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">Current Mood</h4>
      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-coral-100 text-coral-700">
        {mood}
      </span>
    </div>
  )
}

// --- Coaching Tips ---

function CoachingTips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        Coaching Tips
      </h4>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="block w-full text-left text-xs leading-relaxed whitespace-normal rounded-lg px-2.5 py-2 bg-amber-50 text-amber-800 border border-amber-200"
          >
            {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Suggestions List ---

function SuggestionsList({
  suggestions,
  loading,
  onUseSuggestion,
}: {
  suggestions: string[]
  loading: boolean
  onUseSuggestion: (text: string) => void
}) {
  if (loading) {
    return (
      <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
        <h4 className="text-xs font-medium text-warm-500 mb-2">
          Reply Suggestions
        </h4>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 bg-warm-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        Reply Suggestions
      </h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onUseSuggestion(suggestion)}
            className="w-full text-left p-2.5 rounded-xl border border-warm-100 hover:border-coral-200 hover:bg-coral-50/50 transition-colors group cursor-pointer"
          >
            <span className="text-xs text-warm-600 leading-relaxed">
              {suggestion}
            </span>
            <span className="block mt-1 text-coral-500 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Use this reply
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Tension Alert ---

function TensionAlert() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
      <svg
        className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M8 1l7 14H1L8 1zM8 6v3M8 12h.01" />
      </svg>
      <div>
        <p className="text-xs font-medium text-red-700">Tension Detected</p>
        <p className="text-xs text-red-600 mt-0.5">
          The conversation tone suggests some friction. Consider a warm,
          understanding approach.
        </p>
      </div>
    </div>
  )
}

// --- Love Languages ---

function LoveLanguages({
  languages,
}: {
  languages: Array<{ language: string; confidence: number }>
}) {
  if (languages.length === 0) return null

  const sorted = [...languages].sort((a, b) => b.confidence - a.confidence)

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        Love Languages
      </h4>
      <div className="space-y-2">
        {sorted.map((lang) => {
          const pct = Math.round(lang.confidence * 100)
          return (
            <div key={lang.language} className="flex items-center gap-2">
              <span className="text-xs text-warm-600 w-28 shrink-0 truncate capitalize">
                {lang.language.replace(/_/g, ' ')}
              </span>
              <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-coral-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-warm-400 w-8 text-right shrink-0">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Partner Interests ---

function PartnerInterests({ interests }: { interests: string[] }) {
  if (interests.length === 0) return null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        Partner Interests
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {interests.map((interest, idx) => (
          <span
            key={idx}
            className="text-xs px-2 py-0.5 rounded-full bg-coral-50 text-coral-600"
          >
            {typeof interest === 'string' ? interest : String(interest)}
          </span>
        ))}
      </div>
    </div>
  )
}

// --- Zero State ---

function ZeroState({ messageCount }: { messageCount: number }) {
  const progress = Math.min(messageCount, 10)
  const pct = (progress / 10) * 100

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-5 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-coral-50 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-coral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18.5 18.5 22 17 15l5-5-7-1L12 2z" />
        </svg>
      </div>
      <h4 className="text-sm font-semibold text-warm-700 mb-1">
        Learning Your Patterns
      </h4>
      <p className="text-xs text-warm-400 mb-3">
        Chat with your partner and I'll start learning your patterns. Insights
        appear after a few messages.
      </p>
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-warm-400 mb-1">
          <span>Progress</span>
          <span>
            {progress}/10
          </span>
        </div>
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-coral-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// --- Main Sidebar ---

interface AISidebarProps {
  healthScore: number | null
  mood: string | null
  moodLoading: boolean
  coaching: string[]
  suggestions: string[]
  suggestionsLoading: boolean
  tensionFlag: boolean
  aiError: string | null
  totalMessages: number
  onUseSuggestion: (text: string) => void
  partnerProfile: {
    loveLanguages?: Array<{ language: string; confidence: number }> | null
    communicationStyle?: Record<string, Record<string, number>> | null
    interests?: string[] | null
  } | null
  recentInsights: Array<{
    id: string
    type: string
    content: unknown
    severity?: string | null
    generatedAt: Date | string
  }>
}

export function AISidebar({
  healthScore,
  mood,
  moodLoading,
  coaching,
  suggestions,
  suggestionsLoading,
  tensionFlag,
  aiError,
  totalMessages,
  onUseSuggestion,
  partnerProfile,
  recentInsights,
}: AISidebarProps) {
  const loveLanguages = partnerProfile?.loveLanguages ?? []
  const interests = partnerProfile?.interests ?? []

  // Show persisted coaching tips when no live coaching exists
  const persistedCoachingTips = (recentInsights ?? [])
    .filter((i) => i.type === 'coaching_tip')
    .map((i) => ((i.content as { tip?: string })?.tip ?? ''))
    .filter(Boolean)
  const displayCoaching = coaching.length > 0 ? coaching : persistedCoachingTips

  const hasAnyData =
    mood ||
    coaching.length > 0 ||
    suggestions.length > 0 ||
    loveLanguages.length > 0 ||
    interests.length > 0 ||
    persistedCoachingTips.length > 0

  return (
    <div className="bg-warm-50 border-l border-warm-200 p-4 overflow-y-auto h-full">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-warm-600 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-coral-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18.5 18.5 22 17 15l5-5-7-1L12 2z" />
          </svg>
          AI Assistant
        </h3>

        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-600">{aiError}</p>
          </div>
        )}

        {tensionFlag && <TensionAlert />}

        <SidebarHealthScore score={healthScore} />

        <MoodIndicator mood={mood} loading={moodLoading} />

        <SuggestionsList
          suggestions={suggestions}
          loading={suggestionsLoading}
          onUseSuggestion={onUseSuggestion}
        />

        <CoachingTips tips={displayCoaching} />

        <LoveLanguages languages={loveLanguages} />

        <PartnerInterests interests={interests} />

        {!hasAnyData && !suggestionsLoading && !moodLoading && (
          <ZeroState messageCount={totalMessages} />
        )}
      </div>
    </div>
  )
}
