import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  HOT_MOMENT_STATES,
  buildHotMomentReturnDraft,
  buildHotMomentResetDraft,
  type HotMomentState,
} from './hot-moment-reset-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'

const HOT_MOMENT_OPTIONS = Object.entries(HOT_MOMENT_STATES) as Array<[
  HotMomentState,
  (typeof HOT_MOMENT_STATES)[HotMomentState],
]>

export function HotMomentResetCard() {
  const { locale, t } = useI18n()
  const [state, setState] = useState<HotMomentState>('flooded')
  const defaultReturnTime = locale === 'pt-BR' ? '20 minutos' : '20 minutes'
  const defaultResetAction =
    locale === 'pt-BR'
      ? 'fazer uma caminhada curta e anotar o que eu ouvi'
      : 'take a short walk and write down what I heard'
  const [returnTime, setReturnTime] = useState(defaultReturnTime)
  const [resetAction, setResetAction] = useState(defaultResetAction)
  const draft = buildHotMomentResetDraft({ state, returnTime, resetAction, locale })
  const returnDraft = buildHotMomentReturnDraft({ state, returnTime, locale })

  useEffect(() => {
    setReturnTime((current) => {
      if (current === '20 minutes') return defaultReturnTime
      if (current === '20 minutos') return defaultReturnTime
      return current
    })
    setResetAction((current) => {
      if (current === 'take a short walk and write down what I heard') return defaultResetAction
      if (current === 'fazer uma caminhada curta e anotar o que eu ouvi') return defaultResetAction
      return current
    })
  }, [defaultResetAction, defaultReturnTime])

  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(185,28,28,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
            {t('Hot moment')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{t('Pause without disappearing')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {t('Use this when the conversation is too activated to keep going well. The draft protects the bond, names a return time, and makes the pause accountable.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => storeChatDraft(draft, locale)}
              className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              {t('Send pause request')}
            </Link>
            <Link
              to="/chat"
              onClick={() => storeChatDraft(returnDraft, locale)}
              className="inline-flex rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              {t('Return script')}
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {HOT_MOMENT_OPTIONS.map(([value, option]) => (
              <button
                key={value}
                type="button"
                onClick={() => setState(value)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  state === value
                    ? 'border-red-300 bg-white text-red-800'
                    : 'border-red-100 bg-white/65 text-warm-700 hover:border-red-200 hover:bg-white'
                }`}
              >
                <span className="block text-sm font-semibold">{t(option.label)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-500">{t(option.body)}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-red-100 bg-white/75 p-4">
              <span className="text-sm font-semibold text-warm-900">{t('Return time')}</span>
              <input
                value={returnTime}
                onChange={(event) => setReturnTime(event.target.value)}
                className="mt-2 w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400/20"
                placeholder={t('20 minutes')}
              />
            </label>
            <label className="rounded-2xl border border-red-100 bg-white/75 p-4">
              <span className="text-sm font-semibold text-warm-900">{t('While I pause, I will...')}</span>
              <input
                value={resetAction}
                onChange={(event) => setResetAction(event.target.value)}
                className="mt-2 w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400/20"
                placeholder={t('breathe and come back ready to listen')}
              />
            </label>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">{t('Draft preview')}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-warm-700">{draft}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
