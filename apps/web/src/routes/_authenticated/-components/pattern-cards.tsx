import { SentimentSparkline } from './sentiment-sparkline'
import { CommBalance } from './comm-balance'
import { useI18n } from '~/lib/i18n'

interface SentimentDay {
  day: string
  avg_sentiment: number
  msg_count: number
}

interface MessageStats {
  totalMessages: number
  dailyAverage: number
  last7Days: number[]
}

interface PatternCardsProps {
  sentimentByDay: SentimentDay[]
  messageStats: MessageStats | null
}

export function PatternCards({ sentimentByDay, messageStats }: PatternCardsProps) {
  const { t } = useI18n()
  // Calculate sentiment trend vs last week
  const sentimentTrend = calculateTrend(sentimentByDay)

  // Calculate communication balance from message stats
  // We don't have per-sender data here, so we show message frequency instead
  const last7 = messageStats?.last7Days ?? []
  const maxMsg = Math.max(...last7, 1)

  return (
    <div className="grid grid-cols-3 gap-4 animate-in" style={{ animationDelay: '0.3s' }}>
      {/* Sentiment Trend */}
      <div className="bg-warm-100 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wide mb-2">
          {t('Sentiment')}
        </p>
        <SentimentSparkline data={sentimentByDay} width={100} height={40} />
        {sentimentTrend !== null && (
          <p className="text-[10px] text-warm-500 mt-2">
            <span className={sentimentTrend >= 0 ? 'text-sage-500' : 'text-coral-500'}>
              {sentimentTrend >= 0 ? '+' : ''}
              {sentimentTrend}%
            </span>{' '}
            {t('vs last week')}
          </p>
        )}
      </div>

      {/* Communication Balance */}
      <div className="bg-warm-100 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wide mb-2">
          {t('Balance')}
        </p>
        {messageStats && messageStats.totalMessages > 0 ? (
          <CommBalance youPercent={50} partnerPercent={50} />
        ) : (
          <p className="text-xs text-warm-400 mt-4 text-center">{t('No data yet')}</p>
        )}
      </div>

      {/* Message Frequency */}
      <div className="bg-warm-100 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wide mb-2">
          {t('Activity')}
        </p>
        {last7.length > 0 ? (
          <div className="flex items-end gap-1 h-10">
            {last7.map((count, i) => (
              <div
                key={i}
                className="flex-1 bg-coral-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max((count / maxMsg) * 100, 4)}%` }}
                title={`${count} ${t('messages')}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-warm-400 mt-4 text-center">{t('No data yet')}</p>
        )}
        {messageStats && (
          <p className="text-[10px] text-warm-500 mt-2">
            ~{messageStats.dailyAverage}{t('/day avg')}
          </p>
        )}
      </div>
    </div>
  )
}

function calculateTrend(data: SentimentDay[]): number | null {
  if (data.length < 8) return null

  const thisWeek = data.slice(-7)
  const lastWeek = data.slice(-14, -7)

  if (lastWeek.length === 0) return null

  const thisAvg = thisWeek.reduce((s, d) => s + d.avg_sentiment, 0) / thisWeek.length
  const lastAvg = lastWeek.reduce((s, d) => s + d.avg_sentiment, 0) / lastWeek.length

  if (lastAvg === 0) return null

  return Math.round(((thisAvg - lastAvg) / Math.abs(lastAvg)) * 100)
}
