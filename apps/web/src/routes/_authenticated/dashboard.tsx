import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getDashboardData } from '~/server/dashboard'
import { HealthRing } from './-components/health-ring'
import { MoodCard } from './-components/mood-card'
import { MoodSelector } from './-components/mood-selector'
import { GoalsCard } from './-components/goals-card'
import { InsightsCard } from './-components/insights-card'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: () => getDashboardData(),
  component: DashboardPage,
})

function DashboardPage() {
  const data = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          {data.userName ? `Hey, ${data.userName}` : 'Dashboard'}
        </h1>
        <p className="text-stone-500 mt-1">
          {data.partner?.name
            ? `You & ${data.partner.name}`
            : 'Your relationship at a glance'}
        </p>
      </div>

      {/* Health Ring — prominent at top */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 mb-6 flex justify-center">
        <HealthRing score={data.couple.healthScore} />
      </div>

      {/* Mood Selector — set your mood */}
      <div className="mb-6">
        <MoodSelector onMoodSet={() => router.invalidate()} />
      </div>

      {/* Cards grid — 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoodCard
          myMood={data.myMood}
          partnerMood={data.partnerMood}
          partnerName={data.partner?.name ?? null}
        />
        <GoalsCard goals={data.activeGoals} />
        <InsightsCard insights={data.recentInsights} />
      </div>
    </div>
  )
}
