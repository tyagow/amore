import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getIntelligence, triggerAnalysis } from '~/server/intelligence'
import { getActiveCoaching } from '~/server/coaching'
import { getPendingMoodDetections } from '~/server/mood-detection'
import { CoupleHero } from './-components/couple-hero'
import { MoodSelector } from './-components/mood-selector'
import { GoalsCard } from './-components/goals-card'
import { InsightsCard } from './-components/insights-card'
import { CoachingCard } from './-components/coaching-card'
import { PatternCards } from './-components/pattern-cards'
import { MoodDetectionModal } from './-components/mood-detection-modal'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: async () => {
    const [intelligence, activeCoaching, pendingMoodDetections] = await Promise.all([
      getIntelligence(),
      getActiveCoaching(),
      getPendingMoodDetections(),
    ])
    return { ...intelligence, activeCoaching, pendingMoodDetections }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [showMoodDetections, setShowMoodDetections] = useState(
    data.pendingMoodDetections.length > 0,
  )

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      await triggerAnalysis()
      // Poll for completion — analysis takes ~10-30s
      setTimeout(() => router.invalidate(), 15000)
      setTimeout(() => router.invalidate(), 30000)
      setTimeout(() => {
        router.invalidate()
        setAnalyzing(false)
      }, 45000)
    } catch {
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <CoupleHero
        userName={data.userName}
        partnerName={data.partner?.name ?? null}
        healthScore={data.couple.healthScore}
        lastAnalyzed={data.couple.lastAnalyzed}
        messagesSinceAnalysis={data.couple.messagesSinceAnalysis}
        myMood={data.myMood}
        partnerMood={data.partnerMood}
        sentimentByDay={data.sentimentByDay}
      />

      {data.couple.healthScore == null && data.messageStats && data.messageStats.totalMessages >= 20 && (
        <div className="bg-coral-50 rounded-2xl p-6 text-center animate-in">
          <p className="text-warm-700 mb-3">
            {analyzing
              ? 'Analyzing your conversations...'
              : `You have ${data.messageStats.totalMessages.toLocaleString()} messages ready for analysis`}
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-6 py-2.5 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 transition-colors disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Relationship Health'}
          </button>
        </div>
      )}

      <MoodSelector onMoodSet={() => router.invalidate()} />

      {data.activeCoaching.length > 0 && (
        <CoachingCard coaching={data.activeCoaching} />
      )}

      <PatternCards
        sentimentByDay={data.sentimentByDay}
        messageStats={data.messageStats}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightsCard insights={data.recentInsights} />
        <GoalsCard goals={data.activeGoals} />
      </div>

      {showMoodDetections && data.pendingMoodDetections.length > 0 && (
        <MoodDetectionModal
          detections={data.pendingMoodDetections}
          onResolved={() => {
            setShowMoodDetections(false)
            router.invalidate()
          }}
        />
      )}
    </div>
  )
}
