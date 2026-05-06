import { Link } from '@tanstack/react-router'
import { buildMicroDatePlan, buildMicroDateRescheduleDraft } from './micro-date-plan'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

export function MicroDatePlanCard({
  partnerName,
  healthScore,
  partnerMood,
  partnerInterests,
}: {
  partnerName: string
  healthScore: number | null
  partnerMood: { mood: string } | null
  partnerInterests: unknown
}) {
  const { locale, t } = useI18n()
  const plan = buildMicroDatePlan({
    partnerName,
    healthScore,
    partnerMood,
    partnerInterests,
    locale,
  })
  const rescheduleDraft = buildMicroDateRescheduleDraft(partnerName, locale)

  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(79,70,229,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            {plan.label} · {plan.timebox}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{plan.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">{plan.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => storeChatDraft(plan.chatDraft, locale)}
              className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {t('Invite in chat')}
            </Link>
            <Link
              to="/goals"
              onClick={() => storeGoalDraft(plan.goalDraft, locale)}
              className="inline-flex rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {t('Make it a goal')}
            </Link>
            <Link
              to="/chat"
              onClick={() => storeChatDraft(rescheduleDraft, locale)}
              className="inline-flex rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
            >
              {t('Reschedule kindly')}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {plan.steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-700">
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
