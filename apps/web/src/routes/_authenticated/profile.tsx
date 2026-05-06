import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import {
  getProfile,
  getPartnerProfile,
  updateProfile,
  type ProfileData,
} from '~/server/profile'
import {
  deleteMyImportedWhatsAppData,
  exportMyImportData,
  getImportDataSummary,
  type ImportDataSummary,
} from '~/server/data-controls'
import { NotificationSettings } from './-components/notification-settings'
import {
  buildCommunicationStyleDraft,
  buildInterestDraft,
  buildLoveLanguageDraft,
  buildProfileBridgeDraft,
  getProfileInterestItems,
} from './-components/profile-action-draft'
import {
  buildCareAvoidanceDraft,
  buildCareInstructionsDraft,
  buildCareInstructionsGoalDraft,
  buildCareMissRepairDraft,
  buildOverwhelmSignalsDraft,
  buildShareMyCareInstructionsDraft,
} from './-components/care-instructions-draft'
import {
  isUpgradeGateDetail,
  openUpgradeModal,
} from '~/lib/upgrade-gate'
import { useI18n } from '~/lib/i18n'
import type { Locale } from '~/lib/i18n'
import { formatRelationshipLabel } from './-components/chat/relationship-context-format'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

export const Route = createFileRoute('/_authenticated/profile')({
  loader: async ({ context }) => {
    if (!context.hasCouple) {
      return { hasCouple: false as const, profile: null, partnerData: null }
    }
    const [profile, partnerData] = await Promise.all([
      getProfile(),
      getPartnerProfile(),
    ])
    const importSummary = await getImportDataSummary()
    return { hasCouple: true as const, profile, partnerData, importSummary }
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
  const { t } = useI18n()
  if (source === 'ai') {
    return (
      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
        {t('AI detected')}
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
      {t('Manual')}
    </span>
  )
}

function EmptyField({ type }: { type: 'love-language' | 'communication-style' | 'interests' }) {
  const { t } = useI18n()
  const message =
    type === 'love-language'
      ? 'No love language data yet. Edit your profile or run an AI analysis.'
      : type === 'communication-style'
        ? 'No communication style data yet. Edit your profile or run an AI analysis.'
        : 'No interests data yet. Edit your profile or run an AI analysis.'

  return (
    <p className="text-sm text-warm-400 italic">
      {t(message)}
    </p>
  )
}

function ChatActionLink({
  draft,
  locale,
  children,
}: {
  draft: string
  locale: Locale
  children: ReactNode
}) {
  return (
    <Link
      to="/chat"
      onClick={() => storeChatDraft(draft, locale)}
      className="inline-flex rounded-lg border border-coral-200 bg-white px-3 py-1.5 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-50"
    >
      {children}
    </Link>
  )
}

function GoalActionLink({
  draft,
  locale,
  children,
}: {
  draft: { title: string; description?: string }
  locale: Locale
  children: ReactNode
}) {
  return (
    <Link
      to="/goals"
      onClick={() => storeGoalDraft(draft, locale)}
      className="inline-flex rounded-lg border border-sage-500/20 bg-white px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50"
    >
      {children}
    </Link>
  )
}

function CareInstructionsCard({
  partnerName,
  loveLanguagePrimary,
  loveLanguageSecondary,
  communicationType,
  communicationDescription,
  interests,
}: {
  partnerName: string
  loveLanguagePrimary?: string | null
  loveLanguageSecondary?: string | null
  communicationType?: string | null
  communicationDescription?: string | null
  interests: string[]
}) {
  const { locale, t } = useI18n()
  const draft = buildCareInstructionsDraft(partnerName, locale)
  const avoidDraft = buildCareAvoidanceDraft(partnerName, locale)
  const overwhelmDraft = buildOverwhelmSignalsDraft(partnerName, locale)
  const missRepairDraft = buildCareMissRepairDraft(partnerName, locale)
  const shareMineDraft = buildShareMyCareInstructionsDraft({
    partnerName,
    loveLanguagePrimary,
    loveLanguageSecondary,
    communicationType,
    communicationDescription,
    interests,
  }, locale)
  const goalDraft = buildCareInstructionsGoalDraft(partnerName, locale)

  return (
    <section className="mb-8 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_8px_24px_rgba(14,116,144,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
        {t('Care manual')}
      </p>
      <h2 className="mt-1 font-display text-xl text-warm-900">
        {t('Stop guessing what helps when one of you is hurt')}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-warm-600">
        {t('Ask for the practical instructions before the next hard moment: what support lands, how to pause without disappearing, what repair helps, and what to avoid.')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ChatActionLink draft={draft} locale={locale}>{t('Ask in chat')}</ChatActionLink>
        <ChatActionLink draft={avoidDraft} locale={locale}>{t('Ask what to avoid')}</ChatActionLink>
        <ChatActionLink draft={overwhelmDraft} locale={locale}>{t('Ask stress signs')}</ChatActionLink>
        <ChatActionLink draft={missRepairDraft} locale={locale}>{t('Repair miss')}</ChatActionLink>
        <ChatActionLink draft={shareMineDraft} locale={locale}>{t('Share mine first')}</ChatActionLink>
        <GoalActionLink draft={goalDraft} locale={locale}>{t('Make it a goal')}</GoalActionLink>
      </div>
    </section>
  )
}

function ProfileBridgeCard({
  partnerName,
  myLoveLanguage,
  partnerLoveLanguage,
  myCommunicationStyle,
  partnerCommunicationStyle,
}: {
  partnerName: string
  myLoveLanguage?: string | null
  partnerLoveLanguage?: string | null
  myCommunicationStyle?: string | null
  partnerCommunicationStyle?: string | null
}) {
  const { locale, t } = useI18n()
  const draft = buildProfileBridgeDraft({
    partnerName,
    myLoveLanguage,
    partnerLoveLanguage,
    myCommunicationStyle,
    partnerCommunicationStyle,
  }, locale)

  return (
    <section className="mb-8 rounded-2xl border border-sage-500/20 bg-sage-50 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_8px_24px_rgba(34,139,34,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-700">
            {t('Profile bridge')}
          </p>
          <h2 className="mt-1 font-display text-xl text-warm-900">
            {t('Turn both profiles into one small adjustment')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-600">
            {t('Use this when the profile data is interesting but you need it to become a real habit: one care adjustment and one conversation adjustment for this week.')}
          </p>
        </div>
        <ChatActionLink draft={draft} locale={locale}>{t('Bridge in chat')}</ChatActionLink>
      </div>
    </section>
  )
}

function DataTrustCard({
  summary,
  onSummaryChange,
}: {
  summary: ImportDataSummary
  onSummaryChange: (summary: ImportDataSummary) => void
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    setBusy('export')
    setStatus(null)
    try {
      const payload = await exportMyImportData()
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `amore-whatsapp-imports-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setStatus(t('Import data export prepared.'))
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('Failed to export import data.'))
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t('Delete imported WhatsApp rows and import records from Amore? This does not delete anything from WhatsApp.'),
    )
    if (!confirmed) return

    setBusy('delete')
    setStatus(null)
    try {
      const result = await deleteMyImportedWhatsAppData()
      const nextSummary = await getImportDataSummary()
      onSummaryChange(nextSummary)
      setStatus(
        t(`Deleted ${result.deletedExports} imports and ${result.deletedImportedMessages} imported messages.`),
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('Failed to delete imported data.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-warm-200 bg-white p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_8px_24px_rgba(42,33,24,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
            {t('Privacy and data')}
          </p>
          <h2 className="mt-1 text-base font-semibold text-warm-900">
            {t('Your import and coach data stay under your control')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {t('Uploaded WhatsApp exports are used to create your insights and coach context. Private coach threads are not shown to your partner unless you explicitly share them. Amore is not therapy or emergency support.')}
          </p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-700 sm:min-w-40">
          <p className="font-semibold text-warm-900">{summary.exportCount.toLocaleString()} {t('imports')}</p>
          <p className="mt-1 text-xs text-warm-500">
            {summary.importedMessageCount.toLocaleString()} {t('imported messages')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={busy !== null || summary.exportCount === 0}
          className="rounded-xl border border-warm-200 px-4 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy === 'export' ? t('Preparing export...') : t('Download import record')}
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy !== null || summary.exportCount === 0}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy === 'delete' ? t('Deleting...') : t('Delete imported WhatsApp data')}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-warm-400">
        {t('Deleting imported data removes upload records and imported message copies from Amore. It does not delete your WhatsApp history or messages your partner imported.')}
      </p>
      {status && (
        <p className="mt-3 rounded-xl bg-warm-50 px-3 py-2 text-xs text-warm-600">
          {status}
        </p>
      )}
    </section>
  )
}

// ── Page Component ──────────────────────────────────────

function ProfilePage() {
  const data = Route.useLoaderData()
  const { t, locale } = useI18n()

  if (!data.hasCouple) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-warm-900">{t('Relationship Profile')}</h1>
          <p className="text-warm-500 mt-1">{t('How you show up in your relationship')}</p>
        </div>
        <div className="bg-warm-100 rounded-2xl p-8 text-center">
          <p className="text-warm-500 mb-4">{t('Connect with your partner to build your relationship profile.')}</p>
          <Link to="/connect" className="text-coral-500 font-medium hover:underline">{t('Connect now')}</Link>
        </div>
      </div>
    )
  }

  const [profile, setProfile] = useState(data.profile)
  const partnerData = data.partnerData!
  const [importSummary, setImportSummary] = useState(data.importSummary)

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
  const interestItems = getProfileInterestItems(interests)
  const partnerInterestItems = getProfileInterestItems(partnerInterests)
  const loveLanguagePrimary = loveLanguages?.primary?.trim()
  const loveLanguageSecondary = loveLanguages?.secondary?.trim()
  const communicationType = communicationStyle?.type?.trim()
  const communicationDescription = communicationStyle?.description?.trim()
  const partnerLoveLanguagePrimary = partnerLoveLanguages?.primary?.trim()
  const partnerLoveLanguageSecondary = partnerLoveLanguages?.secondary?.trim()
  const partnerCommunicationType = partnerCommunicationStyle?.type?.trim()
  const partnerCommunicationDescription = partnerCommunicationStyle?.description?.trim()

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
    setEditInterests(interestItems.join(', '))
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
          search={{ upgraded: false }}
          className="text-sm text-warm-500 hover:text-warm-700 transition-colors"
        >
          {t('Back to Dashboard')}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <CareInstructionsCard
        partnerName={partnerData.partnerName}
        loveLanguagePrimary={loveLanguagePrimary}
        loveLanguageSecondary={loveLanguageSecondary}
        communicationType={communicationType}
        communicationDescription={communicationDescription}
        interests={interestItems}
      />

      <ProfileBridgeCard
        partnerName={partnerData.partnerName}
        myLoveLanguage={loveLanguagePrimary}
        partnerLoveLanguage={partnerLoveLanguagePrimary}
        myCommunicationStyle={communicationType}
        partnerCommunicationStyle={partnerCommunicationType}
      />

      <DataTrustCard
        summary={importSummary}
        onSummaryChange={setImportSummary}
      />

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
                {t('Love Languages')}
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
                {t('Edit')}
              </button>
            )}
          </div>

          {editing === 'love-languages' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  {t('Primary')}
                </label>
                <select
                  value={editLovePrimary}
                  onChange={(e) => setEditLovePrimary(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                >
                  <option value="">{t('Select...')}</option>
                  {LOVE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {t(lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  {t('Secondary')}{' '}
                  <span className="text-warm-400 font-normal">{t('(optional)')}</span>
                </label>
                <select
                  value={editLoveSecondary}
                  onChange={(e) => setEditLoveSecondary(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
                >
                  <option value="">{t('None')}</option>
                  {LOVE_LANGUAGES.filter((l) => l !== editLovePrimary).map(
                    (lang) => (
                      <option key={lang} value={lang}>
                        {t(lang)}
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
                  {saving ? t('Saving...') : t('Save')}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-coral-200 text-coral-700 text-sm rounded-lg font-medium hover:bg-coral-50 transition-colors"
                >
                  {t('Cancel')}
                </button>
              </div>
            </div>
          ) : loveLanguagePrimary ? (
            <div className="space-y-1">
              <p className="text-sm text-warm-900">
                <span className="text-warm-500">{t('Primary:')}</span>{' '}
                {formatRelationshipLabel(loveLanguagePrimary, locale)}
              </p>
              {loveLanguageSecondary && (
                <p className="text-sm text-warm-900">
                  <span className="text-warm-500">{t('Secondary:')}</span>{' '}
                  {formatRelationshipLabel(loveLanguageSecondary, locale)}
                </p>
              )}
            </div>
          ) : (
            <EmptyField type="love-language" />
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
                {t('Edit')}
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
          ) : communicationType ? (
            <div>
              <p className="text-sm font-medium text-warm-900">
                {communicationType}
              </p>
              {communicationDescription && (
                <p className="text-sm text-warm-500 mt-0.5">
                  {communicationDescription}
                </p>
              )}
            </div>
          ) : (
            <EmptyField type="communication-style" />
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
                {t('Edit')}
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
          ) : interestItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interestItems.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-warm-100 text-warm-700 text-sm rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <EmptyField type="interests" />
          )}
        </div>
      </div>

      {/* ── Notification Settings ────────────────────────── */}
      <NotificationSettings />

      {/* ── Partner's Profile (Read-Only) ────────────────── */}
      <div className="space-y-6 mt-10">
        <h2 className="font-display text-base text-warm-800">
          {locale === 'pt-BR' ? `Perfil de ${partnerData.partnerName}` : `${partnerData.partnerName}'s Profile`}
        </h2>

        {partnerProfile ? (
          <>
            {/* Partner Love Languages */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                {t('Love Languages')}
              </h3>
              {partnerLoveLanguagePrimary ? (
                <div className="space-y-1">
                  <p className="text-sm text-warm-900">
                    <span className="text-warm-500">{t('Primary:')}</span>{' '}
                    {formatRelationshipLabel(partnerLoveLanguagePrimary, locale)}
                  </p>
                  {partnerLoveLanguageSecondary && (
                    <p className="text-sm text-warm-900">
                      <span className="text-warm-500">{t('Secondary:')}</span>{' '}
                      {formatRelationshipLabel(partnerLoveLanguageSecondary, locale)}
                    </p>
                  )}
                  <div className="pt-3">
                    <ChatActionLink
                      locale={locale}
                      draft={buildLoveLanguageDraft(partnerData.partnerName, partnerLoveLanguagePrimary, locale)}
                    >
                      {t('Plan care in chat')}
                    </ChatActionLink>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">{t('Not set yet')}</p>
              )}
            </div>

            {/* Partner Communication Style */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                Communication Style
              </h3>
              {partnerCommunicationType ? (
                <div>
                  <p className="text-sm font-medium text-warm-900">
                    {partnerCommunicationType}
                  </p>
                  {partnerCommunicationDescription && (
                    <p className="text-sm text-warm-500 mt-0.5">
                      {partnerCommunicationDescription}
                    </p>
                  )}
                  <div className="mt-3">
                    <ChatActionLink
                      locale={locale}
                      draft={buildCommunicationStyleDraft(
                        partnerData.partnerName,
                        partnerCommunicationType,
                        partnerCommunicationDescription,
                        locale,
                      )}
                    >
                      Ask what helps
                    </ChatActionLink>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">{t('Not set yet')}</p>
              )}
            </div>

            {/* Partner Interests */}
            <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6">
              <h3 className="text-sm font-semibold text-warm-900 mb-3">
                Shared Interests
              </h3>
              {partnerInterestItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {partnerInterestItems.map((item) => (
                    <Link
                      key={item}
                      to="/chat"
                      onClick={() => {
                        storeChatDraft(buildInterestDraft(partnerData.partnerName, item, locale), locale)
                      }}
                      className="px-3 py-1 bg-warm-100 text-warm-700 text-sm rounded-full transition-colors hover:bg-coral-50 hover:text-coral-700"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-warm-400 italic">{t('Not set yet')}</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-warm-100 rounded-2xl shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)] p-6 text-center">
            <p className="text-sm text-warm-400">
              {locale === 'pt-BR'
                ? `${partnerData.partnerName} ainda nao configurou o perfil.`
                : `${partnerData.partnerName} hasn't set up their profile yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
