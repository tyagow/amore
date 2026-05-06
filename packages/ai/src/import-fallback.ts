import { localized, type AILocale } from './locale'
import type { AnalysisOutput } from './orchestrate'
import type { Message } from '@amore-couples/types'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function buildImportFallbackAnalysis(
  messages: Message[],
  coupleId: string,
  userSenderName = 'You',
  locale: AILocale = 'en',
): AnalysisOutput {
  const textMessages = messages.filter((message) => !message.isMedia && message.text?.trim())
  const messageCountBySender = textMessages.reduce<Record<string, number>>((counts, message) => {
    counts[message.senderId] = (counts[message.senderId] ?? 0) + 1
    return counts
  }, {})
  const total = Object.values(messageCountBySender).reduce((sum, count) => sum + count, 0)
  const userCount = messageCountBySender[userSenderName] ?? 0
  const balance = total > 0 ? userCount / total : 0.5
  const balancePenalty = Math.abs(balance - 0.5) * 40
  const volumeLift = Math.min(10, Math.floor(total / 100))
  const healthScore = clamp(Math.round(58 - balancePenalty + volumeLift), 45, 72)
  const summary = localized(
    locale,
    `Imported ${messages.length.toLocaleString()} WhatsApp messages. AI analysis was unavailable, so this starter read uses message volume and participation balance until the next analysis succeeds.`,
    `${messages.length.toLocaleString()} mensagens do WhatsApp foram importadas. A analise por IA nao estava disponivel, entao esta leitura inicial usa volume de mensagens e equilibrio de participacao ate a proxima analise funcionar.`,
  )

  return {
    healthScore,
    summary,
    sentiments: undefined,
    insightRows: [
      {
        coupleId,
        type: 'health_score',
        content: { score: healthScore, summary, fallback: true },
        severity: null,
      },
      {
        coupleId,
        type: 'communication_pattern',
        content: {
          pattern: 'messageCountBySender',
          value: messageCountBySender,
          fallback: true,
        },
        severity: null,
      },
    ],
    profileData: {
      loveLanguages: [],
      interests: [],
      wishlist: [],
      importantDates: [],
      communicationStyle: {
        messageCountBySender,
      },
    },
  }
}
