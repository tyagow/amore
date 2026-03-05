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
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 text-center">
        <span className="text-3xl">
          {MOODS.find((m) => m.value === selectedMood)?.emoji}
        </span>
        <p className="text-sm text-stone-600 mt-2">Mood saved</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
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
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              selectedMood === m.value
                ? 'bg-stone-100 ring-2 ring-stone-400'
                : 'hover:bg-stone-50'
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs text-stone-600">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Visibility picker — appears after mood selection */}
      {selectedMood && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Sharing
          </p>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITIES.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVisibility(v.value)}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  visibility === v.value
                    ? 'border-stone-400 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <span className="text-sm font-medium text-stone-800 block">
                  {v.label}
                </span>
                <span className="text-xs text-stone-400 leading-tight block">
                  {v.description}
                </span>
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
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Set Mood'}
          </button>
        </div>
      )}
    </div>
  )
}
