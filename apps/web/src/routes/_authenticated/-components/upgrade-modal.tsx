import { useEffect, useMemo, useState } from 'react'
import {
  UPGRADE_EVENT,
  type UpgradeGateDetail,
} from '~/lib/upgrade-gate'
import { useI18n } from '~/lib/i18n'

const FEATURE_COPY: Record<string, {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
}> = {
  coach_message: {
    eyebrow: 'Daily limit reached',
    title: 'Keep the coach conversation going',
    description:
      'Free accounts include 3 coach messages per day. Premium removes that cap so support is available whenever a relationship moment is happening.',
    bullets: [
      'Unlimited coach conversations',
      'Unlimited tone reviews and reply suggestions',
      'Advanced relationship insights',
    ],
  },
  tone_review: {
    eyebrow: 'Daily limit reached',
    title: 'Review every message before you send it',
    description:
      'Free accounts get 1 tone review per day. Premium keeps revision support available for every important message.',
    bullets: [
      'Unlimited tone reviews',
      'AI reply suggestions',
      'Live mood analysis during chat',
    ],
  },
  manual_analysis: {
    eyebrow: 'Weekly limit reached',
    title: 'Run analysis whenever your relationship needs a reset',
    description:
      'Free accounts include 1 full analysis each week. Premium unlocks unlimited re-analysis as conversations evolve.',
    bullets: [
      'Unlimited manual analysis',
      'Advanced insights tabs',
      'Persistent coaching context',
    ],
  },
  reply_suggestions: {
    eyebrow: 'Premium feature',
    title: 'Unlock AI reply suggestions',
    description:
      'Premium can draft helpful responses in the tone your relationship needs right now.',
    bullets: [
      'Context-aware reply suggestions',
      'Live mood analysis',
      'Unlimited coach support',
    ],
  },
  live_mood: {
    eyebrow: 'Premium feature',
    title: 'See the emotional temperature in real time',
    description:
      'Premium monitors the live conversation so you can adjust before a message lands the wrong way.',
    bullets: [
      'Live mood analysis',
      'Reply suggestions',
      'Advanced insights',
    ],
  },
  profile_editing: {
    eyebrow: 'Premium feature',
    title: 'Customize your relationship profile',
    description:
      'Premium lets you override AI-detected patterns with the way you and your partner actually communicate.',
    bullets: [
      'Edit profile signals manually',
      'Improve coaching accuracy',
      'Unlock advanced insights',
    ],
  },
}

function formatResetAt(resetAt: string | undefined, locale: string) {
  if (!resetAt) return null

  const parsed = new Date(resetAt)
  if (Number.isNaN(parsed.getTime())) return null

  return new Intl.DateTimeFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

export function UpgradeModal() {
  const { locale, t } = useI18n()
  const [detail, setDetail] = useState<UpgradeGateDetail | null>(null)

  useEffect(() => {
    const onUpgradeRequired = (event: Event) => {
      const customEvent = event as CustomEvent<UpgradeGateDetail>
      setDetail(customEvent.detail)
    }

    window.addEventListener(UPGRADE_EVENT, onUpgradeRequired)
    return () => window.removeEventListener(UPGRADE_EVENT, onUpgradeRequired)
  }, [])

  useEffect(() => {
    if (!detail) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [detail])

  const copy = useMemo(() => {
    if (!detail) return null
    return FEATURE_COPY[detail.feature] ?? {
      eyebrow: 'Premium feature',
      title: 'Unlock premium access',
      description:
        'Upgrade to Amore Premium to remove limits and unlock the full relationship support toolkit.',
      bullets: [
        'Unlimited coach and AI tools',
        'Advanced insights',
        'Editable relationship profile',
      ],
    }
  }, [detail])

  if (!detail || !copy) return null

  const resetAt = formatResetAt(detail.resetAt, locale)
  const upgradeUrl = detail.upgradeUrl ?? '/pricing'

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-warm-950/45 px-4 pb-4 pt-12 sm:items-center">
      <button
        aria-label={t('Close upgrade modal')}
        className="absolute inset-0 cursor-default"
        onClick={() => setDetail(null)}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,_rgba(255,250,246,0.98)_0%,_rgba(255,244,236,0.98)_100%)] shadow-[0_24px_70px_rgba(42,33,24,0.28)]">
        <div className="border-b border-coral-100 bg-coral-500 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral-100">
            {t(copy.eyebrow)}
          </p>
          <h2 className="mt-2 font-display text-3xl leading-tight">
            {t(copy.title)}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-coral-50">
            {t(copy.description)}
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          {(typeof detail.limit === 'number' || resetAt) && (
            <div className="rounded-2xl border border-coral-100 bg-white/80 p-4 text-sm text-warm-700">
              {typeof detail.limit === 'number' && (
                <p>
                  {t('You have used')} {detail.used ?? detail.limit} {t('of')} {detail.limit} {t('free uses for this window.')}
                </p>
              )}
              {resetAt && (
                <p className="mt-1 text-warm-500">
                  {t('Free access resets on')} {resetAt}.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {copy.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-warm-200 bg-white/85 px-4 py-3"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m5 12 4 4L19 6" />
                  </svg>
                </div>
                <p className="text-sm text-warm-800">{t(bullet)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={upgradeUrl}
              className="flex-1 rounded-full bg-coral-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-coral-600"
            >
              {t('See premium plans')}
            </a>
            <button
              onClick={() => setDetail(null)}
              className="rounded-full border border-warm-300 px-5 py-3 text-sm font-semibold text-warm-700 transition-colors hover:bg-white"
            >
              {t('Maybe later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
