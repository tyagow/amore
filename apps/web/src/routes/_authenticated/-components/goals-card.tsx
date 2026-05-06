import { Link } from '@tanstack/react-router'
import {
  buildGoalDiscussionDraft,
  buildGoalMidweekCheckInDraft,
  buildGoalProgressAppreciationDraft,
  buildGoalRenegotiationDraft,
  buildGoalSlipRepairDraft,
  buildGoalSupportPlanDraft,
  buildGoalTodayDraft,
} from '../-goal-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'

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
  const { locale, t } = useI18n()
  const displayGoals = goals.slice(0, 3)

  return (
    <div className="bg-gradient-to-br from-sage-50 to-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base text-warm-800">
          {t('Goals')}
        </h3>
        <Link
          to="/goals"
          className="text-xs text-warm-400 hover:text-warm-600 transition-colors"
        >
          {goals.length > 3
            ? locale === 'pt-BR'
              ? `Ver todos ${goals.length}`
              : `View all ${goals.length}`
            : t('Manage')}
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
                  {t(goal.title)}
                </p>
                {goal.description && (
                  <p className="text-xs text-warm-400 mt-0.5 line-clamp-1">
                    {t(goal.description)}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {goal.source === 'ai' && (
                    <span className="inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {t('AI suggested')}
                    </span>
                  )}
                  <GoalDueDate dueDate={goal.dueDate} />
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalDiscussionDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-sage-500/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-sage-700 transition-colors hover:bg-sage-50"
                  >
                    {t('Discuss')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalTodayDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-coral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-coral-700 transition-colors hover:bg-coral-50"
                  >
                    {t('Do today')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalMidweekCheckInDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-50"
                  >
                    {t('Check progress')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalSlipRepairDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    {t('Repair slip')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalSupportPlanDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                  >
                    {t('Plan support')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalProgressAppreciationDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    {t('Notice progress')}
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => {
                      storeChatDraft(buildGoalRenegotiationDraft(goal, locale), locale)
                    }}
                    className="inline-flex rounded-lg border border-warm-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-warm-700 transition-colors hover:bg-warm-50"
                  >
                    {t('Make easier')}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-sage-500/15 bg-white/55 p-4">
          <p className="text-sm font-semibold text-warm-800">
            {t('Start with one promise you can keep this week.')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-warm-500">
            {t('Try: one phone-free dinner, one appreciation message, or one repair conversation after tension.')}
          </p>
          <Link
            to="/goals"
            className="mt-4 inline-flex rounded-xl bg-sage-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {t('Create a tiny goal')}
          </Link>
        </div>
      )}
    </div>
  )
}

function GoalDueDate({ dueDate }: { dueDate?: string | Date | null }) {
  const { locale } = useI18n()
  if (!dueDate) return null

  const date = typeof dueDate === 'string' ? parseDateOnly(dueDate) : dueDate
  if (Number.isNaN(date.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const diff = day.getTime() - today.getTime()

  const tone = diff < 0
    ? 'text-coral-700 bg-coral-50'
    : diff < 3 * 24 * 60 * 60 * 1000
      ? 'text-amber-700 bg-amber-50'
      : 'text-warm-500 bg-warm-100'

  return (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${tone}`}>
      {locale === 'pt-BR' ? 'Vence' : 'Due'}{' '}
      {date.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })}
    </span>
  )
}

function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return new Date(value)

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}
