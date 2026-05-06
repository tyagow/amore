import { Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import type { getInsightsData } from '~/server/insights'
import {
  buildConflictRepairDraft,
  buildGoalSuggestionDraft,
  buildGoalSuggestionGoalDraft,
} from './coaching-actions'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'
import { useI18n } from '~/lib/i18n'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// ── helpers ──────────────────────────────────────────────────────────────

function formatDate(d: string | Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(d: string | Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warm-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-warm-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      </div>
      <p className="text-sm text-warm-400">{message}</p>
    </div>
  )
}

// ── Category badge ───────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
      {category}
    </span>
  )
}

// ── Expandable Coaching Tip Card ─────────────────────────────────────────

function TipCard({
  insight,
}: {
  insight: InsightsData['allInsights'][number]
}) {
  const [expanded, setExpanded] = useState(false)
  const c = insight.content as Record<string, unknown>

  const tip = String(c.tip ?? c.text ?? c.summary ?? c.title ?? '')
  const category = String(c.category ?? '')
  const context = String(c.context ?? '')

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-4 bg-warm-50 rounded-xl hover:bg-warm-100/60 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <svg
            className={`w-4 h-4 text-warm-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {category && <CategoryBadge category={category} />}
            {insight.generatedAt && (
              <span className="text-[10px] text-warm-300">{formatShortDate(insight.generatedAt)}</span>
            )}
          </div>
          <p className="text-sm text-warm-800">{tip}</p>
          {expanded && context && (
            <p className="text-xs text-warm-400 italic mt-2 leading-relaxed">{context}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Active Tips ──────────────────────────────────────────────────────────

function ActiveTips({ tips }: { tips: InsightsData['allInsights'] }) {
  if (tips.length === 0) return null

  // Most recent batch: same generatedAt or last 10
  const latest = tips[0]
  const latestTs = latest.generatedAt ? new Date(latest.generatedAt).getTime() : 0
  const batch = latestTs
    ? tips.filter((t) => t.generatedAt && Math.abs(new Date(t.generatedAt).getTime() - latestTs) < 60_000)
    : tips.slice(0, 10)

  const activeTips = batch.length > 0 ? batch : tips.slice(0, 10)

  return (
    <div className="space-y-2">
      {activeTips.map((tip) => (
        <TipCard key={tip.id} insight={tip} />
      ))}
    </div>
  )
}

// ── Tip History ──────────────────────────────────────────────────────────

function TipHistory({ tips }: { tips: InsightsData['allInsights'] }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Group by date (not the latest batch)
  const groups = useMemo(() => {
    if (tips.length === 0) return []

    // Skip the latest batch
    const latestTs = tips[0].generatedAt ? new Date(tips[0].generatedAt).getTime() : 0
    const older = latestTs
      ? tips.filter((t) => !t.generatedAt || Math.abs(new Date(t.generatedAt).getTime() - latestTs) >= 60_000)
      : []

    if (older.length === 0) return []

    const map = new Map<string, typeof tips>()
    for (const t of older) {
      const dateKey = t.generatedAt ? formatDate(t.generatedAt) : 'Unknown'
      const arr = map.get(dateKey) ?? []
      arr.push(t)
      map.set(dateKey, arr)
    }

    return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
  }, [tips])

  if (groups.length === 0) return null

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.date}>
          <button
            type="button"
            onClick={() => setOpenGroup(openGroup === group.date ? null : group.date)}
            className="w-full flex items-center justify-between p-3 bg-warm-50 rounded-xl hover:bg-warm-100/60 transition-colors"
          >
            <span className="text-sm font-medium text-warm-600">{group.date}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-400">{group.items.length} tips</span>
              <svg
                className={`w-4 h-4 text-warm-400 transition-transform ${openGroup === group.date ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>
          {openGroup === group.date && (
            <div className="mt-2 space-y-2 pl-3 border-l-2 border-warm-100 ml-3">
              {group.items.map((tip) => {
                const c = tip.content as Record<string, unknown>
                const text = String(c.tip ?? c.text ?? c.summary ?? '')
                const category = String(c.category ?? '')
                return (
                  <div key={tip.id} className="p-3 bg-warm-50/60 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {category && <CategoryBadge category={category} />}
                    </div>
                    <p className="text-sm text-warm-700">{text}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Goal Suggestions ─────────────────────────────────────────────────────

function GoalSuggestions({ goals }: { goals: InsightsData['allInsights'] }) {
  const { locale } = useI18n()
  if (goals.length === 0) return null

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const c = goal.content as Record<string, unknown>
        const title = String(c.title ?? c.text ?? '')
        const description = String(c.description ?? c.context ?? '')

        return (
          <div key={goal.id} className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800">{title}</p>
                {description && (
                  <p className="text-xs text-emerald-600/70 mt-1 leading-relaxed">{description}</p>
                )}
                {goal.generatedAt && (
                  <p className="text-[10px] text-emerald-400 mt-1.5">{formatShortDate(goal.generatedAt)}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalSuggestionDraft(title, description, locale), locale)
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Discuss with partner
                  </Link>
                  <Link
                    to="/goals"
                    onClick={() => {
                      storeGoalDraft(buildGoalSuggestionGoalDraft(title, description, locale), locale)
                    }}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    Make it a goal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Conflict Alerts ──────────────────────────────────────────────────────

function ConflictAlerts({ alerts }: { alerts: InsightsData['allInsights'] }) {
  const { locale } = useI18n()
  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const c = alert.content as Record<string, unknown>
        const message = String(c.message ?? c.text ?? c.summary ?? '')
        const score = c.score != null ? Number(c.score) : null
        const severity = alert.severity ?? 'warning'

        return (
          <div key={alert.id} className="p-4 bg-red-50/60 rounded-xl border border-red-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-coral-100 text-coral-700'
                    }`}
                  >
                    {severity}
                  </span>
                  {score !== null && (
                    <span className="text-[10px] text-red-400">Score: {score.toFixed(1)}</span>
                  )}
                </div>
                <p className="text-sm text-red-800">{message}</p>
                {alert.generatedAt && (
                  <p className="text-[10px] text-red-300 mt-1.5">{formatShortDate(alert.generatedAt)}</p>
                )}
                <Link
                  to="/chat"
                  onClick={() => {
                    storeChatDraft(buildConflictRepairDraft(message, locale), locale)
                  }}
                  className="mt-3 inline-flex rounded-lg bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-coral-600"
                >
                  Draft softer repair
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export function CoachingTab({ data }: { data: InsightsData }) {
  const coachingTips = useMemo(
    () => data.allInsights.filter((i) => i.type === 'coaching_tip'),
    [data.allInsights],
  )
  const goalSuggestions = useMemo(
    () => data.allInsights.filter((i) => i.type === 'goal_suggestion'),
    [data.allInsights],
  )
  const conflictAlerts = useMemo(
    () => data.allInsights.filter((i) => i.type === 'conflict_alert'),
    [data.allInsights],
  )

  const hasAnything = coachingTips.length > 0 || goalSuggestions.length > 0 || conflictAlerts.length > 0

  if (!hasAnything) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <EmptyState message="No coaching insights yet. Run an analysis from the dashboard to get personalized tips, goal suggestions, and relationship guidance." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Tips */}
      {coachingTips.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Active Tips</h3>
          <ActiveTips tips={coachingTips} />
        </div>
      )}

      {/* Tip History */}
      {coachingTips.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Tip History</h3>
          <TipHistory tips={coachingTips} />
        </div>
      )}

      {/* Goal Suggestions */}
      {goalSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <h3 className="font-display text-base text-warm-800 mb-4">Goal Suggestions</h3>
          <GoalSuggestions goals={goalSuggestions} />
        </div>
      )}

      {/* Conflict Alerts */}
      {conflictAlerts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-display text-base text-warm-800">Conflict Alerts</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-500">
              {conflictAlerts.length}
            </span>
          </div>
          <ConflictAlerts alerts={conflictAlerts} />
        </div>
      )}
    </div>
  )
}
