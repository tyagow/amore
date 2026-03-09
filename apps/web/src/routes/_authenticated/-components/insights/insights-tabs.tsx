const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'communication', label: 'Communication' },
  { id: 'emotions', label: 'Emotions' },
  { id: 'discoveries', label: 'Discoveries' },
  { id: 'coaching', label: 'Coaching' },
] as const

export type TabId = (typeof TABS)[number]['id']

interface InsightsTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function InsightsTabs({ activeTab, onTabChange }: InsightsTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${
              activeTab === tab.id
                ? 'bg-coral-500 text-white shadow-sm shadow-coral-200'
                : 'bg-warm-100 text-warm-500 hover:bg-warm-200 hover:text-warm-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
