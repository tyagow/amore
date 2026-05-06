import { Link } from '@tanstack/react-router'
import { buildDailyConnectionQuestion } from './daily-connection-question'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

export function DailyConnectionQuestionCard({
  partnerName,
  healthScore,
  partnerMood,
  partnerInterests,
  onOpenCoach,
}: {
  partnerName: string
  healthScore: number | null
  partnerMood: { mood: string } | null
  partnerInterests: unknown
  onOpenCoach: (prompt: string) => void
}) {
  const { locale, t } = useI18n()
  const item = buildDailyConnectionQuestion({
    partnerName,
    healthScore,
    partnerMood,
    partnerInterests,
    locale,
  })

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(194,138,46,0.08)]">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            {item.label}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{item.title}</h2>
          <p className="mt-2 text-base font-semibold leading-relaxed text-warm-800">
            {item.question}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-600">{item.reason}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:w-44 md:flex-col">
          <Link
            to="/chat"
            onClick={() => storeChatDraft(item.chatDraft, locale)}
            className="inline-flex justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            {t('Ask in chat')}
          </Link>
          <Link
            to="/goals"
            onClick={() => storeGoalDraft(item.goalDraft, locale)}
            className="inline-flex justify-center rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            {t('Make a goal')}
          </Link>
          <button
            type="button"
            onClick={() => onOpenCoach(item.coachPrompt)}
            className="inline-flex justify-center rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-50"
          >
            {t('Ask coach')}
          </button>
        </div>
      </div>
    </section>
  )
}
