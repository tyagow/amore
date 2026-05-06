import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  REPAIR_CHOICE_MODES,
  buildRepairChoiceDraft,
  type RepairChoiceMode,
} from './repair-choice-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'

const REPAIR_MODES = Object.entries(REPAIR_CHOICE_MODES) as Array<[
  RepairChoiceMode,
  (typeof REPAIR_CHOICE_MODES)[RepairChoiceMode],
]>

export function RepairChoiceCard({ partnerName }: { partnerName: string }) {
  const { locale, t } = useI18n()
  const [mode, setMode] = useState<RepairChoiceMode>('listen')
  const defaultContext =
    locale === 'pt-BR'
      ? 'Eu fiquei defensivo quando falamos sobre os planos'
      : 'I got defensive when we talked about plans'
  const [context, setContext] = useState(defaultContext)
  const draft = buildRepairChoiceDraft(mode, context, partnerName, locale)

  useEffect(() => {
    setContext((current) => {
      if (current === 'I got defensive when we talked about plans') return defaultContext
      if (current === 'Eu fiquei defensivo quando falamos sobre os planos') return defaultContext
      return current
    })
  }, [defaultContext])

  return (
    <section className="rounded-3xl border border-coral-100 bg-white p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_14px_34px_rgba(238,108,77,0.08)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-600">
            {t('Repair chooser')}
          </p>
          <h2 className="font-display text-2xl text-warm-900">{t('Pick the message that lowers the heat')}</h2>
        </div>
        <Link
          to="/chat"
          onClick={() => storeChatDraft(draft, locale)}
          className="inline-flex shrink-0 rounded-xl bg-coral-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-600"
        >
          {t('Send this draft')}
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <label className="block rounded-2xl border border-warm-200 bg-warm-50 p-4">
            <span className="text-sm font-semibold text-warm-900">{t('What happened?')}</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm leading-relaxed text-warm-900 placeholder:text-warm-400 focus:border-coral-300 focus:outline-none focus:ring-1 focus:ring-coral-300/30"
              placeholder={t('One sentence is enough.')}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {REPAIR_MODES.map(([value, option]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  mode === value
                    ? 'border-coral-300 bg-coral-50 text-coral-800'
                    : 'border-warm-200 bg-white text-warm-700 hover:border-coral-200 hover:bg-coral-50/50'
                }`}
              >
                <span className="block text-sm font-semibold">{t(option.label)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-500">{t(option.body)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-warm-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">{t('Draft preview')}</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-warm-700">{draft}</p>
        </div>
      </div>
    </section>
  )
}
