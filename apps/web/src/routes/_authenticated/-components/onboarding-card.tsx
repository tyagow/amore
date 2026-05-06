import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useI18n } from '~/lib/i18n'

interface OnboardingCardProps {
  whatsappJid: string | null
  totalMessages: number | null
  healthScore: number | null
  analyzing: boolean
  onAnalyze: () => void
}

type StepStatus = 'done' | 'active' | 'pending'

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }

  if (status === 'active') {
    return (
      <span className="w-6 h-6 rounded-full bg-coral-100 flex items-center justify-center flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
      </span>
    )
  }

  return (
    <span className="w-6 h-6 rounded-full border-2 border-warm-200 flex-shrink-0" />
  )
}

function StepRow({
  status,
  label,
  detail,
}: {
  status: StepStatus
  label: string
  detail?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <StepIndicator status={status} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            status === 'active'
              ? 'text-warm-800'
              : status === 'done'
                ? 'text-warm-500'
                : 'text-warm-400'
          }`}
        >
          {label}
        </p>
        {detail && (
          <div className="text-xs text-warm-500 mt-0.5">{detail}</div>
        )}
      </div>
    </div>
  )
}

export function OnboardingCard({
  whatsappJid,
  totalMessages,
  healthScore,
  analyzing,
  onAnalyze,
}: OnboardingCardProps) {
  const { locale, t } = useI18n()
  const hasTriggered = useRef(false)
  const [hidden, setHidden] = useState(false)

  // Determine step statuses
  // When whatsappJid is set, the bridge has synced messages (even if local DB is empty)
  const syncStatus: StepStatus =
    whatsappJid ? 'done' : 'pending'

  const analyzeStatus: StepStatus =
    healthScore !== null
      ? 'done'
      : syncStatus === 'done'
        ? 'active'
        : 'pending'

  const insightsStatus: StepStatus =
    healthScore !== null ? 'done' : 'pending'

  // Auto-trigger analysis when sync is done but no health score yet
  useEffect(() => {
    if (
      analyzeStatus === 'active' &&
      !analyzing &&
      !hasTriggered.current
    ) {
      hasTriggered.current = true
      onAnalyze()
    }
  }, [analyzeStatus, analyzing, onAnalyze])

  // Auto-hide after analysis complete
  useEffect(() => {
    if (healthScore !== null) {
      const timer = setTimeout(() => setHidden(true), 4000)
      return () => clearTimeout(timer)
    }
  }, [healthScore])

  if (hidden) return null

  return (
    <div className="bg-coral-50 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 animate-in">
      <h3 className="font-display text-base text-warm-800 mb-4">
        {t('Getting started')}
      </h3>

      <div className="space-y-4">
        {/* Step 1: Sync messages */}
        <StepRow
          status={syncStatus}
          label={t('Sync messages')}
          detail={
            syncStatus === 'done' ? (
              totalMessages && totalMessages > 0 ? (
                <span>
                  {locale === 'pt-BR'
                    ? `${totalMessages.toLocaleString()} mensagens sincronizadas`
                    : `${totalMessages.toLocaleString()} messages synced`}
                </span>
              ) : (
                <span>{t('WhatsApp connected')}</span>
              )
            ) : (
              <Link
                to="/whatsapp"
                className="text-coral-600 hover:text-coral-700 font-medium underline underline-offset-2"
              >
                {t('Connect WhatsApp')}
              </Link>
            )
          }
        />

        {/* Step 2: Analyze patterns */}
        <StepRow
          status={analyzeStatus}
          label={t('Analyze patterns')}
          detail={
            analyzeStatus === 'active' ? (
              <span>{t('Analyzing patterns...')}</span>
            ) : analyzeStatus === 'done' ? (
              <span>
                {t('Health score')}: {healthScore}
              </span>
            ) : undefined
          }
        />

        {/* Step 3: Generate insights */}
        <StepRow
          status={insightsStatus}
          label={t('Generate insights')}
          detail={
            insightsStatus === 'done' ? (
              <span>{t('Analysis complete!')}</span>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
