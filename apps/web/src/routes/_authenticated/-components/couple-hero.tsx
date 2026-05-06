import { HealthRing } from './health-ring'
import { AIPulse } from './ai-pulse'
import { SentimentSparkline } from './sentiment-sparkline'
import { formatTimeAgo } from '~/lib/format'
import { useI18n } from '~/lib/i18n'

interface MoodData {
  mood: string
  createdAt: string | Date
  source?: string | null
}

interface SentimentDay {
  day: string
  avg_sentiment: number
  msg_count: number
}

interface CoupleHeroProps {
  userName: string | null
  partnerName: string | null
  healthScore: number | null
  lastAnalyzed: string | Date | null
  messagesSinceAnalysis: number | null
  whatsappConnected?: boolean
  myMood: MoodData | null
  partnerMood: MoodData | null
  sentimentByDay: SentimentDay[]
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

function Avatar({ name, mood }: { name: string; mood: MoodData | null }) {
  const { locale, t } = useI18n()
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  const emoji = mood ? (MOOD_EMOJI[mood.mood] ?? '\u{1F610}') : null
  const label = mood ? t(MOOD_LABEL[mood.mood] ?? mood.mood) : null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-full bg-coral-100 flex items-center justify-center">
        <span className="font-display text-2xl text-coral-600">{initial}</span>
      </div>
      <p className="text-sm font-medium text-warm-800">{name}</p>
      {mood && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg">{emoji}</span>
          <span className="text-[10px] text-warm-500">{label}</span>
          <span className="text-[10px] text-warm-400">{formatTimeAgo(mood.createdAt, locale)}</span>
        </div>
      )}
      {!mood && (
        <span className="text-[10px] text-warm-400">{t('No mood set')}</span>
      )}
    </div>
  )
}

export function CoupleHero({
  userName,
  partnerName,
  healthScore,
  lastAnalyzed,
  messagesSinceAnalysis,
  whatsappConnected,
  myMood,
  partnerMood,
  sentimentByDay,
}: CoupleHeroProps) {
  const { locale, t } = useI18n()
  return (
    <div
      className="bg-warm-100 rounded-3xl p-8 animate-in"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, var(--color-coral-50) 0%, var(--color-warm-100) 70%)',
      }}
    >
      {/* Greeting */}
      <div className="text-center mb-6 animate-in" style={{ animationDelay: '0.05s' }}>
        <h1 className="font-display text-3xl text-warm-900">
          {userName ? (locale === 'pt-BR' ? `Oi, ${userName}` : `Hey, ${userName}`) : t('Dashboard')}
        </h1>
        <p className="text-warm-500 mt-1 text-sm">
          {partnerName
            ? locale === 'pt-BR'
              ? `Voce e ${partnerName}`
              : `You & ${partnerName}`
            : t('Your relationship at a glance')}
        </p>
      </div>

      {/* Avatars + Health Ring */}
      <div className="flex items-center justify-center gap-8 md:gap-16 animate-in" style={{ animationDelay: '0.1s' }}>
        <Avatar name={userName ?? 'You'} mood={myMood} />

        <div className="hidden md:block">
          <HealthRing
            score={healthScore}
            lastAnalyzed={lastAnalyzed}
            messagesSinceAnalysis={messagesSinceAnalysis}
            whatsappConnected={whatsappConnected}
            size={200}
          />
        </div>
        <div className="md:hidden">
          <HealthRing
            score={healthScore}
            lastAnalyzed={lastAnalyzed}
            messagesSinceAnalysis={messagesSinceAnalysis}
            whatsappConnected={whatsappConnected}
            size={140}
          />
        </div>

        <Avatar name={partnerName ?? 'Partner'} mood={partnerMood} />
      </div>

      {/* AI Pulse */}
      <div className="flex justify-center mt-5 animate-in" style={{ animationDelay: '0.15s' }}>
        <AIPulse lastAnalyzed={lastAnalyzed} messagesSinceAnalysis={messagesSinceAnalysis} />
      </div>

      {/* Sentiment Sparkline */}
      {sentimentByDay.length >= 2 && (
        <div className="flex justify-center mt-4 animate-in" style={{ animationDelay: '0.2s' }}>
          <SentimentSparkline data={sentimentByDay} width={240} height={40} />
        </div>
      )}
    </div>
  )
}
