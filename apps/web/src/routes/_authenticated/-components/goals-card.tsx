import { Link } from '@tanstack/react-router'

interface Goal {
  id: string
  title: string
  description: string | null
  status: string
  source: string
  dueDate?: string | Date | null
  suggestedBy?: string | null
}

interface GoalsCardProps {
  goals: Goal[]
}

export function GoalsCard({ goals }: GoalsCardProps) {
  const displayGoals = goals.slice(0, 3)

  return (
    <div className="bg-gradient-to-br from-sage-50 to-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base text-warm-800">
          Goals
        </h3>
        <Link
          to="/goals"
          className="text-xs text-warm-400 hover:text-warm-600 transition-colors"
        >
          {goals.length > 3 ? `View all ${goals.length}` : 'Manage'}
        </Link>
      </div>

      {displayGoals.length > 0 ? (
        <ul className="space-y-3">
          {displayGoals.map((goal) => (
            <li key={goal.id} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-warm-300 flex-shrink-0 flex items-center justify-center">
                {goal.status === 'completed' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-warm-900 leading-tight">
                  {goal.title}
                </p>
                {goal.description && (
                  <p className="text-xs text-warm-400 mt-0.5 line-clamp-1">
                    {goal.description}
                  </p>
                )}
                {goal.source === 'ai' && (
                  <span className="inline-block mt-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    AI suggested
                  </span>
                )}
                {goal.dueDate && (
                  <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    new Date(goal.dueDate) < new Date() ? 'text-coral-700 bg-coral-50' :
                    new Date(goal.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 ? 'text-amber-700 bg-amber-50' :
                    'text-warm-500 bg-warm-100'
                  }`}>
                    Due {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-warm-400 mb-3">
            No goals yet
          </p>
          <Link
            to="/goals"
            className="text-sm text-coral-500 font-medium hover:text-coral-600 transition-colors"
          >
            Add your first goal
          </Link>
        </div>
      )}
    </div>
  )
}
