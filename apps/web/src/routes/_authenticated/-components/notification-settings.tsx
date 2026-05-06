import { useState, useEffect } from 'react'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '~/server/notification-preferences'
import { getSubscriptionStatus, unsubscribePush } from '~/server/push'
import { useI18n } from '~/lib/i18n'

interface Prefs {
  moodAlerts: boolean
  coachNudges: boolean
  scoreDrops: boolean
  milestones: boolean
  goalUpdates: boolean
  weeklyDigest: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  quietStart: string | null
  quietEnd: string | null
  timezone: string | null
}

const NOTIFICATION_TYPES = [
  { key: 'moodAlerts' as const, label: 'Mood alerts', desc: 'When your partner shares their mood' },
  { key: 'coachNudges' as const, label: 'Coach nudges', desc: 'Conflict alerts, score drops, coaching tips' },
  { key: 'scoreDrops' as const, label: 'Score drops', desc: 'When your health score drops significantly' },
  { key: 'milestones' as const, label: 'Milestones', desc: 'Health score achievements' },
  { key: 'goalUpdates' as const, label: 'Goal updates', desc: 'When your partner completes a goal' },
  { key: 'weeklyDigest' as const, label: 'Weekly digest', desc: 'Email summary every Sunday' },
]

export function NotificationSettings() {
  const { t } = useI18n()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getNotificationPreferences(),
      getSubscriptionStatus(),
    ]).then(([p, status]) => {
      setPrefs(p as Prefs)
      setSubscribed(status.subscribed)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const updatePref = async (key: string, value: boolean | string | null) => {
    if (!prefs) return
    setSaving(true)
    try {
      const updated = await updateNotificationPreferences({
        data: { [key]: value },
      })
      setPrefs(updated as Prefs)
    } catch (err) {
      console.error('[settings] Failed to update preference:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker?.ready
      const sub = await reg?.pushManager?.getSubscription()
      if (sub) {
        await unsubscribePush({ data: { endpoint: sub.endpoint } })
        await sub.unsubscribe()
        setSubscribed(false)
      }
    } catch (err) {
      console.error('[settings] Failed to unsubscribe:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-warm-100 rounded-2xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-warm-200 rounded w-1/3" />
          <div className="h-3 bg-warm-200 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!prefs) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-base text-warm-800 mb-1">{t('Notifications')}</h2>
        <p className="text-sm text-warm-500">{t('Choose what you want to be notified about')}</p>
      </div>

      {/* Push subscription status */}
      <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-warm-900">{t('Push notifications')}</h3>
            <p className="text-xs text-warm-500 mt-0.5">
              {subscribed ? t('This device is receiving push notifications') : t('Not enabled on this device')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {subscribed && (
              <button
                onClick={handleRemoveSubscription}
                className="text-xs text-warm-500 hover:text-red-500 transition-colors"
              >
                {t('Disable')}
              </button>
            )}
            <Toggle
              checked={prefs.pushEnabled}
              onChange={(v) => updatePref('pushEnabled', v)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Per-type toggles */}
      <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-warm-900">{t('Notification types')}</h3>
        {NOTIFICATION_TYPES.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm text-warm-900">{t(label)}</p>
              <p className="text-xs text-warm-500">{t(desc)}</p>
            </div>
            <Toggle
              checked={prefs[key]}
              onChange={(v) => updatePref(key, v)}
              disabled={saving}
            />
          </div>
        ))}
      </div>

      {/* Quiet hours */}
      <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
        <h3 className="text-sm font-semibold text-warm-900 mb-3">{t('Quiet hours')}</h3>
        <p className="text-xs text-warm-500 mb-4">
          {t('Pause push notifications during these hours')}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={prefs.quietStart ?? ''}
            onChange={(e) => updatePref('quietStart', e.target.value || null)}
            className="px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
          />
          <span className="text-sm text-warm-500">{t('to')}</span>
          <input
            type="time"
            value={prefs.quietEnd ?? ''}
            onChange={(e) => updatePref('quietEnd', e.target.value || null)}
            className="px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
          />
        </div>
        {(!prefs.timezone) && (
          <button
            onClick={() => updatePref('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)}
            className="mt-3 text-xs text-coral-500 hover:text-coral-600 transition-colors"
          >
            {t('Set timezone to')} {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </button>
        )}
        {prefs.timezone && (
          <p className="mt-2 text-xs text-warm-400">
            {t('Timezone:')} {prefs.timezone}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Toggle Component ────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 disabled:opacity-50 ${
        checked ? 'bg-coral-500' : 'bg-warm-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
