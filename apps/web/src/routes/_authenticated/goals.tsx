import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getActiveGoals,
  getCompletedGoals,
  createGoal,
  completeGoal,
  dismissGoal,
  getAISuggestedGoals,
} from '~/server/goals'

export const Route = createFileRoute('/_authenticated/goals')({
  loader: async () => {
    const [active, completed] = await Promise.all([
      getActiveGoals(),
      getCompletedGoals(),
    ])
    return { active, completed }
  },
  component: GoalsPage,
})

// ── Types ───────────────────────────────────────────────

interface GoalSuggestion {
  title: string
  description: string
  reason: string
}

// ── Page Component ──────────────────────────────────────

function GoalsPage() {
  const data = Route.useLoaderData()
  const [activeGoals, setActiveGoals] = useState(data.active)
  const [completedGoals, setCompletedGoals] = useState(data.completed)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Add Goal Form State ─────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await createGoal({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
        },
      })
      setActiveGoals((prev) => [result.goal, ...prev])
      setTitle('')
      setDescription('')
      setDueDate('')
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (goalId: string) => {
    setProcessingId(goalId)
    setError(null)
    try {
      await completeGoal({ data: { goalId } })
      const goal = activeGoals.find((g) => g.id === goalId)
      setActiveGoals((prev) => prev.filter((g) => g.id !== goalId))
      if (goal) {
        setCompletedGoals((prev) => [
          { ...goal, status: 'completed' },
          ...prev,
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete goal')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (goalId: string) => {
    setProcessingId(goalId)
    setError(null)
    try {
      await dismissGoal({ data: { goalId } })
      setActiveGoals((prev) => prev.filter((g) => g.id !== goalId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss goal')
    } finally {
      setProcessingId(null)
    }
  }

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true)
    setError(null)
    setSuggestions([])
    try {
      const result = await getAISuggestedGoals()
      setSuggestions(result)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to get suggestions',
      )
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleAcceptSuggestion = async (suggestion: GoalSuggestion) => {
    setError(null)
    try {
      const result = await createGoal({
        data: {
          title: suggestion.title,
          description: suggestion.description,
          source: 'ai',
        },
      })
      setActiveGoals((prev) => [result.goal, ...prev])
      setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept goal')
    }
  }

  const handleDismissSuggestion = (suggestion: GoalSuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Goals</h1>
          <p className="text-stone-500 mt-1">
            Things you want to work on together
          </p>
        </div>
        <Link
          to="/dashboard"
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg font-medium hover:bg-stone-800 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Goal'}
        </button>
        <button
          onClick={handleGetSuggestions}
          disabled={loadingSuggestions}
          className="px-4 py-2 border border-stone-300 text-stone-700 text-sm rounded-lg font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          {loadingSuggestions ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Thinking...
            </span>
          ) : (
            'Get AI Suggestions'
          )}
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
            New Goal
          </h2>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label
                htmlFor="goalTitle"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Title
              </label>
              <input
                id="goalTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                placeholder="e.g. Weekly date night"
              />
            </div>
            <div>
              <label
                htmlFor="goalDescription"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Description{' '}
                <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="goalDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent resize-none"
                placeholder="What does this goal look like?"
              />
            </div>
            <div>
              <label
                htmlFor="goalDueDate"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Due Date{' '}
                <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                id="goalDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Goal'}
            </button>
          </form>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
            AI Suggestions
          </h2>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.title}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">
                    {suggestion.title}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">
                    {suggestion.description}
                  </p>
                  <p className="text-xs text-amber-700 mt-2 italic">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAcceptSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-stone-900 text-white text-xs rounded-lg font-medium hover:bg-stone-800 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDismissSuggestion(suggestion)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-600 text-xs rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Goals */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
          Active Goals
        </h2>
        {activeGoals.length > 0 ? (
          <ul className="space-y-3">
            {activeGoals.map((goal) => (
              <li
                key={goal.id}
                className="flex items-start gap-3 group"
              >
                <button
                  onClick={() => handleComplete(goal.id)}
                  disabled={processingId === goal.id}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                  title="Mark complete"
                >
                  {processingId === goal.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 animate-pulse" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 leading-tight">
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {goal.source === 'ai' && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        AI suggested
                      </span>
                    )}
                    {goal.dueDate && (
                      <span className="text-[10px] text-stone-400">
                        Due{' '}
                        {new Date(goal.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(goal.id)}
                  disabled={processingId === goal.id}
                  className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-500 disabled:opacity-50 transition-opacity"
                  title="Dismiss goal"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-stone-400">
              No active goals yet. Add one above or get AI suggestions.
            </p>
          </div>
        )}
      </div>

      {/* Completed Goals (Collapsible) */}
      {completedGoals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
              Completed ({completedGoals.length})
            </h2>
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform ${showCompleted ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {showCompleted && (
            <ul className="space-y-3 mt-4">
              {completedGoals.map((goal) => (
                <li key={goal.id} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-50 flex-shrink-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-400 leading-tight line-through">
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-stone-300 mt-0.5">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
