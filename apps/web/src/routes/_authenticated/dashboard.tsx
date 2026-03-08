import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getIntelligence } from '~/server/intelligence'
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
  const [showMoodDetections, setShowMoodDetections] = useState(
    data.pendingMoodDetections.length > 0,
  )

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
