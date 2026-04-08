import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getProfile,
  getPartnerProfile,
  updateProfile,
  type ProfileData,
} from '~/server/profile'
import { NotificationSettings } from './-components/notification-settings'
import {
  isUpgradeGateDetail,
  openUpgradeModal,
} from '~/lib/upgrade-gate'

export const Route = createFileRoute('/_authenticated/profile')({
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      return { hasCouple: false as const, profile: null, partnerData: null }
    }
    const [profile, partnerData] = await Promise.all([
      getProfile(),
      getPartnerProfile(),
    ])
    return { hasCouple: true as const, profile, partnerData }
  },
  component: ProfilePage,
})

// ── Love Language Options ───────────────────────────────

const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Acts of Service',
  'Receiving Gifts',
  'Quality Time',
  'Physical Touch',
] as const

const COMMUNICATION_STYLES = [
  { type: 'Direct', description: 'Prefers clear, straightforward communication' },
  { type: 'Supportive', description: 'Leads with empathy and emotional validation' },
  { type: 'Analytical', description: 'Processes through logic and structured thinking' },
  { type: 'Expressive', description: 'Communicates with energy, emotion, and storytelling' },
] as const

// ── Helper Components ───────────────────────────────────

function SourceBadge({ source }: { source: 'ai' | 'manual' }) {
  if (source === 'ai') {
    return (
      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
        AI detected
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
      Manual
    </span>
  )
}

function EmptyField({ label }: { label: string }) {
  return (
    <p className="text-sm text-warm-400 italic">
      No {label} data yet. Edit your profile or run an AI analysis.
    </p>
  )
}

// ── Page Component ──────────────────────────────────────

function ProfilePage() {
  const data = Route.useLoaderData()

  if (!data.hasCouple) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-warm-900">Relationship Profile</h1>
          <p className="text-warm-500 mt-1">How you show up in your relationship</p>
        </div>
        <div className="bg-warm-100 rounded-2xl p-8 text-center">
          <p className="text-warm-500 mb-4">Connect with your partner to build your relationship profile.</p>
          <Link to="/connect" className="text-coral-500 font-medium hover:underline">Connect now</Link>
        </div>
      </div>
    )
  }

  const [profile, setProfile] = useState(data.profile)
  const partnerData = data.partnerData!

  const [editing, setEditing] = useState<
    'love-languages' | 'communication' | 'interests' | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Edit State ──────────────────────────────────────
  const [editLovePrimary, setEditLovePrimary] = useState('')
  const [editLoveSecondary, setEditLoveSecondary] = useState('')
  const [editCommType, setEditCommType] = useState('')
  const [editCommDesc, setEditCommDesc] = useState('')
  const [editInterests, setEditInterests] = useState('')

  const loveLanguages = profile?.loveLanguages as ProfileData['loveLanguages']
  const communicationStyle =
    profile?.communicationStyle as ProfileData['communicationStyle']
  const interests = profile?.interests as ProfileData['interests']

  const partnerProfile = partnerData.profile
  const partnerLoveLanguages =
    partnerProfile?.loveLanguages as ProfileData['loveLanguages']
  const partnerCommunicationStyle =
    partnerProfile?.communicationStyle as ProfileData['communicationStyle']
  const partnerInterests =
    partnerProfile?.interests as ProfileData['interests']

  // ── Edit Handlers ─────────────────────────────────────

  const startEditLoveLanguages = () => {
    setEditLovePrimary(loveLanguages?.primary ?? '')
    setEditLoveSecondary(loveLanguages?.secondary ?? '')
    setEditing('love-languages')
  }

  const startEditCommunication = () => {
    setEditCommType(communicationStyle?.type ?? '')
    setEditCommDesc(communicationStyle?.description ?? '')
    setEditing('communication')
  }

  const startEditInterests = () => {
    setEditInterests(interests?.items.join(', ') ?? '')
    setEditing('interests')
  }

  const cancelEdit = () => {
    setEditing(null)
    setError(null)
  }

  const saveLoveLanguages = async () => {
    if (!editLovePrimary) return
    setSaving(true)
    setError(null)
    try {
      const result = await updateProfile({
        data: {
          loveLanguages: {
            primary: editLovePrimary,
            secondary: editLoveSecondary || undefined,
          },
        },
      })
      if (isUpgradeGateDetail(result)) {
        openUpgradeModal(result)
        return
      }
      const updated = await getProfile()
      setProfile(updated)
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveCommunication = async () => {
    if (!editCommType) return
    setSaving(true)
    setError(null)
    try {
      const result = await updateProfile({
        data: {
          communicationStyle: {
            type: editCommType,
            description: editCommDesc || COMMUNICATION_STYLES.find((s) => s.type === editCommType)?.description || '',
          },
        },
      })
      if (isUpgradeGateDetail(result)) {
        openUpgradeModal(result)
        return
      }
      const updated = await getProfile()
      setProfile(updated)
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveInterests = async () => {
    const items = editInterests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (items.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const result = await updateProfile({ data: { interests: { items } } })
      if (isUpgradeGateDetail(result)) {
        openUpgradeModal(result)
        return
      }
      const updated = await getProfile()
      setProfile(updated)
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-900">
            Relationship Profile
          </h1>
          <p className="text-warm-500 mt-1">
            How you show up in your relationship
          </p>
        </div>
        <Link
          to="/dashboard"
          className="text-sm text-warm-500 hover:text-warm-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Your Profile ─────────────────────────────────── */}
      <div className="space-y-6 mb-10">
        <h2 className="font-display text-base text-warm-800">
          Your Profile
        </h2>

        {/* Love Languages */}
        <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-warm-900">
                Love Languages
              </h3>
              {loveLanguages?.source && (
                <SourceBadge source={loveLanguages.source} />
              )}
            </div>
            {editing !== 'love-languages' && (
              <button
                onClick={startEditLoveLanguages}
                className="text-xs text-coral-500 hover:text-coral-600 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing === 'love-languages' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Primary
                </label>
                <select
                  value={editLovePrimary}
                  onChange={(e) => setEditLovePrimary(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {LOVE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Secondary{' '}
                  <span className="text-warm-400 font-normal">(optional)</span>
                </label>
                <select
                  value={editLoveSecondary}
                  onChange={(e) => setEditLoveSecondary(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                >
                  <option value="">None</option>
                  {LOVE_LANGUAGES.filter((l) => l !== editLovePrimary).map(
                    (lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveLoveLanguages}
                  disabled={saving || !editLovePrimary}
                  className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-coral-200 text-coral-700 text-sm rounded-lg font-medium hover:bg-coral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : loveLanguages ? (
            <div className="space-y-1">
              <p className="text-sm text-warm-900">
                <span className="text-warm-500">Primary:</span>{' '}
                {loveLanguages.primary}
              </p>
              {loveLanguages.secondary && (
                <p className="text-sm text-warm-900">
                  <span className="text-warm-500">Secondary:</span>{' '}
                  {loveLanguages.secondary}
                </p>
              )}
            </div>
          ) : (
            <EmptyField label="love language" />
          )}
        </div>

        {/* Communication Style */}
        <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-warm-900">
                Communication Style
              </h3>
              {communicationStyle?.source && (
                <SourceBadge source={communicationStyle.source} />
              )}
            </div>
            {editing !== 'communication' && (
              <button
                onClick={startEditCommunication}
                className="text-xs text-coral-500 hover:text-coral-600 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing === 'communication' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Style
                </label>
                <select
                  value={editCommType}
                  onChange={(e) => {
                    setEditCommType(e.target.value)
                    const match = COMMUNICATION_STYLES.find(
                      (s) => s.type === e.target.value,
                    )
                    if (match) setEditCommDesc(match.description)
                  }}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {COMMUNICATION_STYLES.map((style) => (
                    <option key={style.type} value={style.type}>
                      {style.type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Description
                </label>
                <textarea
                  value={editCommDesc}
                  onChange={(e) => setEditCommDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent resize-none"
                  placeholder="Describe your communication style..."
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveCommunication}
                  disabled={saving || !editCommType}
                  className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-coral-200 text-coral-700 text-sm rounded-lg font-medium hover:bg-coral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : communicationStyle ? (
            <div>
              <p className="text-sm font-medium text-warm-900">
                {communicationStyle.type}
              </p>
              <p className="text-sm text-warm-500 mt-0.5">
                {communicationStyle.description}
              </p>
            </div>
          ) : (
            <EmptyField label="communication style" />
          )}
        </div>

        {/* Interests */}
        <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-warm-900">
                Shared Interests
              </h3>
              {interests?.source && <SourceBadge source={interests.source} />}
            </div>
            {editing !== 'interests' && (
              <button
                onClick={startEditInterests}
                className="text-xs text-coral-500 hover:text-coral-600 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing === 'interests' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Interests{' '}
                  <span className="text-warm-400 font-normal">
                    (comma-separated)
                  </span>
                </label>
                <textarea
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent resize-none"
                  placeholder="e.g. Cooking, Hiking, Movies, Music"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveInterests}
                  disabled={saving || !editInterests.trim()}
                  className="px-4 py-2 bg-coral-500 text-white text-sm rounded-lg font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-coral-200 text-coral-700 text-sm rounded-lg font-medium hover:bg-coral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : interests && interests.items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-warm-100 text-warm-700 text-sm rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <EmptyField label="interests" />
          )}
        </div>
      </div>

      {/* ── Notification Settings ────────────────────────── */}
      <NotificationSettings />

      {/* ── Partner's Profile (Read-Only) ────────────────── */}
      <div className="space-y-6 mt-10">
        <h2 className="font-display text-base text-warm-800">
          {partnerData.partnerName}&rsquo;s Profile
        </h2>

        {partnerProfile ? (
          <>
            {/* Partner Love Languages */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                Love Languages
              </h3>
              {partnerLoveLanguages ? (
                <div className="space-y-1">
                  <p className="text-sm text-warm-900">
                    <span className="text-warm-500">Primary:</span>{' '}
                    {partnerLoveLanguages.primary}
                  </p>
                  {partnerLoveLanguages.secondary && (
                    <p className="text-sm text-warm-900">
                      <span className="text-warm-500">Secondary:</span>{' '}
                      {partnerLoveLanguages.secondary}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">Not set yet</p>
              )}
            </div>

            {/* Partner Communication Style */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                Communication Style
              </h3>
              {partnerCommunicationStyle ? (
                <div>
                  <p className="text-sm font-medium text-warm-900">
                    {partnerCommunicationStyle.type}
                  </p>
                  <p className="text-sm text-warm-500 mt-0.5">
                    {partnerCommunicationStyle.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">Not set yet</p>
              )}
            </div>

            {/* Partner Interests */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                Shared Interests
              </h3>
              {partnerInterests && partnerInterests.items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {partnerInterests.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-warm-100 text-warm-700 text-sm rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">Not set yet</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 text-center">
            <p className="text-sm text-warm-400">
              {partnerData.partnerName} hasn&rsquo;t set up their profile yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
