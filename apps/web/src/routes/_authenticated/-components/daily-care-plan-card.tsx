import { Link } from '@tanstack/react-router'
import { buildDailyCarePlan } from './daily-care-plan'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

export function DailyCarePlanCard({
  partnerName,
  healthScore,
  partnerMood,
  partnerProfile,
  hasActiveGoals,
  onOpenCoach,
}: {
  partnerName: string
  healthScore: number | null
  partnerMood: { mood: string } | null
  partnerProfile: {
    loveLanguages?: unknown
    interests?: unknown
  } | null
  hasActiveGoals: boolean
  onOpenCoach: (prompt: string) => void
}) {
  const { locale, t } = useI18n()
  const plan = buildDailyCarePlan({
    partnerName,
    healthScore,
    partnerMood,
    partnerLoveLanguages: partnerProfile?.loveLanguages,
    partnerInterests: partnerProfile?.interests,
    hasActiveGoals,
    locale,
  })

  return (
    <section className="rounded-3xl border border-sage-500/20 bg-sage-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(69,103,76,0.08)]">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-700">
            {plan.label}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{plan.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">{plan.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => storeChatDraft(plan.chatDraft, locale)}
              className="inline-flex rounded-xl bg-sage-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {t('Draft message')}
            </Link>
            <Link
              to="/goals"
              onClick={() => storeGoalDraft(plan.goalDraft, locale)}
              className="inline-flex rounded-xl border border-sage-500/25 bg-white px-4 py-2 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-100"
            >
              {t('Make it a goal')}
            </Link>
            <button
              type="button"
              onClick={() => onOpenCoach(plan.coachPrompt)}
              className="inline-flex rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-50"
            >
              {t('Ask coach')}
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {plan.steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-sage-500/15 bg-white/75 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-warm-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
