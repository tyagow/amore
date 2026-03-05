import { useState } from 'react'
import { confirmMoodDetection, dismissMoodDetection } from '~/server/mood-detection'

type Visibility = 'silent' | 'visible' | 'alert'

interface PendingDetection {
  id: string
  mood: string
  confidence: number
  reason: string
  generatedAt: string | Date
}

const MOOD_EMOJI: Record<string, string> = {
  great: '\u{1F60A}',
  good: '\u{1F642}',
  neutral: '\u{1F610}',
  low: '\u{1F614}',
  struggling: '\u{1F622}',
}

const MOOD_LABEL: Record<string, string> = {
  great: 'great',
  good: 'good',
  neutral: 'neutral',
  low: 'a bit low',
  struggling: 'struggling',
}

const VISIBILITIES: { value: Visibility; label: string; description: string }[] = [
  { value: 'silent', label: 'Just for me', description: 'Only you can see this' },
  { value: 'visible', label: 'Share', description: 'Your partner can see' },
  { value: 'alert', label: 'Alert', description: 'Notify your partner' },
]

export function MoodDetectionModal({
  detections,
  onResolved,
}: {
  detections: PendingDetection[]
  onResolved: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [selectedVisibility, setSelectedVisibility] = useState<Visibility | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (detections.length === 0 || currentIndex >= detections.length) {
    return null
  }

  const detection = detections[currentIndex]
  const emoji = MOOD_EMOJI[detection.mood] ?? '\u{1F610}'
  const moodLabel = MOOD_LABEL[detection.mood] ?? detection.mood

  async function handleConfirm() {
    if (!selectedVisibility) return

    setSubmitting(true)
    try {
      await confirmMoodDetection({
        data: { detectionId: detection.id, visibility: selectedVisibility },
      })
      advance()
    } catch (err) {
      console.error('Failed to confirm mood detection:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDismiss() {
    setSubmitting(true)
    try {
      await dismissMoodDetection({
        data: { detectionId: detection.id },
      })
      advance()
    } catch (err) {
      console.error('Failed to dismiss mood detection:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function advance() {
    setConfirming(false)
    setSelectedVisibility(null)
    if (currentIndex + 1 >= detections.length) {
      onResolved()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
        {/* Header strip */}
        <div className="bg-stone-50 px-5 py-3 flex items-center justify-between border-b border-stone-100">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Mood Check
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={submitting}
            className="text-stone-400 hover:text-stone-600 transition-colors text-sm"
            aria-label="Dismiss"
          >
            {'\u{2715}'}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {!confirming ? (
            <>
              {/* Detection prompt */}
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl mt-0.5">{emoji}</span>
                <div>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    It looks like you might be feeling{' '}
                    <span className="font-semibold">{moodLabel}</span>.
                    {' '}Is that right?
                  </p>
                  <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                    {detection.reason}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={submitting}
                  className="flex-1 bg-stone-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  Yes, that's right
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={submitting}
                  className="flex-1 border border-stone-200 text-stone-600 text-sm font-medium py-2 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
                >
                  Not quite
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Visibility picker */}
              <p className="text-sm text-stone-700 mb-3">
                How would you like to share this?
              </p>
              <div className="space-y-2 mb-4">
                {VISIBILITIES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSelectedVisibility(v.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                      selectedVisibility === v.value
                        ? 'border-stone-400 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-sm font-medium text-stone-800 block">
                      {v.label}
                    </span>
                    <span className="text-xs text-stone-400 block">
                      {v.description}
                    </span>
                  </button>
                ))}
              </div>

              {/* Confirm / Back */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting || !selectedVisibility}
                  className="flex-1 bg-stone-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false)
                    setSelectedVisibility(null)
                  }}
                  disabled={submitting}
                  className="px-4 border border-stone-200 text-stone-600 text-sm font-medium py-2 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
