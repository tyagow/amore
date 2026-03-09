import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getInsightsData } from '~/server/insights'
import { InsightsTabs, type TabId } from './-components/insights/insights-tabs'
import { OverviewTab } from './-components/insights/overview-tab'
import { CommunicationTab } from './-components/insights/communication-tab'
import { EmotionsTab } from './-components/insights/emotions-tab'
import { DiscoveriesTab } from './-components/insights/discoveries-tab'
import { CoachingTab } from './-components/insights/coaching-tab'

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
  component: InsightsPage,
})

function InsightsPage() {
  const data = Route.useLoaderData()

  if (!data || !data.hasCouple) {
    return <NoCoupleState />
  }

  return <InsightsContent data={data} />
}

function NoCoupleState() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-coral-50 flex items-center justify-center">
        <svg className="w-10 h-10 text-coral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <h1 className="font-display text-3xl text-warm-900 mb-3">Insights</h1>
      <p className="text-warm-500 mb-8 leading-relaxed">
        Connect with your partner to unlock detailed relationship insights, communication analytics, and AI-powered coaching.
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

function InsightsContent({ data }: { data: Extract<ReturnType<typeof Route.useLoaderData>, { hasCouple: true }> }) {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()

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
        <h1 className="font-display text-3xl text-warm-900">Insights</h1>
        <p className="text-warm-500 mt-1">
          Deep dive into your relationship patterns and growth
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
