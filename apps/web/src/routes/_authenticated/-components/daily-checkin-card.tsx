import { useState } from 'react'
import { submitDailyCheckin } from '~/server/checkin'
import { useRouter } from '@tanstack/react-router'

type Mood = 'great' | 'good' | 'neutral' | 'low' | 'struggling'

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '\u{1F60A}', label: 'Great' },
  { value: 'good', emoji: '\u{1F642}', label: 'Good' },
  { value: 'neutral', emoji: '\u{1F610}', label: 'Neutral' },
  { value: 'low', emoji: '\u{1F614}', label: 'Low' },
  { value: 'struggling', emoji: '\u{1F622}', label: 'Struggling' },
]

interface CheckinData {
  checkin: {
    id: string
    mood: string
    note: string | null
    question: string
    answer: string | null
    date: string
  } | null
  partnerCheckedIn: boolean
  streak: {
    currentStreak: number
    longestStreak: number
    lastCheckinDate: string | null
  }
  question: string
}

export function DailyCheckinCard({ data }: { data: CheckinData }) {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!data.checkin)
  const [streakCount, setStreakCount] = useState(data.streak.currentStreak)

  // Already checked in today — show collapsed state
  if (submitted || data.checkin) {
    const mood = data.checkin?.mood ?? selectedMood
    const moodInfo = MOODS.find((m) => m.value === mood)
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Checked in today {moodInfo ? `${moodInfo.emoji}` : ''}
            </p>
            <p className="text-xs text-emerald-600">
              {data.partnerCheckedIn
                ? 'Your partner checked in too!'
                : 'Waiting for your partner...'}
            </p>
          </div>
        </div>
        {streakCount > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-full">
            <span className="text-base">🔥</span>
            <span className="text-sm font-bold text-emerald-700">{streakCount}</span>
            <span className="text-xs text-emerald-600">day{streakCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    )
  }

  // Check-in form
  const handleSubmit = async () => {
    if (!selectedMood) return

    setSubmitting(true)
    try {
      const result = await submitDailyCheckin({
        data: {
          mood: selectedMood,
          answer: answer.trim() || undefined,
        },
      })
      setStreakCount(result.streak.currentStreak)
      setSubmitted(true)
      // Refresh dashboard data in background
      router.invalidate()
    } catch (err) {
      console.error('Failed to submit check-in:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-coral-50 to-amber-50 border border-coral-200 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">✨</span>
        <h3 className="font-display text-base text-warm-800">Daily Check-in</h3>
      </div>

      <p className="text-sm text-warm-600 mb-4 leading-relaxed">
        {data.question}
      </p>

      {/* Mood selector */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setSelectedMood(m.value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-3 transition-all sm:px-4 ${
              selectedMood === m.value
                ? 'bg-coral-50 ring-2 ring-coral-400 scale-110 shadow-md'
                : selectedMood
                  ? 'opacity-50 hover:opacity-75'
                  : 'hover:bg-warm-50 hover:scale-105'
            }`}
          >
            <span className="text-3xl sm:text-[40px]">{m.emoji}</span>
            <span className="max-w-full truncate text-[10px] text-warm-600 sm:text-xs">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Optional answer text */}
      {selectedMood && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Share your thoughts (optional)..."
            rows={2}
            maxLength={500}
            className="w-full text-sm border border-warm-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-coral-300 placeholder:text-warm-400 bg-white/70"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-coral-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-coral-600 shadow-md shadow-coral-200/50 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Check In'}
          </button>
        </div>
      )}
    </div>
  )
}
