import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  buildAgreementSlipRepairDraft,
  buildConversationAgreementDraft,
  buildConversationAgreementGoalDraft,
} from './conversation-agreement-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

const CONVERSATION_AGREEMENT_FIELDS = [
  {
    id: 'pausePhrase',
    title: 'Pause phrase',
    placeholder: 'Example: yellow light',
  },
  {
    id: 'phoneBoundary',
    title: 'Phone boundary',
    placeholder: 'Example: phones face down until both feel heard',
  },
  {
    id: 'repairWindow',
    title: 'Repair window',
    placeholder: 'Example: before sleep, 24 hours, Sunday night',
  },
  {
    id: 'topicBoundary',
    title: 'Do not mix in',
    placeholder: 'Example: old arguments not part of this decision',
  },
] as const

type ConversationAgreementField = (typeof CONVERSATION_AGREEMENT_FIELDS)[number]['id']

export function ConversationAgreementCard({ partnerName }: { partnerName: string }) {
  const { locale, t } = useI18n()
  const [notes, setNotes] = useState<Record<ConversationAgreementField, string>>({
    pausePhrase: '',
    phoneBoundary: '',
    repairWindow: '',
    topicBoundary: '',
  })
  const storageKey = 'amore-conversation-agreement-notes'
  const draft = buildConversationAgreementDraft(partnerName, notes, locale)
  const slipRepairDraft = buildAgreementSlipRepairDraft(partnerName, notes, locale)
  const goalDraft = buildConversationAgreementGoalDraft(notes, locale)
  const hasNotes = Object.values(notes).some((note) => note.trim())

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setNotes((current) => ({
          ...current,
          ...(parsed as Partial<Record<ConversationAgreementField, string>>),
        }))
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes))
  }, [notes])

  const updateNote = (field: ConversationAgreementField, value: string) => {
    setNotes((current) => ({ ...current, [field]: value }))
  }

  const clearNotes = () => {
    setNotes({
      pausePhrase: '',
      phoneBoundary: '',
      repairWindow: '',
      topicBoundary: '',
    })
  }

  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(14,116,144,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
            {t('Before conflict')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{t('Make the hard-talk rules while calm')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {t('Most couples do not need a bigger speech when tension rises. They need a shared stop sign, a repair window, and one boundary that keeps the conversation from spreading everywhere.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => storeChatDraft(draft, locale)}
              className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              {t('Propose agreement')}
            </Link>
            <Link
              to="/chat"
              onClick={() => storeChatDraft(slipRepairDraft, locale)}
              className="inline-flex rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              {t('Repair agreement slip')}
            </Link>
            {goalDraft && (
              <Link
                to="/goals"
                onClick={() => storeGoalDraft(goalDraft, locale)}
                className="inline-flex rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              >
                {t('Make agreement goal')}
              </Link>
            )}
            {hasNotes && (
              <button
                type="button"
                onClick={clearNotes}
                className="inline-flex rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-50"
              >
                {t('Clear')}
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONVERSATION_AGREEMENT_FIELDS.map((field) => (
            <label key={field.id} className="rounded-2xl border border-sky-100 bg-white/75 p-4">
              <span className="text-sm font-semibold text-warm-900">{t(field.title)}</span>
              <textarea
                value={notes[field.id]}
                onChange={(event) => updateNote(field.id, event.target.value)}
                placeholder={t(field.placeholder)}
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/20"
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
