import { formatRelationshipLabel, getInterestLabel } from './relationship-context-format'
import { buildInterestDraft, buildLoveLanguageDraft } from '../profile-action-draft'
import { useI18n } from '~/lib/i18n'

// --- Health Score Ring ---

function SidebarHealthScore({
  score,
  partnerName,
  onUseSuggestion,
  locale,
}: {
  score: number | null
  partnerName: string
  onUseSuggestion: (text: string) => void
  locale: 'en' | 'pt-BR'
}) {
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
      {score !== null && (
        <button
          type="button"
          onClick={() => onUseSuggestion(buildHealthScoreDraft(score, partnerName, locale))}
          className="mt-3 w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-left text-xs font-semibold text-warm-700 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700"
        >
          {score < 70 ? 'Draft repair check-in' : 'Draft care check-in'}
        </button>
      )}
    </div>
  )
}

export function buildHealthScoreDraft(score: number, partnerName: string, locale: 'en' | 'pt-BR' = 'en') {
  if (locale === 'pt-BR') {
    if (score < 70) {
      return `Oi ${partnerName}, quero desacelerar e reparar em vez de deixar a distancia crescer.\n\nEu me importo em fazer isso ficar mais seguro para nos dois, nao em transformar a pontuacao em pressao.\n\nA gente poderia reservar 10 minutos hoje para nomear uma coisa que ficou pesada, uma parte que eu posso assumir e um reparo que realmente ajudaria? Quero assumir minha parte antes de tentar resolver.\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`
    }

    return `Oi ${partnerName}, quero continuar cuidando da gente de proposito.\n\nA gente poderia nomear uma coisa que ajudou a gente a se sentir conectado esta semana e uma coisa pequena que ajudaria na proxima?\n\nSe um check-in completo parecer demais, podemos escolher so uma apreciacao e um proximo passo pequeno?`
  }

  if (score < 70) {
    return `Hey ${partnerName}, I want to slow down and repair instead of letting distance build.\n\nI care about making this feel safer for both of us, not turning the score into pressure.\n\nCould we take 10 minutes today to name one thing that has felt heavy, one part I can own, and one repair that would actually help? I want to own my part before trying to solve.\n\nIf now is not a good time, could we choose a smaller moment later today?`
  }

  return `Hey ${partnerName}, I want to keep caring for us on purpose.\n\nCould we each name one thing that helped us feel connected this week and one small thing that would help next week?\n\nIf a full check-in feels like too much, could we just choose one appreciation and one tiny next step?`
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
  const { t } = useI18n()
  if (tips.length === 0) return null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        {t('Coaching Tips')}
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

type ToolkitGuide = 'conflict' | 'space' | 'apology' | 'bid' | 'aftercare' | 'listen' | 'longing'

export function getToolkitGuides(score: number | null, tensionFlag: boolean): ToolkitGuide[] {
  if (tensionFlag || (score !== null && score < 70)) {
    return ['listen', 'longing', 'conflict', 'space', 'apology', 'bid', 'aftercare']
  }

  return ['listen', 'longing', 'conflict', 'bid', 'aftercare']
}

function ConversationToolkit({
  healthScore,
  tensionFlag,
}: {
  healthScore: number | null
  tensionFlag: boolean
}) {
  const { t } = useI18n()
  const guides = getToolkitGuides(healthScore, tensionFlag)
  const labels: Record<ToolkitGuide, string> = {
    conflict: 'Conflict map',
    space: 'Space request',
    apology: 'Apology guide',
    bid: 'Missed bid',
    aftercare: 'Aftercare plan',
    listen: 'Listen first',
    longing: 'Longing request',
  }

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        {t('Conversation Toolkit')}
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {guides.map((guide) => (
          <button
            key={guide}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('amore:open-chat-guide', { detail: guide }))}
            className="rounded-xl border border-warm-100 bg-white px-2.5 py-2 text-left text-xs font-semibold text-warm-700 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700"
          >
            {t(labels[guide])}
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Love Languages ---

function LoveLanguages({
  languages,
  partnerName,
  onUseSuggestion,
  locale,
}: {
  languages: Array<{ language: string; confidence: number }>
  partnerName: string
  onUseSuggestion: (text: string) => void
  locale: 'en' | 'pt-BR'
}) {
  const { t } = useI18n()
  if (languages.length === 0) return null

  const sorted = [...languages].sort((a, b) => b.confidence - a.confidence)
  const topLanguage = sorted[0]?.language ? formatRelationshipLabel(sorted[0].language, locale) : null

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        {t('Love Languages')}
      </h4>
      <div className="space-y-2">
        {sorted.map((lang) => {
          const pct = Math.round(lang.confidence * 100)
          return (
            <div key={lang.language} className="flex items-center gap-2">
              <span className="text-xs text-warm-600 w-28 shrink-0 truncate">
                {formatRelationshipLabel(lang.language, locale)}
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
      {topLanguage && (
        <button
          type="button"
          onClick={() => onUseSuggestion(buildLoveLanguageDraft(partnerName, topLanguage, locale))}
          className="mt-3 w-full rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-left text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-100"
        >
          {t('Plan care in chat')}
        </button>
      )}
    </div>
  )
}

// --- Partner Interests ---

function PartnerInterests({
  interests,
  partnerName,
  onUseSuggestion,
  locale,
}: {
  interests: unknown[]
  partnerName: string
  onUseSuggestion: (text: string) => void
  locale: 'en' | 'pt-BR'
}) {
  if (interests.length === 0) return null

  const visibleInterests = interests.map(getInterestLabel).filter(Boolean).slice(0, 10)

  return (
    <div className="bg-warm-100 rounded-2xl shadow-sm border border-warm-100 p-4">
      <h4 className="text-xs font-medium text-warm-500 mb-2">
        Partner Interests
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {visibleInterests.map((interest, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onUseSuggestion(buildInterestDraft(partnerName, interest, locale))}
            className="text-xs px-2 py-0.5 rounded-full bg-coral-50 text-coral-600 transition-colors hover:bg-coral-100 hover:text-coral-700"
          >
            {interest}
          </button>
        ))}
      </div>
      {interests.length > visibleInterests.length && (
        <p className="mt-2 text-[10px] text-warm-400">
          {interests.length - visibleInterests.length} more saved in discoveries.
        </p>
      )}
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
  partnerName?: string | null
  partnerProfile: {
    loveLanguages?: Array<{ language: string; confidence: number }> | null
    communicationStyle?: Record<string, Record<string, number>> | null
    interests?: unknown[] | null
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
  partnerName,
  partnerProfile,
  recentInsights,
}: AISidebarProps) {
  const { locale } = useI18n()
  const loveLanguages = partnerProfile?.loveLanguages ?? []
  const interests = partnerProfile?.interests ?? []
  const displayPartnerName = partnerName || 'your partner'

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

        <SidebarHealthScore
          score={healthScore}
          partnerName={displayPartnerName}
          onUseSuggestion={onUseSuggestion}
          locale={locale}
        />

        <ConversationToolkit
          healthScore={healthScore}
          tensionFlag={tensionFlag}
        />

        <MoodIndicator mood={mood} loading={moodLoading} />

        <SuggestionsList
          suggestions={suggestions}
          loading={suggestionsLoading}
          onUseSuggestion={onUseSuggestion}
        />

        <CoachingTips tips={displayCoaching} />

        <LoveLanguages
          languages={loveLanguages}
          partnerName={displayPartnerName}
          onUseSuggestion={onUseSuggestion}
          locale={locale}
        />

        <PartnerInterests
          interests={interests}
          partnerName={displayPartnerName}
          onUseSuggestion={onUseSuggestion}
          locale={locale}
        />

        {!hasAnyData && !suggestionsLoading && !moodLoading && (
          <ZeroState messageCount={totalMessages} />
        )}
      </div>
    </div>
  )
}
