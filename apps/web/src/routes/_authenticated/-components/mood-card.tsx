interface MoodData {
  mood: string
  note: string | null
  createdAt: string | Date
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
      <div>
        <p className="text-sm font-medium text-stone-900">{label}</p>
        <p className="text-sm text-stone-500">{moodLabel}</p>
        {mood.note && (
          <p className="text-xs text-stone-400 mt-0.5 italic">
            &ldquo;{mood.note}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

export function MoodCard({ myMood, partnerMood, partnerName }: MoodCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
        Mood Check-in
      </h3>

      <div className="space-y-4">
        {myMood ? (
          <MoodDisplay label="You" mood={myMood} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl opacity-40">{'\u{1F914}'}</span>
            <div>
              <p className="text-sm font-medium text-stone-900">You</p>
              <p className="text-sm text-stone-400">
                How are you feeling today?
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-stone-100" />

        {partnerMood ? (
          <MoodDisplay label={partnerName ?? 'Partner'} mood={partnerMood} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl opacity-40">{'\u{1F610}'}</span>
            <div>
              <p className="text-sm font-medium text-stone-900">
                {partnerName ?? 'Partner'}
              </p>
              <p className="text-sm text-stone-400">No mood shared yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
