import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getIntelligence, triggerAnalysis } from '~/server/intelligence'
import { getActiveCoaching } from '~/server/coaching'
import { getPendingMoodDetections } from '~/server/mood-detection'
import {
  getPendingRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '~/server/connections'
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
      const pendingRequests = await getPendingRequests()
      return { hasCouple: false as const, pendingRequests }
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

function SoloWelcome({ pendingRequests }: {
  pendingRequests: Awaited<ReturnType<typeof getPendingRequests>>
}) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await acceptConnectionRequest({ data: { requestId } })
      await router.invalidate()
    } catch {
      setProcessingId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await declineConnectionRequest({ data: { requestId } })
      await router.invalidate()
    } catch {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16 space-y-8">
      {/* Pending invitations — shown prominently */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <h2 className="text-lg font-bold text-warm-900">
              {pendingRequests.length === 1
                ? 'You have a connection request!'
                : `You have ${pendingRequests.length} connection requests!`}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-warm-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-warm-900">
                      {request.fromUserName ?? 'Someone'}
                    </p>
                    <p className="text-sm text-warm-500">{request.fromUserEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
                    >
                      {processingId === request.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={!!processingId}
                      className="px-4 py-2 border border-warm-300 text-warm-600 text-sm rounded-lg font-medium hover:bg-warm-100 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome + invite CTA */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-coral-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-coral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-warm-900 mb-3">Welcome to Amore</h1>
        <p className="text-warm-500 mb-8 leading-relaxed">
          {pendingRequests.length > 0
            ? 'Accept the invitation above to get started, or invite someone else below.'
            : 'Connect with your partner to unlock relationship insights, shared goals, and AI-powered coaching.'}
        </p>
        <Link
          to="/connect"
          className={`inline-block px-6 py-3 rounded-xl font-medium transition-colors shadow-sm shadow-coral-200 ${
            pendingRequests.length > 0
              ? 'border border-warm-300 text-warm-700 hover:bg-warm-100'
              : 'bg-coral-500 text-white hover:bg-coral-600'
          }`}
        >
          {pendingRequests.length > 0 ? 'Invite someone else' : 'Connect with your partner'}
        </Link>
      </div>
    </div>
  )
}

function DashboardPage() {
  const data = Route.useLoaderData()

  if (!data.hasCouple) {
    const { pendingRequests } = data as Extract<typeof data, { hasCouple: false }>
    return <SoloWelcome pendingRequests={pendingRequests} />
  }

  return <CouplesDashboard data={data as Extract<typeof data, { hasCouple: true }>} />
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
