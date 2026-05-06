import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { getInsightsData } from '~/server/insights'
import { InsightsTabs, type TabId } from './-components/insights/insights-tabs'
import { OverviewTab } from './-components/insights/overview-tab'
import { CommunicationTab } from './-components/insights/communication-tab'
import { EmotionsTab } from './-components/insights/emotions-tab'
import { DiscoveriesTab } from './-components/insights/discoveries-tab'
import { CoachingTab } from './-components/insights/coaching-tab'
import { useI18n } from '~/lib/i18n'

const validTabs: TabId[] = ['overview', 'communication', 'emotions', 'discoveries', 'coaching']

export const Route = createFileRoute('/_authenticated/insights')({
  validateSearch: (search: Record<string, unknown>) => {
    const tab = search.tab as string
    return {
      tab: validTabs.includes(tab as TabId) ? (tab as TabId) : 'overview',
    }
  },
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      return { hasCouple: false as const }
    }
    const data = await getInsightsData()
    return { hasCouple: true as const, ...data }
  },
  pendingMs: 0,
  pendingMinMs: 300,
  pendingComponent: InsightsPending,
  component: InsightsPage,
})

function InsightsPage() {
  const data = Route.useLoaderData()

  if (!data || !data.hasCouple) {
    return <NoCoupleState />
  }

  return <InsightsContent data={data} />
}

function SkeletonBlock({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden rounded-lg bg-warm-200/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${className}`}
    />
  )
}

function InsightsPending() {
  const { t } = useI18n()

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 pt-6" aria-busy="true" aria-label={t('Loading insights')}>
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-warm-900">{t('Insights')}</h1>
            <p className="text-warm-500 mt-1">{t('Preparing your relationship patterns')}</p>
          </div>
          <div className="hidden rounded-full border border-coral-100 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-600 sm:block">
            {t('Loading')}
          </div>
        </div>
      </header>

      <div className="mb-6 flex gap-2 overflow-hidden rounded-2xl bg-white p-1 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
        {[0, 1, 2, 3, 4].map((item) => (
          <SkeletonBlock key={item} className="h-10 min-w-24 flex-1 rounded-xl" />
        ))}
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-coral-100 bg-coral-50/70 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-7 w-full max-w-md" />
              <SkeletonBlock className="h-4 w-full max-w-2xl" />
              <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
            </div>
            <SkeletonBlock className="h-7 w-28 rounded-full" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-12 rounded-xl" />
            <SkeletonBlock className="h-12 rounded-xl" />
            <SkeletonBlock className="h-12 rounded-xl" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <SkeletonBlock className="mb-5 h-5 w-40" />
          <div className="mb-4 flex items-center gap-3">
            <SkeletonBlock className="h-9 w-16" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-xl bg-warm-50">
            <SkeletonBlock className="absolute bottom-8 left-0 h-20 w-full rounded-none opacity-70" />
            <div className="absolute inset-x-4 bottom-8 flex items-end justify-between gap-2">
              {[42, 68, 54, 96, 72, 118, 88].map((height, index) => (
                <SkeletonBlock key={index} className="w-full rounded-t-md" style={{ height }} />
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-xl bg-warm-50 p-4">
              <SkeletonBlock className="mx-auto mb-3 h-8 w-14" />
              <SkeletonBlock className="mx-auto h-3 w-20" />
            </div>
          ))}
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <SkeletonBlock className="mb-5 h-5 w-36" />
          <div className="space-y-5 border-l-2 border-warm-200">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="relative ml-2 space-y-2 pl-4">
                <span className="absolute -left-[calc(0.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-warm-300 ring-2 ring-white" />
                <div className="flex gap-2">
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                  <SkeletonBlock className="h-5 w-14" />
                </div>
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function NoCoupleState() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-coral-50 flex items-center justify-center">
        <svg className="w-10 h-10 text-coral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <h1 className="font-display text-3xl text-warm-900 mb-3">{t('Insights')}</h1>
      <p className="text-warm-500 mb-8 leading-relaxed">
        {t('Connect with your partner to unlock detailed relationship insights, communication analytics, and AI-powered coaching.')}
      </p>
      <Link
        to="/connect"
        className="inline-block px-6 py-3 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 transition-colors shadow-sm shadow-coral-200"
      >
        {t('Connect with your partner')}
      </Link>
    </div>
  )
}

function InsightsContent({ data }: { data: Extract<ReturnType<typeof Route.useLoaderData>, { hasCouple: true }> }) {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleTabChange = (newTab: TabId) => {
    navigate({
      to: '/insights',
      search: { tab: newTab },
      replace: true,
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-3xl text-warm-900">{t('Insights')}</h1>
        <p className="text-warm-500 mt-1">
          {t('Deep dive into your relationship patterns and growth')}
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6">
        <InsightsTabs activeTab={tab} onTabChange={handleTabChange} />
      </div>

      {/* Active Tab Content */}
      <div>
        {tab === 'overview' && <OverviewTab data={data} />}
        {tab === 'communication' && <CommunicationTab data={data} />}
        {tab === 'emotions' && <EmotionsTab data={data} />}
        {tab === 'discoveries' && <DiscoveriesTab data={data} />}
        {tab === 'coaching' && <CoachingTab data={data} />}
      </div>
    </div>
  )
}
