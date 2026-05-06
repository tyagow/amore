import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  buildWeeklyNeedRequestDraft,
  buildWeeklyPromiseGoalDraft,
  buildWeeklyResetDraft,
} from './weekly-reset-draft'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

const WEEKLY_RESET_STEPS = [
  {
    id: 'appreciate',
    title: 'Appreciate',
    body: 'What did I notice and value this week?',
  },
  {
    id: 'hard-thing',
    title: 'Name the hard thing',
    body: 'What felt heavy, lonely, or unresolved?',
  },
  {
    id: 'need',
    title: 'Ask for one need',
    body: 'What would help me feel closer next week?',
  },
  {
    id: 'promise',
    title: 'Make one promise',
    body: 'What is small enough that we will actually do it?',
  },
]

export function WeeklyResetRitual({ partnerName }: { partnerName: string }) {
  const { locale, t } = useI18n()
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({})
  const storageKey = 'amore-weekly-reset-progress'
  const notesStorageKey = 'amore-weekly-reset-notes'
  const draft = buildWeeklyResetDraft(partnerName, stepNotes, locale)
  const needDraft = buildWeeklyNeedRequestDraft(partnerName, stepNotes, locale)
  const promiseGoalDraft = buildWeeklyPromiseGoalDraft(stepNotes, locale)
  const progress = Math.round((completedSteps.length / WEEKLY_RESET_STEPS.length) * 100)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setCompletedSteps(parsed.filter((step): step is string => typeof step === 'string'))
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem(notesStorageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setStepNotes(parsed as Record<string, string>)
      }
    } catch {
      window.localStorage.removeItem(notesStorageKey)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(completedSteps))
  }, [completedSteps])

  useEffect(() => {
    window.localStorage.setItem(notesStorageKey, JSON.stringify(stepNotes))
  }, [stepNotes])

  const toggleStep = (stepId: string) => {
    setCompletedSteps((current) =>
      current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId],
    )
  }

  const updateStepNote = (stepId: string, value: string) => {
    setStepNotes((current) => ({
      ...current,
      [stepId]: value,
    }))
  }

  const clearReset = () => {
    setCompletedSteps([])
    setStepNotes({})
  }

  return (
    <section className="rounded-3xl border border-warm-200 bg-white/75 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lavender-500">
            {t('Weekly ritual')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">{t('The 15-minute relationship reset')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {t('The app should help you build a relationship habit, not just inspect data. Do this once a week when things are calm.')}
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-warm-500">
              <span>
                {locale === 'pt-BR'
                  ? `${completedSteps.length} de ${WEEKLY_RESET_STEPS.length} concluido`
                  : `${completedSteps.length} of ${WEEKLY_RESET_STEPS.length} done`}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-warm-100">
              <div
                className="h-full rounded-full bg-lavender-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(draft, locale)
              }}
              className="inline-flex rounded-xl bg-lavender-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
            >
              {t('Send reset summary')}
            </Link>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(needDraft, locale)
              }}
              className="inline-flex rounded-xl border border-lavender-200 bg-white px-4 py-2 text-sm font-semibold text-lavender-700 transition-colors hover:bg-lavender-50"
            >
              {t('Ask for need')}
            </Link>
            {promiseGoalDraft && (
              <Link
                to="/goals"
                onClick={() => {
                  storeGoalDraft(promiseGoalDraft, locale)
                }}
                className="inline-flex rounded-xl border border-lavender-200 bg-white px-4 py-2 text-sm font-semibold text-lavender-700 transition-colors hover:bg-lavender-50"
              >
                {t('Make promise a goal')}
              </Link>
            )}
            {(completedSteps.length > 0 || Object.values(stepNotes).some((note) => note.trim())) && (
              <button
                type="button"
                onClick={clearReset}
                className="inline-flex rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-600 transition-colors hover:bg-warm-50"
              >
                {t('Reset')}
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WEEKLY_RESET_STEPS.map((step) => (
            <div
              key={step.id}
              className={`rounded-2xl p-4 text-left transition-colors ${
                completedSteps.includes(step.id)
                  ? 'bg-lavender-50 ring-1 ring-lavender-200'
                  : 'bg-warm-50'
              }`}
            >
              <span className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    completedSteps.includes(step.id)
                      ? 'border-lavender-500 bg-lavender-500 text-white'
                      : 'border-warm-300 bg-white text-transparent'
                  }`}
                >
                  {completedSteps.includes(step.id) && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </button>
                <span>
                  <span className="block text-sm font-semibold text-warm-900">{t(step.title)}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-warm-500">{t(step.body)}</span>
                </span>
              </span>
              <textarea
                value={stepNotes[step.id] ?? ''}
                onChange={(event) => updateStepNote(step.id, event.target.value)}
                placeholder={t('Write a sentence you can share...')}
                rows={2}
                className="mt-3 w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-lavender-400 focus:outline-none focus:ring-1 focus:ring-lavender-400/20"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
