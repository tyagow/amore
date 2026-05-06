import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { setMood } from '~/server/mood'
import { storeChatDraft } from '~/lib/chat-draft-storage'
import { useI18n } from '~/lib/i18n'
import {
  SUPPORT_NEEDS,
  buildCheckinDraft,
  getSupportNeedText,
  type CheckinMood,
  type SupportNeed,
} from './daily-checkin-support'

type Mood = CheckinMood
type Visibility = 'silent' | 'visible' | 'alert'

const MOODS: { value: Mood; emoji: string; labelKey: string }[] = [
  { value: 'great', emoji: '\u{1F60A}', labelKey: 'Great' },
  { value: 'good', emoji: '\u{1F642}', labelKey: 'Good' },
  { value: 'neutral', emoji: '\u{1F610}', labelKey: 'Neutral' },
  { value: 'low', emoji: '\u{1F614}', labelKey: 'Low' },
  { value: 'struggling', emoji: '\u{1F622}', labelKey: 'Struggling' },
]

const VISIBILITIES: { value: Visibility; label: string; description: string }[] = [
  { value: 'silent', label: 'Silent', description: 'Only you can see this' },
  { value: 'visible', label: 'Visible', description: 'Your partner can see your mood' },
  { value: 'alert', label: 'Alert', description: 'Notify your partner immediately' },
]

export function MoodSelector({ onMoodSet }: { onMoodSet?: () => void }) {
  const { locale, t } = useI18n()
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [visibility, setVisibility] = useState<Visibility | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<SupportNeed | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const supportNeeds = SUPPORT_NEEDS.map((need) => ({
    ...need,
    ...(getSupportNeedText(need.value, locale) ?? {}),
  }))

  async function handleSubmit() {
    if (!selectedMood || !visibility) return

    setSubmitting(true)
    try {
      await setMood({
        data: { mood: selectedMood, visibility, note: note.trim() || undefined },
      })
      setConfirmation(true)
      setTimeout(() => {
        setSelectedMood(null)
        setVisibility(null)
        setSelectedSupport(null)
        setNote('')
        setConfirmation(false)
        onMoodSet?.()
      }, 2000)
    } catch (err) {
      console.error('Failed to set mood:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <div className="bg-coral-50 rounded-2xl shadow-sm p-6 text-center">
        <span className="text-3xl animate-float-up inline-block">
          {MOODS.find((m) => m.value === selectedMood)?.emoji}
        </span>
        <p className="text-sm text-warm-600 mt-2 flex items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {t('Saved')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <h3 className="font-display text-base text-warm-800 mb-4">
        {t('How are you feeling?')}
      </h3>

      {/* Mood buttons */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => {
              setSelectedMood(m.value)
              setVisibility(null)
              setSelectedSupport(null)
            }}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-3 transition-all sm:px-4 ${
              selectedMood === m.value
                ? 'bg-coral-50 ring-2 ring-coral-400 scale-110 shadow-md animate-mood-bounce'
                : selectedMood
                  ? 'opacity-50 hover:opacity-75'
                  : 'hover:bg-warm-50 hover:scale-105'
            }`}
          >
            <span className="text-[30px] leading-none sm:text-[40px]">{m.emoji}</span>
            <span className="max-w-full truncate text-[11px] text-warm-600 sm:text-xs">{t(m.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Visibility picker — appears after mood selection */}
      {selectedMood && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-warm-500 tracking-wide">
            {t('Sharing')}
          </p>
          <div className="flex gap-2">
            {VISIBILITIES.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVisibility(v.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  visibility === v.value
                    ? 'bg-coral-500 text-white'
                    : 'bg-warm-200 text-warm-600 hover:bg-warm-300'
                }`}
              >
                {t(v.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional note — appears after visibility selection */}
      {selectedMood && visibility && (
        <div className="mt-4 space-y-3">
          {visibility !== 'silent' && (
            <div className="rounded-2xl border border-warm-200 bg-white/70 p-3">
              <p className="text-sm font-semibold text-warm-900">
                {t('What would help your partner support you?')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {supportNeeds.map((need) => (
                  <button
                    key={need.value}
                    type="button"
                    onClick={() => {
                      setSelectedSupport(need.value)
                      setNote(need.answer)
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedSupport === need.value
                        ? 'border-coral-400 bg-coral-50 text-coral-700'
                        : 'border-warm-200 bg-white text-warm-600 hover:border-coral-200 hover:bg-coral-50'
                    }`}
                  >
                    {need.label}
                  </button>
                ))}
              </div>
              <Link
                to="/chat"
                onClick={() => {
                  storeChatDraft(buildCheckinDraft(selectedMood, selectedSupport, locale), locale)
                }}
                className="mt-3 inline-flex rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-100"
              >
                {t('Draft support message')}
              </Link>
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Add a note (optional)...')}
            rows={2}
            className="w-full text-sm border border-warm-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-coral-300 placeholder:text-warm-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-coral-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-coral-600 shadow-md shadow-coral-200/50 disabled:opacity-50 transition-colors"
          >
            {submitting ? t('Saving...') : t('Set Mood')}
          </button>
        </div>
      )}
    </div>
  )
}
