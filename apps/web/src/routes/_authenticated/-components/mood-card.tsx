import { formatTimeAgo } from '~/lib/format'

interface MoodData {
  mood: string
  note: string | null
  createdAt: string | Date
  source?: string | null
}

interface MoodCardProps {
  myMood: MoodData | null
  partnerMood: MoodData | null
  partnerName: string | null
}

const MOOD_EMOJI: Record<string, string> = {
  great: '\u{1F60A}',
  good: '\u{1F642}',
  neutral: '\u{1F610}',
  low: '\u{1F614}',
  struggling: '\u{1F622}',
}

const MOOD_LABEL: Record<string, string> = {
  great: 'Great',
  good: 'Good',
  neutral: 'Neutral',
  low: 'Low',
  struggling: 'Struggling',
}

function MoodDisplay({ label, mood }: { label: string; mood: MoodData }) {
  const emoji = MOOD_EMOJI[mood.mood] ?? '\u{1F610}'
  const moodLabel = MOOD_LABEL[mood.mood] ?? mood.mood

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-warm-900">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-warm-500">{moodLabel}</p>
          <span className="text-xs text-warm-400">{'\u00B7'} {formatTimeAgo(mood.createdAt)}</span>
          {mood.source === 'ai_detected' && (
            <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">AI</span>
          )}
        </div>
        {mood.note && (
          <p className="text-xs text-warm-400 mt-0.5 italic">
            &ldquo;{mood.note}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

export function MoodCard({ myMood, partnerMood, partnerName }: MoodCardProps) {
  return (
    <div className="bg-gradient-to-br from-coral-50/40 to-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
      <h3 className="font-display text-base text-warm-800 mb-4">
        Mood Check-in
      </h3>

      <div className="space-y-4">
        {myMood ? (
          <MoodDisplay label="You" mood={myMood} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl opacity-40">{'\u{1F914}'}</span>
            <div>
              <p className="text-sm font-medium text-warm-900">You</p>
              <p className="text-sm text-warm-400">
                How are you feeling today?
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-warm-200" />

        {partnerMood ? (
          <MoodDisplay label={partnerName ?? 'Partner'} mood={partnerMood} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl opacity-40">{'\u{1F610}'}</span>
            <div>
              <p className="text-sm font-medium text-warm-900">
                {partnerName ?? 'Partner'}
              </p>
              <p className="text-sm text-warm-400">No mood shared yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

