import { Link } from '@tanstack/react-router'

interface Goal {
  id: string
  title: string
  description: string | null
  status: string
  source: string
}

interface GoalsCardProps {
  goals: Goal[]
}

export function GoalsCard({ goals }: GoalsCardProps) {
  const displayGoals = goals.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
          Goals
        </h3>
        <Link
          to="/goals"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {goals.length > 3 ? `View all ${goals.length}` : 'Manage'}
        </Link>
      </div>

      {displayGoals.length > 0 ? (
        <ul className="space-y-3">
          {displayGoals.map((goal) => (
            <li key={goal.id} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0 flex items-center justify-center">
                {goal.status === 'completed' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 leading-tight">
                  {goal.title}
                </p>
                {goal.description && (
                  <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                    {goal.description}
                  </p>
                )}
                {goal.source === 'ai' && (
                  <span className="inline-block mt-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    AI suggested
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-stone-400 mb-3">
            No goals yet
          </p>
          <Link
            to="/goals"
            className="text-sm text-stone-600 font-medium hover:text-stone-900 transition-colors"
          >
            Add your first goal
          </Link>
        </div>
      )}
    </div>
  )
}
