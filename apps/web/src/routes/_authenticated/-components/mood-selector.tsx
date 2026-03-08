import { useState } from 'react'
import { setMood } from '~/server/mood'

type Mood = 'great' | 'good' | 'neutral' | 'low' | 'struggling'
type Visibility = 'silent' | 'visible' | 'alert'

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '\u{1F60A}', label: 'Great' },
  { value: 'good', emoji: '\u{1F642}', label: 'Good' },
  { value: 'neutral', emoji: '\u{1F610}', label: 'Neutral' },
  { value: 'low', emoji: '\u{1F614}', label: 'Low' },
  { value: 'struggling', emoji: '\u{1F622}', label: 'Struggling' },
]

const VISIBILITIES: { value: Visibility; label: string; description: string }[] = [
  { value: 'silent', label: 'Silent', description: 'Only you can see this' },
  { value: 'visible', label: 'Visible', description: 'Your partner can see your mood' },
  { value: 'alert', label: 'Alert', description: 'Notify your partner immediately' },
]

export function MoodSelector({ onMoodSet }: { onMoodSet?: () => void }) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [visibility, setVisibility] = useState<Visibility | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

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
          Saved
        </p>
      </div>
    )
  }

  return (
    <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <h3 className="font-display text-base text-warm-800 mb-4">
        How are you feeling?
      </h3>

      {/* Mood buttons */}
      <div className="flex justify-between gap-1">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => {
              setSelectedMood(m.value)
              setVisibility(null)
            }}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all ${
              selectedMood === m.value
                ? 'bg-coral-50 ring-2 ring-coral-400 scale-110 shadow-md animate-mood-bounce'
                : selectedMood
                  ? 'opacity-50 hover:opacity-75'
                  : 'hover:bg-warm-50 hover:scale-105'
            }`}
          >
            <span className="text-[40px]">{m.emoji}</span>
            <span className="text-xs text-warm-600">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Visibility picker — appears after mood selection */}
      {selectedMood && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-warm-500 tracking-wide">
            Sharing
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
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional note — appears after visibility selection */}
      {selectedMood && visibility && (
        <div className="mt-4 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            rows={2}
            className="w-full text-sm border border-warm-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-coral-300 placeholder:text-warm-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-coral-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-coral-600 shadow-md shadow-coral-200/50 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Set Mood'}
          </button>
        </div>
      )}
    </div>
  )
}
