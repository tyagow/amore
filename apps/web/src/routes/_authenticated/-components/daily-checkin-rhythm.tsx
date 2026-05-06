import { Link } from '@tanstack/react-router'
import {
  buildCheckinRhythmDraft,
  buildCheckinRhythmGoalDraft,
} from './daily-checkin-support'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

interface CheckinRhythmDay {
  date: string
  mineMood: string | null
  partnerMood: string | null
  bothCheckedIn: boolean
}

const MOOD_EMOJI: Record<string, string> = {
  great: '\u{1F60A}',
  good: '\u{1F642}',
  neutral: '\u{1F610}',
  low: '\u{1F614}',
  struggling: '\u{1F622}',
}

function formatRhythmDay(date: string, locale: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(parsed)
}

function moodEmoji(mood: string | null) {
  return mood ? MOOD_EMOJI[mood] ?? '·' : '·'
}

export function DailyCheckinRhythm({
  recentCheckins,
  partnerName,
}: {
  recentCheckins: CheckinRhythmDay[]
  partnerName: string
}) {
  const { locale, t } = useI18n()
  if (recentCheckins.length === 0) return null

  const togetherDays = recentCheckins.filter((day) => day.bothCheckedIn).length
  const lastCheckinDay = [...recentCheckins]
    .reverse()
    .find((day) => day.mineMood || day.partnerMood)

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-white/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t('7-day rhythm')}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {locale === 'pt-BR'
              ? `Dois humores por dia: voce primeiro, ${partnerName} em segundo.`
              : `Two moods per day: you first, ${partnerName} second.`}
          </p>
        </div>
        <p className="text-xs font-semibold text-emerald-800">
          {locale === 'pt-BR' ? `${togetherDays}/7 juntos` : `${togetherDays}/7 together`}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {recentCheckins.map((day) => (
          <div
            key={day.date}
            className={`rounded-lg border px-1.5 py-2 text-center ${
              day.bothCheckedIn
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-warm-200 bg-white'
            }`}
            title={
              locale === 'pt-BR'
                ? `${formatRhythmDay(day.date, 'pt-BR')}: voce ${day.mineMood ?? 'sem check-in'}, ${partnerName} ${day.partnerMood ?? 'sem check-in'}`
                : `${formatRhythmDay(day.date, 'en-US')}: you ${day.mineMood ?? 'not checked in'}, ${partnerName} ${day.partnerMood ?? 'not checked in'}`
            }
          >
            <p className="text-[10px] font-semibold text-warm-500">{formatRhythmDay(day.date, locale)}</p>
            <p className="mt-1 text-sm leading-none">
              <span>{moodEmoji(day.mineMood)}</span>
              <span className="ml-0.5">{moodEmoji(day.partnerMood)}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/chat"
          onClick={() => {
            storeChatDraft(
              buildCheckinRhythmDraft({
                partnerName,
                togetherDays,
                mineMood: lastCheckinDay?.mineMood ?? null,
                partnerMood: lastCheckinDay?.partnerMood ?? null,
                locale,
              }),
              locale,
            )
          }}
          className="inline-flex rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          {t('Talk about rhythm')}
        </Link>
        <Link
          to="/goals"
          onClick={() => {
            storeGoalDraft(buildCheckinRhythmGoalDraft({ partnerName, togetherDays, locale }), locale)
          }}
          className="inline-flex rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          {t('Make rhythm tiny')}
        </Link>
      </div>
    </div>
  )
}
