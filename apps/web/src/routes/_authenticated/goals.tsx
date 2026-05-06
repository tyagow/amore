import { createFileRoute, Link } from '@tanstack/react-router'
import type { InferSelectModel } from 'drizzle-orm'
import { useCallback, useEffect, useState } from 'react'
import type { coupleGoals } from '@amore-couples/db/schema'
import {
  getActiveGoals,
  getCompletedGoals,
  createGoal,
  completeGoal,
  dismissGoal,
  getAISuggestedGoals,
} from '~/server/goals'
import {
  buildGoalCelebrationDraft,
  buildGoalDiscussionDraft,
  buildGoalMidweekCheckInDraft,
  buildGoalRenegotiationDraft,
  buildGoalSlipRepairDraft,
  buildGoalSupportPlanDraft,
  buildGoalTodayDraft,
  buildCareSwapInviteDraft,
  buildChangedBehaviorApologyInviteDraft,
  formatGoalDueDate,
  parseStoredGoalDraft,
} from './-goal-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'

export const Route = createFileRoute('/_authenticated/goals')({
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      return { hasCouple: false as const, active: [], completed: [] }
    }
    const [active, completed] = await Promise.all([
      getActiveGoals(),
      getCompletedGoals(),
    ])
    return { hasCouple: true as const, active, completed }
  },
  component: GoalsPage,
})

// ── Types ───────────────────────────────────────────────

interface GoalSuggestion {
  title: string
  description: string
  reason: string
}

type CoupleGoal = InferSelectModel<typeof coupleGoals>
type CoupleGoalsData = {
  hasCouple: true
  active: CoupleGoal[]
  completed: CoupleGoal[]
}

function getTinyGoalTemplates(locale: 'en' | 'pt-BR') {
  if (locale === 'pt-BR') {
    return [
      {
        title: 'Uma mensagem de apreciacao todos os dias',
        description: 'Envie uma apreciacao especifica por dia. Mantenha concreto: o que voce percebeu, por que importou e como fez voce se sentir.',
        chatDraft: 'Quero que a gente tente uma pratica pequena do relacionamento nesta semana: uma mensagem especifica de apreciacao por dia. Nada grande, so uma coisa que percebemos e valorizamos.',
      },
      {
        title: 'Uma conversa sem celular nesta semana',
        description: 'Escolham uma janela de 20 minutos sem celulares, sem consertar e sem multitarefa. So perguntar o que foi bom e o que foi dificil.',
        chatDraft: 'Podemos escolher uma janela de 20 minutos sem celular nesta semana? Sem consertar, sem multitarefa. So o que foi bom, o que foi dificil e o que ajudaria a gente a se sentir mais perto.',
      },
      {
        title: 'Reparar tensao em ate 24 horas',
        description: 'Quando algo ficar mal resolvido, comecar com apreciacao, assumir uma parte e perguntar para entender antes de se defender.',
        chatDraft: 'Podemos fazer uma pequena promessa nesta semana? Se algo ficar mal resolvido, tentamos reparar em ate 24 horas: apreciacao primeiro, assumir uma parte e depois perguntar para entender.',
      },
      {
        title: 'Uma troca de cuidado nesta semana',
        description: 'Cada pessoa nomeia um pequeno pedido de apoio pratico e uma oferta de apoio para que o cuidado fique explicito em vez de adivinhado.',
        chatDraft: buildCareSwapInviteDraft(locale),
      },
      {
        title: 'Um pedido de desculpas com mudanca',
        description: 'Assumir um impacto especifico, nomear o comportamento que vai mudar e perguntar se o reparo realmente chegaria.',
        chatDraft: buildChangedBehaviorApologyInviteDraft(locale),
      },
    ]
  }

  return [
  {
    title: 'One appreciation message every day',
    description: 'Send one specific appreciation each day. Keep it concrete: what you noticed, why it mattered, and how it made you feel.',
    chatDraft: 'I want us to try one tiny relationship practice this week: one specific appreciation message each day. Nothing big, just one thing we noticed and valued.',
  },
  {
    title: 'One phone-free conversation this week',
    description: 'Pick one 20-minute window with no phones, no fixing, and no multitasking. Just ask what felt good and what felt hard.',
    chatDraft: 'Could we pick one 20-minute phone-free window this week? No fixing, no multitasking. Just what felt good, what felt hard, and what would help us feel closer.',
  },
  {
    title: 'Repair tension within 24 hours',
    description: 'When something feels unresolved, start with appreciation, own one part, and ask to understand before defending.',
    chatDraft: 'Can we make a small promise this week? If something feels unresolved, we try to repair within 24 hours: appreciation first, own one part, then ask to understand.',
  },
  {
    title: 'One care swap this week',
    description: 'Each person names one small practical support request and one support offer so care becomes explicit instead of guessed.',
    chatDraft: buildCareSwapInviteDraft(),
  },
  {
    title: 'One apology with changed behavior',
    description: 'Own one specific impact, name the behavior that will change, and ask whether the repair would actually land.',
    chatDraft: buildChangedBehaviorApologyInviteDraft(locale),
  },
]
}

function oneWeekFromToday(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

// ── Page Component ──────────────────────────────────────

function GoalsPage() {
  const data = Route.useLoaderData()

  if (!data.hasCouple) {
    return <GoalsEmptyState />
  }

  return <CoupleGoalsPage data={data} />
}

function GoalsEmptyState() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-900">Goals</h1>
          <p className="text-warm-500 mt-1">Things you want to work on together</p>
        </div>
      </div>
      <div className="bg-warm-100 rounded-2xl p-8 text-center">
        <p className="text-warm-500 mb-4">Connect with your partner to set shared goals.</p>
        <Link to="/connect" className="text-coral-500 font-medium hover:underline">Connect now</Link>
      </div>
    </div>
  )
}

function CoupleGoalsPage({ data }: { data: CoupleGoalsData }) {
  const { locale, t } = useI18n()
  const [activeGoals, setActiveGoals] = useState(data.active)
  const [completedGoals, setCompletedGoals] = useState(data.completed)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentlyCompletedGoal, setRecentlyCompletedGoal] = useState<(typeof data.active)[number] | null>(null)

  // ── Add Goal Form State ─────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const applyStoredGoalDraft = useCallback(() => {
    const draft = window.localStorage.getItem('amore-goal-draft')
    if (!draft) return

    window.localStorage.removeItem('amore-goal-draft')
    const storedGoal = parseStoredGoalDraft(draft, oneWeekFromToday())
    setTitle(storedGoal.title)
    setDescription(storedGoal.description)
    setDueDate(storedGoal.dueDate)
    setShowAddForm(true)
  }, [])

  useEffect(() => {
    applyStoredGoalDraft()

    const checkAfterClick = () => {
      window.setTimeout(applyStoredGoalDraft, 0)
    }

    window.addEventListener('amore:goal-draft-ready', applyStoredGoalDraft)
    window.addEventListener('click', checkAfterClick)

    return () => {
      window.removeEventListener('amore:goal-draft-ready', applyStoredGoalDraft)
      window.removeEventListener('click', checkAfterClick)
    }
  }, [applyStoredGoalDraft])

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
        setRecentlyCompletedGoal(goal)
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
          source: 'ai_suggested',
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

  const tinyGoalTemplates = getTinyGoalTemplates(locale)

  const handleCreateTemplate = async (template: ReturnType<typeof getTinyGoalTemplates>[number]) => {
    setError(null)
    setSubmitting(true)
    try {
      const result = await createGoal({
        data: {
          title: template.title,
          description: template.description,
          dueDate: oneWeekFromToday(),
        },
      })
      setActiveGoals((prev) => [result.goal, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-900">Goals</h1>
          <p className="text-warm-500 mt-1">
            Things you want to work on together
          </p>
        </div>
        <Link
          to="/dashboard"
          search={{ upgraded: false }}
          className="text-sm text-warm-500 hover:text-warm-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Tiny Goal Templates */}
      <section className="mb-6 rounded-2xl border border-sage-500/15 bg-sage-50 p-5">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-500">
            Start tiny
          </p>
          <h2 className="font-display text-xl text-warm-900">
            Choose one couple practice for this week
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-warm-600">
            The best goal is small enough to do even on a busy day.
          </p>
        </div>
        <div className="grid gap-3">
          {tinyGoalTemplates.map((template) => (
            <div
              key={template.title}
              className="rounded-2xl border border-warm-200 bg-white/80 p-4 transition-colors hover:border-sage-500/40 hover:bg-white"
            >
              <p className="text-sm font-semibold text-warm-900">{template.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-warm-500">{template.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateTemplate(template)}
                  disabled={submitting}
                  className="rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  Create for this week
                </button>
                <Link
                  to="/chat"
                  onClick={() => storeChatDraft(template.chatDraft, locale)}
                  className="rounded-lg border border-sage-500/20 bg-white px-3 py-1.5 text-xs font-semibold text-sage-600 transition-colors hover:bg-sage-50"
                >
                  Invite partner first
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {recentlyCompletedGoal && (
        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Goal completed
          </p>
          <h2 className="mt-1 font-display text-xl text-warm-900">
            Celebrate what worked before moving on
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-warm-600">
            You completed {recentlyCompletedGoal.title}. Turn it into one moment of appreciation and learning together.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildGoalCelebrationDraft(recentlyCompletedGoal, locale), locale)
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Celebrate in chat
            </Link>
            <button
              type="button"
              onClick={() => setRecentlyCompletedGoal(null)}
              className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Goal'}
        </button>
        <button
          onClick={handleGetSuggestions}
          disabled={loadingSuggestions}
          className="px-4 py-2 border border-coral-200 text-coral-700 text-sm rounded-lg font-medium hover:bg-coral-50 disabled:opacity-50 transition-colors"
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
        <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 mb-6">
          <h2 className="font-display text-base text-warm-800 mb-4">
            New Goal
          </h2>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label
                htmlFor="goalTitle"
                className="block text-sm font-medium text-warm-700 mb-1"
              >
                Title
              </label>
              <input
                id="goalTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                placeholder="e.g. Weekly date night"
              />
            </div>
            <div>
              <label
                htmlFor="goalDescription"
                className="block text-sm font-medium text-warm-700 mb-1"
              >
                Description{' '}
                <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="goalDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent resize-none"
                placeholder="What does this goal look like?"
              />
            </div>
            <div>
              <label
                htmlFor="goalDueDate"
                className="block text-sm font-medium text-warm-700 mb-1"
              >
                Due Date{' '}
                <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <input
                id="goalDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="w-full py-2.5 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-300 shadow-sm shadow-coral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Goal'}
            </button>
          </form>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="font-display text-base text-warm-800">
            AI Suggestions
          </h2>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.title}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-900">
                    {suggestion.title}
                  </p>
                  <p className="text-sm text-warm-600 mt-1">
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
                  className="px-3 py-1.5 bg-coral-500 text-white text-xs rounded-lg font-medium hover:bg-coral-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDismissSuggestion(suggestion)}
                  className="px-3 py-1.5 border border-warm-300 text-warm-600 text-xs rounded-lg font-medium hover:bg-warm-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Goals */}
      <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 mb-6">
        <h2 className="font-display text-base text-warm-800 mb-4">
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
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-warm-300 flex-shrink-0 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                  title="Mark complete"
                >
                  {processingId === goal.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-warm-300 animate-pulse" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-warm-900 leading-tight">
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-warm-400 mt-0.5">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {goal.source === 'ai_suggested' && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        AI suggested
                      </span>
                    )}
                    {goal.dueDate && (
                      <span className="text-[10px] text-warm-400">
                        {t('Due')} {formatGoalDueDate(goal.dueDate, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalDiscussionDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-sage-500/20 bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-100"
                    >
                      Discuss in chat
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalTodayDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-100"
                    >
                      Do today
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalMidweekCheckInDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-100"
                    >
                      Check progress
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalSupportPlanDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                    >
                      Plan support
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalRenegotiationDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      Make easier
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalSlipRepairDraft(goal, locale), locale)
                      }}
                      className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      Repair slip
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(goal.id)}
                  disabled={processingId === goal.id}
                  className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-warm-500 disabled:opacity-50 transition-opacity"
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
            <p className="text-sm text-warm-400">
              No active goals yet. Add one above or get AI suggestions.
            </p>
          </div>
        )}
      </div>

      {/* Completed Goals (Collapsible) */}
      {completedGoals.length > 0 && (
        <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="font-display text-base text-warm-800">
              Completed ({completedGoals.length})
            </h2>
            <svg
              className={`w-4 h-4 text-warm-400 transition-transform ${showCompleted ? 'rotate-180' : ''}`}
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
                    <p className="text-sm font-medium text-warm-400 leading-tight line-through">
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-warm-300 mt-0.5">
                        {goal.description}
                      </p>
                    )}
                    <Link
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildGoalCelebrationDraft(goal, locale), locale)
                      }}
                      className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Celebrate in chat
                    </Link>
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
