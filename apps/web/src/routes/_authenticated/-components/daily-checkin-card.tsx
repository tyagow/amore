import { useState } from 'react'
import { submitDailyCheckin } from '~/server/checkin'
import { Link, useRouter } from '@tanstack/react-router'
import { getDailyQuestion } from '@amore-couples/ai/daily-questions'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'
import {
  CHECKIN_GUIDANCE,
  SUPPORT_NEEDS,
  buildCheckinDraft,
  buildPartnerCheckinThanksDraft,
  buildPartnerCheckinInviteDraft,
  buildPartnerSupportAvoidanceDraft,
  buildPartnerSupportResponseDraft,
  buildReciprocalSupportDraft,
  buildSupportAvoidanceDraft,
  buildSupportCoachPrompt,
  buildSupportFollowupDraft,
  buildSupportGoalDraft,
  buildSupportLandingCheckDraft,
  buildSupportThanksDraft,
  buildTonightPlanDraft,
  inferSupportNeedFromAnswer,
  type CheckinMood,
  type SupportNeed,
} from './daily-checkin-support'
import { DailyCheckinRhythm } from './daily-checkin-rhythm'

const MOODS: { value: CheckinMood; emoji: string; label: string }[] = [
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
  partnerCheckin: {
    id: string
    mood: string
    note: string | null
    question: string
    answer: string | null
    date: string
  } | null
  partnerCheckedIn: boolean
  recentCheckins: Array<{
    date: string
    mineMood: string | null
    partnerMood: string | null
    bothCheckedIn: boolean
  }>
  streak: {
    currentStreak: number
    longestStreak: number
    lastCheckinDate: string | null
  }
  question: string
}

export function DailyCheckinCard({ data, partnerName }: { data: CheckinData; partnerName: string }) {
  const router = useRouter()
  const { locale, t } = useI18n()
  const [selectedMood, setSelectedMood] = useState<CheckinMood | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<SupportNeed | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!data.checkin)
  const [streakCount, setStreakCount] = useState(data.streak.currentStreak)
  const todayQuestion = getDailyQuestion(new Date().toISOString().slice(0, 10), locale)

  // Already checked in today — show collapsed state
  if (submitted || data.checkin) {
    const mood = data.checkin?.mood ?? selectedMood
    const moodInfo = MOODS.find((m) => m.value === mood)
    const supportNeed = selectedSupport ?? inferSupportNeedFromAnswer(data.checkin?.answer)
    const support = SUPPORT_NEEDS.find((need) => need.value === supportNeed)
    const partnerSupportNeed = inferSupportNeedFromAnswer(data.partnerCheckin?.answer)
    const partnerSupport = SUPPORT_NEEDS.find((need) => need.value === partnerSupportNeed)
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-4">
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
          <div className="flex items-center gap-2">
            {!data.partnerCheckedIn && (
              <Link
                to="/chat"
                onClick={() => {
                  storeChatDraft(buildPartnerCheckinInviteDraft(partnerName, supportNeed, locale), locale)
                }}
                className="inline-flex rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-white"
              >
                Invite theirs
              </Link>
            )}
            {streakCount > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-full">
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold text-emerald-700">{streakCount}</span>
                <span className="text-xs text-emerald-600">day{streakCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        {support && supportNeed && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Today support ask
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              {support.label}: {support.answer}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildSupportFollowupDraft(supportNeed, locale), locale)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Tell partner
              </Link>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildTonightPlanDraft(mood, supportNeed, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Make tonight plan
              </Link>
              <Link
                to="/goals"
                onClick={() => storeGoalDraft(buildSupportGoalDraft(supportNeed, undefined, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Make support goal
              </Link>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildReciprocalSupportDraft(partnerName, supportNeed, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Ask theirs too
              </Link>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildSupportThanksDraft(partnerName, supportNeed, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Thank after help
              </Link>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildSupportLandingCheckDraft(partnerName, supportNeed, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Check if it landed
              </Link>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildSupportAvoidanceDraft(partnerName, supportNeed, locale), locale)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Name what not to do
              </Link>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem('amore-coach-draft', buildSupportCoachPrompt(supportNeed, locale))
                  window.dispatchEvent(new CustomEvent('amore:open-coach'))
                }}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Ask coach
              </button>
            </div>
          </div>
        )}
        {partnerSupport && partnerSupportNeed && (
          <div className="mt-3 rounded-xl border border-sage-500/20 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">
              {partnerName} support ask
            </p>
            <p className="mt-1 text-sm text-warm-800">
              {partnerSupport.label}: {partnerSupport.answer}
            </p>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildPartnerSupportResponseDraft(partnerName, partnerSupportNeed, locale), locale)
              }}
              className="mt-3 inline-flex rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Respond with care
            </Link>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildPartnerCheckinThanksDraft(partnerName, partnerSupportNeed, locale), locale)
              }}
              className="ml-2 mt-3 inline-flex rounded-lg border border-sage-500/20 bg-white px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50"
            >
              Thank first
            </Link>
            <Link
              to="/goals"
              onClick={() => storeGoalDraft(buildSupportGoalDraft(partnerSupportNeed, partnerName, locale), locale)}
              className="ml-2 mt-3 inline-flex rounded-lg border border-sage-500/20 bg-white px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50"
            >
              Make support goal
            </Link>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildPartnerSupportAvoidanceDraft(partnerName, partnerSupportNeed, locale), locale)
              }}
              className="ml-2 mt-3 inline-flex rounded-lg border border-sage-500/20 bg-white px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50"
            >
              Ask what to avoid
            </Link>
          </div>
        )}
        <DailyCheckinRhythm
          recentCheckins={data.recentCheckins}
          partnerName={partnerName}
        />
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
          locale,
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
        {locale === 'pt-BR' ? todayQuestion : data.question}
      </p>

      {/* Mood selector */}
      <div className="mb-4 grid grid-cols-5 gap-1 sm:gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setSelectedMood(m.value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-3 transition-all sm:px-4 ${
              selectedMood === m.value
                ? 'bg-coral-50 ring-2 ring-coral-400 scale-110 shadow-md'
                : selectedMood
                  ? 'opacity-50 hover:opacity-75'
                  : 'hover:bg-warm-50 hover:scale-105'
            }`}
          >
            <span className="text-[30px] leading-none sm:text-[40px]">{m.emoji}</span>
            <span className="max-w-full truncate text-[11px] text-warm-600 sm:text-xs">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Optional answer text */}
      {selectedMood && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-coral-100 bg-white/70 p-4">
            <p className="text-sm font-semibold text-warm-900">
              {CHECKIN_GUIDANCE[selectedMood].title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-warm-500">
              {CHECKIN_GUIDANCE[selectedMood].body}
            </p>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildCheckinDraft(selectedMood, selectedSupport, locale), locale)
              }}
              className="mt-3 inline-flex rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-100"
            >
              Draft this message
            </Link>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(buildTonightPlanDraft(selectedMood, selectedSupport, locale), locale)
              }}
              className="mt-3 ml-2 inline-flex rounded-xl border border-sage-500/25 bg-sage-50 px-3 py-2 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-100"
            >
              Make tonight plan
            </Link>
          </div>
          <div className="rounded-2xl border border-warm-200 bg-white/70 p-4">
            <p className="text-sm font-semibold text-warm-900">
              What would help your partner support you?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUPPORT_NEEDS.map((need) => (
                <button
                  key={need.value}
                  type="button"
                  onClick={() => {
                    setSelectedSupport(need.value)
                    setAnswer(need.answer)
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
          </div>
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
