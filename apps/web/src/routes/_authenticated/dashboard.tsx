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
import { InstallBanner } from './-components/install-banner'
import { PushOptIn } from './-components/push-opt-in'
import { DailyCheckinCard } from './-components/daily-checkin-card'
import { DailyCarePlanCard } from './-components/daily-care-plan-card'
import { DailyConnectionQuestionCard } from './-components/daily-connection-question-card'
import { ConversationAgreementCard } from './-components/conversation-agreement-card'
import { HotMomentResetCard } from './-components/hot-moment-reset-card'
import { MicroDatePlanCard } from './-components/micro-date-plan-card'
import { RepairDebriefCard } from './-components/repair-debrief-card'
import { RelationshipMoveCard } from './-components/relationship-move-card'
import { RelationshipPracticeDeck } from './-components/relationship-practice-deck'
import { RepairChoiceCard } from './-components/repair-choice-card'
import { WeeklyResetRitual } from './-components/weekly-reset-ritual'
import { PersonalizedRitualCard } from './-components/personalized-ritual-card'
import { WeeklyRelationshipReportCard } from './-components/weekly-relationship-report-card'
import {
  selectPersonalizedRitual,
  type RitualHistoryEntry,
} from './-components/personalized-ritual-engine'
import { getDailyCheckin } from '~/server/checkin'
import {
  isUpgradeGateDetail,
  openUpgradeModal,
} from '~/lib/upgrade-gate'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/_authenticated/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    upgraded: search.upgraded === 'true',
  }),
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      const pendingRequests = await getPendingRequests()
      return { hasCouple: false as const, pendingRequests }
    }
    const [intelligence, activeCoaching, pendingMoodDetections, dailyCheckin] = await Promise.all([
      getIntelligence(),
      getActiveCoaching(),
      getPendingMoodDetections(),
      getDailyCheckin(),
    ])
    return { hasCouple: true as const, ...intelligence, activeCoaching, pendingMoodDetections, dailyCheckin }
  },
  component: DashboardPage,
})

function SoloOnboarding({ pendingRequests }: {
  pendingRequests: Awaited<ReturnType<typeof getPendingRequests>>
}) {
  const router = useRouter()
  const { t } = useI18n()
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

  // Dispatch custom event to open coach sidebar from parent layout
  const openCoach = () => {
    window.dispatchEvent(new CustomEvent('amore:open-coach'))
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
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

      {/* Welcome header */}
      <div className="text-center">
        <h1 className="font-display text-3xl text-warm-900 mb-2">Welcome to Amore</h1>
        <p className="text-warm-500 leading-relaxed">
          {t('Get started by talking to your coach or uploading a conversation for instant insights.')}
        </p>
      </div>

      {/* Coach CTA card */}
      <button
        onClick={openCoach}
        className="w-full text-left bg-white border border-warm-200 rounded-2xl p-6 shadow-sm hover:border-coral-200 hover:shadow-md transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-500 group-hover:bg-coral-100 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.895-.356-1.755-.988-2.387l-.547-.547Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-warm-900 mb-1">{t('Talk to your relationship coach')}</h3>
            <p className="text-sm text-warm-500 leading-relaxed">
              {t('Get personalized guidance on communication, conflict resolution, and relationship growth. No partner connection required.')}
            </p>
          </div>
          <svg className="h-5 w-5 shrink-0 mt-1 text-warm-300 group-hover:text-coral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Chat export upload CTA */}
      <Link
        to="/upload"
        className="block w-full text-left bg-white border border-warm-200 rounded-2xl p-6 shadow-sm hover:border-coral-200 hover:shadow-md transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 group-hover:bg-violet-100 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-warm-900 mb-1">Upload a WhatsApp chat</h3>
            <p className="text-sm text-warm-500 leading-relaxed">
              Export a conversation from WhatsApp and get a health score and relationship insights in under a minute.
            </p>
          </div>
          <svg className="h-5 w-5 shrink-0 mt-1 text-warm-300 group-hover:text-coral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Partner connection — deprioritized */}
      <Link
        to="/connect"
        className="block w-full text-left bg-warm-50 border border-warm-200/60 rounded-2xl p-6 hover:border-warm-300 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warm-100 text-warm-400 group-hover:text-warm-500 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-warm-700 mb-1">Connect with your partner</h3>
            <p className="text-sm text-warm-400 leading-relaxed">
              Invite your partner to unlock live WhatsApp analysis, shared goals, and mood tracking.
            </p>
          </div>
          <svg className="h-5 w-5 shrink-0 mt-1 text-warm-300 group-hover:text-warm-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </div>
  )
}

function DashboardPage() {
  const data = Route.useLoaderData()
  const { upgraded } = Route.useSearch()

  if (!data.hasCouple) {
    const { pendingRequests } = data as Extract<typeof data, { hasCouple: false }>
    return (
      <>
        {upgraded && <UpgradeSuccessBanner />}
        <SoloOnboarding pendingRequests={pendingRequests} />
      </>
    )
  }

  return (
    <>
      {upgraded && <UpgradeSuccessBanner />}
      <CouplesDashboard data={data as Extract<typeof data, { hasCouple: true }>} />
    </>
  )
}

function CouplesDashboard({ data }: { data: Extract<ReturnType<typeof Route.useLoaderData>, { hasCouple: true }> }) {
  const router = useRouter()
  const { locale, t } = useI18n()
  const [analyzing, setAnalyzing] = useState(false)
  const [showQuickMood, setShowQuickMood] = useState(false)
  const [showMoodDetections, setShowMoodDetections] = useState(
    data.pendingMoodDetections.length > 0,
  )
  const todayKey = new Date().toISOString().slice(0, 10)
  const [ritualHistory, setRitualHistory] = useState<RitualHistoryEntry[]>([])
  const ritualCooldownHistory = ritualHistory.filter((entry) => entry.dateKey !== todayKey)
  const selectedRitual = selectPersonalizedRitual({
    dateKey: todayKey,
    healthScore: data.couple.healthScore,
    messagesSinceAnalysis: data.couple.messagesSinceAnalysis,
    hasActiveGoals: data.activeGoals.length > 0,
    partnerMoodSet: !!data.partnerMood,
    myMood: data.myMood?.mood ?? null,
    partnerMood: data.partnerMood?.mood ?? null,
    partnerInterests: data.partnerProfile?.interests,
    recentCheckins: data.dailyCheckin.recentCheckins,
  }, ritualCooldownHistory)

  // Poll for updates while onboarding is incomplete
  useEffect(() => {
    if (data.couple.healthScore != null) return
    const interval = setInterval(() => {
      router.invalidate()
    }, 5000)
    return () => clearInterval(interval)
  }, [data.couple.healthScore, router])

  useEffect(() => {
    const saved = window.localStorage.getItem('amore-ritual-history-v1')
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return
      setRitualHistory(
        parsed.filter((entry): entry is RitualHistoryEntry =>
          Boolean(
            entry &&
            typeof entry === 'object' &&
            typeof entry.id === 'string' &&
            typeof entry.dateKey === 'string',
          ),
        ),
      )
    } catch {
      window.localStorage.removeItem('amore-ritual-history-v1')
    }
  }, [])

  useEffect(() => {
    setRitualHistory((current) => {
      const withoutToday = current.filter((entry) => entry.dateKey !== todayKey)
      const next = [
        { id: selectedRitual.id, dateKey: todayKey },
        ...withoutToday,
      ].slice(0, 14)
      window.localStorage.setItem('amore-ritual-history-v1', JSON.stringify(next))
      return next
    })
  }, [selectedRitual.id, todayKey])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const result = await triggerAnalysis({ data: { locale } })
      if (isUpgradeGateDetail(result)) {
        openUpgradeModal(result)
        setAnalyzing(false)
        return
      }
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
      <InstallBanner />
      <PushOptIn />
      <DailyCheckinCard
        data={data.dailyCheckin}
        partnerName={data.partner?.name ?? 'your partner'}
      />
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

      <RelationshipMoveCard
        partnerName={data.partner?.name ?? 'your partner'}
        healthScore={data.couple.healthScore}
        messagesSinceAnalysis={data.couple.messagesSinceAnalysis}
        hasGoals={data.activeGoals.length > 0}
        partnerMoodSet={!!data.partnerMood}
        ritual={selectedRitual}
        onOpenCoach={(prompt) => {
          if (prompt) {
            window.localStorage.setItem('amore-coach-draft', prompt)
          }
          window.dispatchEvent(new CustomEvent('amore:open-coach'))
        }}
      />

      <HotMomentResetCard />

      <PersonalizedRitualCard
        ritual={selectedRitual}
        partnerName={data.partner?.name ?? 'your partner'}
        dailyCheckin={data.dailyCheckin}
        onOpenCoach={(prompt) => {
          window.localStorage.setItem('amore-coach-draft', prompt)
          window.dispatchEvent(new CustomEvent('amore:open-coach'))
        }}
      />

      <WeeklyRelationshipReportCard
        partnerName={data.partner?.name ?? 'your partner'}
        healthScore={data.couple.healthScore}
        messagesSinceAnalysis={data.couple.messagesSinceAnalysis}
        messageStats={data.messageStats}
        activeGoalCount={data.activeGoals.length}
        recentCheckins={data.dailyCheckin.recentCheckins}
        ritual={selectedRitual}
        onOpenCoach={(prompt) => {
          window.localStorage.setItem('amore-coach-draft', prompt)
          window.dispatchEvent(new CustomEvent('amore:open-coach'))
        }}
      />

      <RepairChoiceCard partnerName={data.partner?.name ?? 'your partner'} />

      <DailyCarePlanCard
        partnerName={data.partner?.name ?? 'your partner'}
        healthScore={data.couple.healthScore}
        partnerMood={data.partnerMood}
        partnerProfile={data.partnerProfile}
        hasActiveGoals={data.activeGoals.length > 0}
        onOpenCoach={(prompt) => {
          window.localStorage.setItem('amore-coach-draft', prompt)
          window.dispatchEvent(new CustomEvent('amore:open-coach'))
        }}
      />

      <DailyConnectionQuestionCard
        partnerName={data.partner?.name ?? 'your partner'}
        healthScore={data.couple.healthScore}
        partnerMood={data.partnerMood}
        partnerInterests={data.partnerProfile?.interests}
        onOpenCoach={(prompt) => {
          window.localStorage.setItem('amore-coach-draft', prompt)
          window.dispatchEvent(new CustomEvent('amore:open-coach'))
        }}
      />

      <MicroDatePlanCard
        partnerName={data.partner?.name ?? 'your partner'}
        healthScore={data.couple.healthScore}
        partnerMood={data.partnerMood}
        partnerInterests={data.partnerProfile?.interests}
      />

      <RepairDebriefCard partnerName={data.partner?.name ?? 'your partner'} />

      <ConversationAgreementCard partnerName={data.partner?.name ?? 'your partner'} />

      <RelationshipPracticeDeck partnerName={data.partner?.name ?? 'your partner'} />

      <WeeklyResetRitual
        partnerName={data.partner?.name ?? 'your partner'}
        suggestedRitual={selectedRitual}
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

      <section className="rounded-2xl border border-warm-200/70 bg-white/70 p-4 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-warm-800">{t('Need your partner to know how you are right now?')}</p>
            <p className="mt-0.5 text-sm text-warm-500">
              {t('Use a quick mood only when today changes. Your daily check-in already updates your shared mood.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickMood((open) => !open)}
            className="shrink-0 rounded-xl border border-coral-200 bg-coral-50 px-4 py-2 text-sm font-medium text-coral-700 transition-colors hover:bg-coral-100"
          >
            {showQuickMood ? t('Hide quick mood') : t('Share a quick mood')}
          </button>
        </div>
        {showQuickMood && (
          <div className="mt-4">
            <MoodSelector
              onMoodSet={() => {
                setShowQuickMood(false)
                router.invalidate()
              }}
            />
          </div>
        )}
      </section>

      {data.activeCoaching.length > 0 && (
        <CoachingCard coaching={data.activeCoaching} />
      )}

      <PatternCards
        sentimentByDay={data.sentimentByDay}
        messageStats={data.messageStats}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightsCard insights={data.recentInsights} partnerName={data.partner?.name ?? null} />
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

function UpgradeSuccessBanner() {
  return (
    <div className="mx-auto mt-6 max-w-5xl px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
        Premium checkout completed. If your upgraded access has not appeared yet, give the billing webhook a moment and refresh.
      </div>
    </div>
  )
}
