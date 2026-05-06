import { Link } from '@tanstack/react-router'
import type { getInsightsData } from '~/server/insights'
import { getInsightText } from '../insight-text'
import { TypeBadge } from '../insights-card'
import { useI18n, type Locale } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// --- Health Score Trend Chart ---

function HealthScoreChart({ history }: { history: InsightsData['healthHistory'] }) {
  const { locale, t } = useI18n()
  const width = 600
  const height = 180
  const padL = 0
  const padR = 0
  const padT = 12
  const padB = 28
  const innerW = width - padL - padR
  const innerH = height - padT - padB

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-warm-400">
        {t('Not enough health score data yet')}
      </div>
    )
  }

  // Zone boundaries
  const zones = [
    { min: 70, max: 100, color: '#10b981', opacity: 0.08 },
    { min: 40, max: 70, color: '#f59e0b', opacity: 0.08 },
    { min: 0, max: 40, color: '#ef4444', opacity: 0.08 },
  ]

  const scores = history.map((h) => Number(h.score))
  const minScore = 0
  const maxScore = 100

  function yPos(val: number) {
    return padT + innerH - ((val - minScore) / (maxScore - minScore)) * innerH
  }
  function xPos(i: number) {
    return padL + (i / (history.length - 1)) * innerW
  }

  const points = scores.map((s, i) => ({ x: xPos(i), y: yPos(s) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`

  // Date labels - show ~5 evenly spaced
  const labelCount = Math.min(5, history.length)
  const labelIndices: number[] = []
  for (let i = 0; i < labelCount; i++) {
    labelIndices.push(Math.round((i / (labelCount - 1)) * (history.length - 1)))
  }

  const gradientId = 'health-area-grad'

  // Current vs previous score for trend
  const currentScore = scores[scores.length - 1]
  const prevScore = scores.length > 1 ? scores[scores.length - 2] : currentScore
  const diff = currentScore - prevScore
  const trendArrow = diff > 2 ? '\u2191' : diff < -2 ? '\u2193' : '\u2192'
  const trendColor = diff > 2 ? 'text-emerald-600' : diff < -2 ? 'text-red-500' : 'text-warm-500'
  const scoreColor = currentScore >= 70 ? 'text-emerald-600' : currentScore >= 40 ? 'text-amber-600' : 'text-red-500'

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className={`text-3xl font-bold ${scoreColor}`}>{currentScore}</span>
        <span className={`text-lg font-medium ${trendColor}`}>{trendArrow}</span>
        <span className="text-sm text-warm-400">{t('Health Score')}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C96B4F" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C96B4F" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Background zones */}
        {zones.map((z) => (
          <rect
            key={z.min}
            x={padL}
            y={yPos(z.max)}
            width={innerW}
            height={yPos(z.min) - yPos(z.max)}
            fill={z.color}
            opacity={z.opacity}
            rx={2}
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#C96B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current value dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#C96B4F" />

        {/* X-axis date labels */}
        {labelIndices.map((idx) => {
          const d = new Date(history[idx].recordedAt)
          const label = d.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
            month: 'short',
            day: 'numeric',
          })
          return (
            <text
              key={idx}
              x={xPos(idx)}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#A89888"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// --- Quick Stats Row ---

function QuickStats({
  messageStats,
  sentimentByDay,
  lastAnalyzed,
}: {
  messageStats: InsightsData['messageStats']
  sentimentByDay: InsightsData['sentimentByDay']
  lastAnalyzed: InsightsData['couple']['lastAnalyzed']
}) {
  const { locale, t } = useI18n()
  // Communication streak: consecutive days with messages (from most recent day backwards)
  let streak = 0
  if (sentimentByDay.length > 0) {
    const sorted = [...sentimentByDay].sort((a, b) => b.day.localeCompare(a.day))
    let prevDate: Date | null = null
    for (const entry of sorted) {
      const d = new Date(entry.day)
      if (!prevDate) {
        streak = 1
        prevDate = d
        continue
      }
      const diffDays = Math.round((prevDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        streak++
        prevDate = d
      } else {
        break
      }
    }
  }

  // Days since last analysis
  let daysSinceAnalysis = '--'
  if (lastAnalyzed) {
    const diff = Math.floor(
      (Date.now() - new Date(lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24)
    )
    daysSinceAnalysis =
      locale === 'pt-BR'
        ? diff === 0
          ? 'Hoje'
          : diff === 1
            ? '1 dia'
            : `${diff} dias`
        : diff === 0
          ? 'Today'
          : diff === 1
            ? '1 day'
            : `${diff} days`
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">
          {messageStats.totalMessages.toLocaleString('en-US')}
        </p>
        <p className="text-xs text-warm-400 mt-1">
          {t('Total messages')}
        </p>
        <p className="text-[10px] text-warm-300 mt-0.5">
          ~{messageStats.dailyAverage}{t('/day')}
        </p>
      </div>
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-coral-500">{streak}</p>
        <p className="text-xs text-warm-400 mt-1">{t('Day streak')}</p>
        <p className="text-[10px] text-warm-300 mt-0.5">{t('Consecutive days')}</p>
      </div>
      <div className="bg-warm-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-warm-800">{daysSinceAnalysis}</p>
        <p className="text-xs text-warm-400 mt-1">{t('Last analysis')}</p>
        <p className="text-[10px] text-warm-300 mt-0.5">{t('AI insights')}</p>
      </div>
    </div>
  )
}

// --- Recent Insights Feed ---

function RecentInsightsFeed({ insights }: { insights: InsightsData['allInsights'] }) {
  const { locale, t } = useI18n()
  const recent = insights.slice(0, 10)

  if (recent.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-warm-400">
          {t('No insights yet. Keep chatting to generate relationship insights.')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-l-2 border-warm-200 ml-1">
      {recent.map((insight) => {
        const date = new Date(insight.generatedAt)
        const label = formatRelativeDate(date, locale)

        return (
          <div key={insight.id} className="pl-4 ml-2 relative space-y-1">
            <span
              className={`absolute -left-[calc(0.5rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white ${
                insight.severity === 'high'
                  ? 'bg-coral-400'
                  : insight.severity === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-warm-300'
              }`}
            />
            <div className="flex items-center gap-2">
              <TypeBadge type={insight.type} />
              <span className="text-[10px] text-warm-400">{label}</span>
            </div>
            <p className="text-sm text-warm-700 leading-relaxed line-clamp-2">
              {getInsightText(insight.content, locale)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// --- Action Plan ---

export function buildActionPlan(data: InsightsData, locale: Locale = 'en') {
  const partnerName = data.partner?.name ?? 'your partner'
  const ptPartnerName = data.partner?.name ?? 'sua parceria'
  const isPt = locale === 'pt-BR'
  const healthScore = data.couple.healthScore
  const conflictCount = data.allInsights.filter((insight) => insight.type === 'conflict_alert').length
  const hasGoalSuggestion = data.allInsights.some((insight) => insight.type === 'goal_suggestion')
  const topInsight = data.allInsights[0]

  if (typeof healthScore === 'number' && healthScore < 70) {
    return {
      label: 'Repair first',
      title: isPt ? 'Tenha a conversa de reparo de 10 minutos' : 'Have the 10-minute repair conversation',
      body:
        isPt
          ? `Sua pontuacao de saude mais recente e ${healthScore}. Nao espere o padrao virar normal. Comece com apreciacao, assuma uma parte e depois pergunte a ${ptPartnerName} o que ajudaria.`
          : `Your latest health score is ${healthScore}. Do not wait for the pattern to become normal. Start with appreciation, own one piece, then ask ${partnerName} what would help.`,
      chatLabel: 'Draft repair message',
      chatDraft: isPt
        ? `${ptPartnerName}, quero reparar em vez de deixar isso ficar entre a gente.\n\nEu me importo com a gente e quero tornar a proxima conversa mais segura, sem transformar a pontuacao de saude em pressao.\n\nUma coisa que aprecio em voce e ____.\n\nUma parte que posso assumir e ____.\n\nPodemos tirar 10 minutos hoje para entender o que foi dificil e o que ajudaria a gente a se sentir perto de novo?\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`
        : `Hey ${partnerName}, I want to repair instead of letting this sit between us.\n\nI care about making the next conversation feel safer, not turning the health score into pressure.\n\nOne thing I appreciate about you is ____.\n\nOne part I can own is ____.\n\nCan we take 10 minutes today to understand what felt hard and what would help us feel close again?\n\nIf now is not a good time, could we choose a smaller moment later today?`,
      coachDraft: isPt
        ? `Me ajude a preparar uma conversa calma de reparo de 10 minutos com ${ptPartnerName}. Nossa pontuacao de saude do relacionamento e ${healthScore}. Me de um roteiro que comece com apreciacao, assuma minha parte e peca para entender.`
        : `Help me prepare a calm 10-minute repair conversation with ${partnerName}. Our relationship health score is ${healthScore}. Give me a script that starts with appreciation, owns my part, and asks to understand.`,
      goalDraft: isPt
        ? {
            title: 'Reparar tensao em ate 24 horas',
            description: `Tire 10 minutos calmos com ${ptPartnerName}. Comecar com apreciacao, assumir uma parte e perguntar o que ajudaria antes de tentar resolver tudo.`,
          }
        : {
            title: 'Repair tension within 24 hours',
            description: `Take 10 calm minutes with ${partnerName}. Start with appreciation, own one piece, and ask what would help before trying to solve everything.`,
          },
    }
  }

  if (conflictCount > 0) {
    return {
      label: 'Lower tension',
      title: isPt ? 'Transforme o sinal de conflito em uma abertura mais suave' : 'Turn the conflict signal into a softer opening',
      body: isPt
        ? `${conflictCount} sinal${conflictCount === 1 ? '' : 'ais'} de conflito apareceu${conflictCount === 1 ? '' : 'ram'} recentemente. O movimento util nao e provar o ponto; e baixar a defensividade o bastante para a proxima conversa funcionar.`
        : `${conflictCount} conflict signal${conflictCount === 1 ? '' : 's'} showed up recently. The useful move is not to prove the point; it is to lower defensiveness enough for the next conversation to work.`,
      chatLabel: 'Draft softer opening',
      chatDraft: isPt
        ? `${ptPartnerName}, nao quero que isso vire nos contra nos.\n\nEu me importo com a gente e quero manter esta conversa conectada mesmo quando ela e dificil.\n\nPodemos recomecar esta conversa com mais gentileza hoje? Quero entender o que voce quis dizer e compartilhar o que senti sem atacar voce.\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde?`
        : `Hey ${partnerName}, I do not want this to turn into us versus each other.\n\nI care about keeping this conversation connected even while it is hard.\n\nCan we restart this conversation more gently today? I want to understand what you meant and share what I felt without attacking you.\n\nIf now is not a good time, could we choose a smaller moment later?`,
      coachDraft: isPt
        ? `Me ajude a responder a um conflito com ${ptPartnerName} sem defensividade. Me de uma mensagem curta e um plano de conversa em duas etapas.`
        : `Help me respond to conflict with ${partnerName} without defensiveness. Give me a short message and a two-step conversation plan.`,
      goalDraft: isPt
        ? {
            title: 'Usar comecos mais suaves para um tema dificil',
            description: 'Antes do proximo tema dificil, comece com o que voce esta sentindo e o que quer entender. Mantenha o objetivo em baixar a defensividade, nao em vencer o ponto.',
          }
        : {
            title: 'Use softer starts for hard topics',
            description: 'Before the next hard topic, lead with what you are feeling and what you want to understand. Keep the goal to lowering defensiveness, not winning the point.',
          },
    }
  }

  if (hasGoalSuggestion) {
    return {
      label: 'Commit',
      title: isPt ? 'Escolha uma pratica pequena nesta semana' : 'Choose one small practice this week',
      body: isPt
        ? 'Ja existe sinal suficiente para escolher um comportamento repetivel. Uma promessa pequena compartilhada vale mais do que outro insight passivo.'
        : 'There is already enough signal to pick one repeatable behavior. A tiny shared promise beats another passive insight.',
      chatLabel: 'Invite a tiny goal',
      chatDraft: isPt
        ? `${ptPartnerName}, quero que a gente tente uma pequena pratica de relacionamento nesta semana.\n\nEu me importo em deixar isso simples o bastante para ajudar a gente em vez de virar pressao.\n\nPodemos escolher uma: uma apreciacao diaria, uma conversa sem celular ou um reparo rapido quando algo parecer estranho?\n\nSe agora nao for um bom momento, podemos escolher uma versao menor mais tarde?`
        : `Hey ${partnerName}, I want us to try one small relationship practice this week.\n\nI care about making it simple enough that it helps us instead of becoming pressure.\n\nCould we choose one: a daily appreciation, one phone-free conversation, or a quick repair whenever something feels off?\n\nIf now is not a good time, could we choose a smaller version later?`,
      coachDraft: isPt
        ? `Me ajude a escolher um objetivo semanal realista de relacionamento com ${ptPartnerName} com base nos nossos insights recentes.`
        : `Help me choose one realistic weekly relationship goal with ${partnerName} based on our recent insights.`,
      goalDraft: isPt
        ? {
            title: 'Uma pratica pequena de relacionamento nesta semana',
            description: 'Escolha um comportamento repetivel: uma apreciacao diaria, uma conversa sem celular ou um reparo rapido quando algo parecer estranho. Mantenha pequeno o bastante para realmente repetir.',
          }
        : {
            title: 'One tiny relationship practice this week',
            description: 'Choose one repeatable behavior: a daily appreciation, one phone-free conversation, or a quick repair when something feels off. Keep it small enough to actually repeat.',
          },
    }
  }

  return {
    label: 'Connect',
    title: topInsight
      ? isPt ? 'Transforme o sinal mais recente em uma mensagem' : 'Turn the newest signal into one message'
      : isPt ? 'Crie um momento de conexao hoje' : 'Create one moment of connection today',
    body: topInsight
      ? isPt
        ? `O insight mais recente e: ${getInsightText(topInsight.content, locale)}. Use isso para enviar uma mensagem especifica e leve hoje.`
        : `The newest insight is: ${getInsightText(topInsight.content, locale)}. Use it to send one specific, low-pressure message today.`
      : isPt
        ? `O app funciona melhor quando ajuda voce a fazer uma coisa concreta por ${ptPartnerName}, mesmo antes dos dados ficarem mais profundos.`
        : `The app works best when it helps you do one concrete thing for ${partnerName}, even before the data gets deeper.`,
    chatLabel: 'Draft connection message',
    chatDraft: isPt
      ? `${ptPartnerName}, quero ser mais intencional com a gente hoje.\n\nEu me importo em notar o que esta funcionando entre nos, nao so problemas.\n\nUma coisa que aprecio em voce e ____.\n\nComo voce esta se sentindo sobre a gente agora?\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde?`
      : `Hey ${partnerName}, I want to be more intentional with us today.\n\nI care about noticing what is working between us, not only problems.\n\nOne thing I appreciate about you is ____.\n\nHow are you feeling about us right now?\n\nIf now is not a good time, could we choose a smaller moment later?`,
    coachDraft: isPt
      ? `Me de um movimento pequeno de relacionamento que posso fazer hoje com ${ptPartnerName}. Mantenha pratico e gentil.`
      : `Give me one small relationship move I can make today with ${partnerName}. Keep it practical and kind.`,
    goalDraft: isPt
      ? {
          title: 'Uma mensagem de apreciacao hoje',
          description: `Envie para ${ptPartnerName} uma apreciacao especifica hoje, depois faca uma pergunta leve sobre como ela esta se sentindo sobre o relacionamento.`,
        }
      : {
          title: 'One appreciation message today',
          description: `Send ${partnerName} one specific appreciation today, then ask one low-pressure question about how they are feeling about the relationship.`,
        },
  }
}

function InsightActionPlan({ data }: { data: InsightsData }) {
  const { locale, t } = useI18n()
  const action = buildActionPlan(data, locale)

  return (
    <section className="rounded-2xl border border-coral-200/70 bg-coral-50/70 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-600">
            {t("Today's action plan")}
          </p>
          <h3 className="mt-1 font-display text-xl text-warm-900">{t(action.title)}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-700">{t(action.body)}</p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-coral-700">
          {t(action.label)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          to="/chat"
          onClick={() => storeChatDraft(action.chatDraft, locale)}
          className="rounded-xl bg-coral-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-600"
        >
          {t(action.chatLabel)}
        </Link>
        <Link
          to="/goals"
          onClick={() => storeGoalDraft(action.goalDraft, locale)}
          className="rounded-xl border border-coral-200 bg-white/75 px-4 py-3 text-sm font-semibold text-coral-700 transition-colors hover:bg-white"
        >
          {t('Make it a goal')}
        </Link>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem('amore-coach-draft', action.coachDraft)
            window.dispatchEvent(new CustomEvent('amore:open-coach'))
          }}
          className="rounded-xl border border-warm-200 bg-white/75 px-4 py-3 text-left text-sm font-semibold text-warm-700 transition-colors hover:bg-white"
        >
          {t('Ask coach to help')}
        </button>
      </div>
    </section>
  )
}

function formatRelativeDate(date: Date, locale: Locale = 'en'): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (locale === 'pt-BR') {
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `ha ${diffDays}d`
    return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
  }
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// --- Main Component ---

export function OverviewTab({ data }: { data: InsightsData }) {
  const { t } = useI18n()
  const hasAnyData =
    data.healthHistory.length > 0 ||
    data.allInsights.length > 0 ||
    data.messageStats.totalMessages > 0

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-coral-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-coral-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg text-warm-800 mb-2">
          {t('Your insights will appear here')}
        </h3>
        <p className="text-sm text-warm-400 max-w-sm mx-auto leading-relaxed">
          {t("Connect WhatsApp and start chatting with your partner. We'll analyze your conversations and surface meaningful patterns, health scores, and coaching tips.")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <InsightActionPlan data={data} />

      {/* Health Score Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">{t('Health Score Trend')}</h3>
        <HealthScoreChart history={data.healthHistory} />
      </div>

      {/* Quick Stats Row */}
      <QuickStats
        messageStats={data.messageStats}
        sentimentByDay={data.sentimentByDay}
        lastAnalyzed={data.couple.lastAnalyzed}
      />

      {/* Recent Insights Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">{t('Recent Insights')}</h3>
        <RecentInsightsFeed insights={data.allInsights} />
      </div>
    </div>
  )
}
