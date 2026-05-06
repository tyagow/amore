import { Link } from '@tanstack/react-router'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'
import {
  canRevealRitualComparison,
  type PersonalizedRitual,
} from './personalized-ritual-engine'

export function PersonalizedRitualCard({
  ritual,
  partnerName,
  dailyCheckin,
  onOpenCoach,
}: {
  ritual: PersonalizedRitual
  partnerName: string
  dailyCheckin: {
    checkin: { answer?: string | null } | null
    partnerCheckin: { answer?: string | null } | null
  }
  onOpenCoach: (prompt: string) => void
}) {
  const { locale, t } = useI18n()
  const canRevealComparison = canRevealRitualComparison(dailyCheckin)

  return (
    <section className="rounded-3xl border border-sage-200 bg-sage-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_8px_24px_rgba(90,117,98,0.10)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-700">
            {t('Personalized ritual')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{t(ritual.title)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-700">{t(ritual.body)}</p>
          <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-xs leading-relaxed text-sage-800">
            {t(ritual.reason)} {t('Rotates with cooldown so the same practice does not keep repeating.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenCoach(ritual.coachPrompt(partnerName))}
              className="rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-700"
            >
              {t('Coach me through it')}
            </button>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(ritual.chatDraft(partnerName, locale), locale)
              }}
              className="rounded-xl border border-sage-200 bg-white px-4 py-2 text-sm font-semibold text-sage-800 transition-colors hover:bg-sage-100"
            >
              {t(ritual.actionLabel)}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-sage-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">
            {t('Both answer first')}
          </p>
          {canRevealComparison ? (
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-warm-700">
              <p>
                <span className="font-semibold text-warm-900">{t('You')}:</span>{' '}
                {dailyCheckin.checkin?.answer}
              </p>
              <p>
                <span className="font-semibold text-warm-900">{partnerName}:</span>{' '}
                {dailyCheckin.partnerCheckin?.answer}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-warm-600">
              {t('Comparison stays hidden until both partners answer today. This keeps the ritual mutual instead of turning one person into the preview.')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
