import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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
import { OnboardingCard } from './-components/onboarding-card'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      return { hasCouple: false as const }
    }
    const [intelligence, activeCoaching, pendingMoodDetections] = await Promise.all([
      getIntelligence(),
      getActiveCoaching(),
      getPendingMoodDetections(),
    ])
    return { hasCouple: true as const, ...intelligence, activeCoaching, pendingMoodDetections }
  },
  component: DashboardPage,
})

function SoloWelcome() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-coral-50 flex items-center justify-center">
        <svg className="w-10 h-10 text-coral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <h1 className="font-display text-3xl text-warm-900 mb-3">Welcome to Amore</h1>
      <p className="text-warm-500 mb-8 leading-relaxed">
        Connect with your partner to unlock relationship insights, shared goals, and AI-powered coaching.
      </p>
      <Link
        to="/connect"
        className="inline-block px-6 py-3 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 transition-colors shadow-sm shadow-coral-200"
      >
        Connect with your partner
      </Link>
    </div>
  )
}

function DashboardPage() {
  const data = Route.useLoaderData()

  if (!data.hasCouple) {
    return <SoloWelcome />
  }

  return <CouplesDashboard data={data} />
}

function CouplesDashboard({ data }: { data: Extract<ReturnType<typeof Route.useLoaderData>, { hasCouple: true }> }) {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [showMoodDetections, setShowMoodDetections] = useState(
    data.pendingMoodDetections.length > 0,
  )

  // Poll for updates while onboarding is incomplete
  useEffect(() => {
    if (data.couple.healthScore != null) return
    const interval = setInterval(() => {
      router.invalidate()
    }, 5000)
    return () => clearInterval(interval)
  }, [data.couple.healthScore, router])

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
        whatsappConnected={!!data.couple.whatsappJid}
        myMood={data.myMood}
        partnerMood={data.partnerMood}
        sentimentByDay={data.sentimentByDay}
      />

      {data.couple.healthScore == null && (
        <OnboardingCard
          whatsappJid={data.couple.whatsappJid}
          totalMessages={data.messageStats?.totalMessages ?? null}
          healthScore={data.couple.healthScore}
          analyzing={analyzing}
          onAnalyze={handleAnalyze}
        />
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
