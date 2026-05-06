import { useEffect, useState } from 'react'
import { useI18n } from '~/lib/i18n'
import type { PersonalizedRitual } from './personalized-ritual-engine'
import {
  buildWeeklyRelationshipReport,
  type WeeklyRelationshipReport,
} from './weekly-relationship-report'

const STORAGE_KEY = 'amore-weekly-relationship-reports-v1'

export function WeeklyRelationshipReportCard({
  partnerName,
  healthScore,
  messagesSinceAnalysis,
  messageStats,
  activeGoalCount,
  recentCheckins,
  ritual,
  onOpenCoach,
}: {
  partnerName: string
  healthScore: number | null
  messagesSinceAnalysis: number | null
  messageStats: {
    totalMessages: number
    dailyAverage: number
    last7Days: number[]
  } | null
  activeGoalCount: number
  recentCheckins: Array<{
    bothCheckedIn: boolean
    mineMood: string | null
    partnerMood: string | null
  }>
  ritual: PersonalizedRitual
  onOpenCoach: (prompt: string) => void
}) {
  const { t } = useI18n()
  const [report, setReport] = useState<WeeklyRelationshipReport | null>(null)
  const [history, setHistory] = useState<WeeklyRelationshipReport[]>([])

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return
      const reports = parsed.filter((entry): entry is WeeklyRelationshipReport =>
        Boolean(entry && typeof entry === 'object' && typeof entry.id === 'string'),
      )
      setHistory(reports)
      setReport(reports[0] ?? null)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const generateReport = () => {
    const nextReport = buildWeeklyRelationshipReport({
      dateKey: new Date().toISOString().slice(0, 10),
      partnerName,
      healthScore,
      messagesSinceAnalysis,
      messageStats,
      activeGoalCount,
      recentCheckins,
      ritual,
    })

    setReport(nextReport)
    setHistory((current) => {
      const next = [
        nextReport,
        ...current.filter((entry) => entry.weekKey !== nextReport.weekKey),
      ].slice(0, 6)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <section className="rounded-3xl border border-warm-200 bg-white/80 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_8px_24px_rgba(42,33,24,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
            {t('Weekly relationship report')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-warm-900">
            {report ? t(report.headline) : t('Generate this week when you are ready')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-600">
            {t('Creates a shared couple summary from recent check-ins, goals, message activity, and the current ritual. It stays directional when data is thin.')}
          </p>
        </div>
        <button
          type="button"
          onClick={generateReport}
          className="shrink-0 rounded-xl bg-warm-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-warm-800"
        >
          {report ? t('Regenerate report') : t('Generate weekly report')}
        </button>
      </div>

      {report && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl bg-warm-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">
              {t('Shared couple report')}
            </p>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-warm-700">
              <p>{t(report.scoreLine)}</p>
              <p>{t(report.whatWorked)}</p>
              <p>{t(report.watchPoint)}</p>
              <p className="font-semibold text-warm-900">{t(report.nextStep)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-coral-700">
              {t('Private coach follow-up')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-warm-700">
              {t('Use this privately before sharing anything. Partner-visible summaries still require your explicit action.')}
            </p>
            <button
              type="button"
              onClick={() => onOpenCoach(report.privateCoachPrompt)}
              className="mt-4 rounded-xl bg-coral-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-600"
            >
              {t('Reflect privately')}
            </button>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-warm-500">
          <span className="font-semibold text-warm-700">{t('Recent history')}:</span>
          {history.slice(1, 4).map((entry) => (
            <span key={entry.id} className="rounded-full bg-warm-100 px-2 py-1">
              {entry.weekKey}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
