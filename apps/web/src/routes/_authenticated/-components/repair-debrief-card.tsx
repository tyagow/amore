import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  buildRepairDebriefDraft,
  buildRepairDebriefGoalDraft,
  buildRepairLandingCheckDraft,
} from './repair-debrief-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

const REPAIR_DEBRIEF_FIELDS = [
  {
    id: 'understood',
    title: 'What I heard',
    placeholder: 'What did your partner need you to understand?',
  },
  {
    id: 'ownership',
    title: 'What I own',
    placeholder: 'What is your part without over-explaining?',
  },
  {
    id: 'reassurance',
    title: 'Reassurance',
    placeholder: 'What do they need to know is still true?',
  },
  {
    id: 'nextStep',
    title: 'Next step',
    placeholder: 'What tiny action will you actually do?',
  },
] as const

type RepairDebriefField = (typeof REPAIR_DEBRIEF_FIELDS)[number]['id']

export function RepairDebriefCard({ partnerName }: { partnerName: string }) {
  const { locale, t } = useI18n()
  const [notes, setNotes] = useState<Record<RepairDebriefField, string>>({
    understood: '',
    ownership: '',
    reassurance: '',
    nextStep: '',
  })
  const storageKey = 'amore-repair-debrief-notes'
  const draft = buildRepairDebriefDraft(partnerName, notes, locale)
  const landingCheckDraft = buildRepairLandingCheckDraft(partnerName, notes, locale)
  const goalDraft = buildRepairDebriefGoalDraft(notes, locale)
  const hasNotes = Object.values(notes).some((note) => note.trim())

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setNotes((current) => ({ ...current, ...(parsed as Partial<Record<RepairDebriefField, string>>) }))
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes))
  }, [notes])

  const updateNote = (field: RepairDebriefField, value: string) => {
    setNotes((current) => ({ ...current, [field]: value }))
  }

  const clearNotes = () => {
    setNotes({
      understood: '',
      ownership: '',
      reassurance: '',
      nextStep: '',
    })
  }

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_28px_rgba(190,24,93,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
            {t('After repair')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{t('Keep the repair from evaporating')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {t('A hard talk only helps if both people leave with something remembered, something owned, and one small follow-through.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => storeChatDraft(draft, locale)}
              className="inline-flex rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
            >
              {t('Send debrief')}
            </Link>
            <Link
              to="/chat"
              onClick={() => storeChatDraft(landingCheckDraft, locale)}
              className="inline-flex rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              {t('Check if landed')}
            </Link>
            {goalDraft && (
              <Link
                to="/goals"
                onClick={() => storeGoalDraft(goalDraft, locale)}
                className="inline-flex rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                {t('Make follow-through goal')}
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
          {REPAIR_DEBRIEF_FIELDS.map((field) => (
            <label key={field.id} className="rounded-2xl border border-rose-100 bg-white/75 p-4">
              <span className="text-sm font-semibold text-warm-900">{t(field.title)}</span>
              <textarea
                value={notes[field.id]}
                onChange={(event) => updateNote(field.id, event.target.value)}
                placeholder={t(field.placeholder)}
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/20"
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
