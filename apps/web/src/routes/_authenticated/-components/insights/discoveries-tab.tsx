import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { getInsightsData } from '~/server/insights'
import {
  buildImportantDateChatDraft,
  buildDiscoveryMove,
  buildInterestChatDraft,
  buildWishChatDraft,
  getEntityField,
  getEntityText,
  getDiscoveryList,
} from './discovery-actions'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft, storeGoalDraft } from '~/lib/chat-draft-storage'

type InsightsData = Awaited<ReturnType<typeof getInsightsData>>

// ── helpers ──────────────────────────────────────────────────────────────

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? parseDateOnly(d) : d
  if (Number.isNaN(date.getTime())) return String(d)

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const target = parseDateOnly(dateStr)
  if (Number.isNaN(target.getTime())) return null

  const now = new Date()
  // Set both to midnight for clean day diff
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function parseDateOnly(value: string) {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return new Date(value)
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warm-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-warm-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <p className="text-sm text-warm-400">{message}</p>
    </div>
  )
}

// ── Love Languages Radar ─────────────────────────────────────────────────

const CANONICAL_LANGUAGES = [
  'Words of Affirmation',
  'Quality Time',
  'Receiving Gifts',
  'Acts of Service',
  'Physical Touch',
] as const

type LoveLanguageEntry = { language: string; confidence: number }

function mapToCanonical(entries: LoveLanguageEntry[]): number[] {
  const scores = CANONICAL_LANGUAGES.map(() => 0)
  for (const entry of entries) {
    const lower = entry.language.toLowerCase()
    let bestIdx = -1
    let bestScore = 0
    CANONICAL_LANGUAGES.forEach((canon, i) => {
      const words = canon.toLowerCase().split(' ')
      const match = words.filter((w) => lower.includes(w)).length / words.length
      if (match > bestScore) {
        bestScore = match
        bestIdx = i
      }
    })
    if (bestIdx >= 0) {
      scores[bestIdx] = Math.max(scores[bestIdx], Number(entry.confidence) || 0)
    }
  }
  return scores
}

function LoveLanguagesRadar({
  myProfile,
  partnerProfile,
  partnerName,
}: {
  myProfile: InsightsData['myProfile']
  partnerProfile: InsightsData['partnerProfile']
  partnerName: string
}) {
  const { locale, t } = useI18n()
  const myLL = myProfile?.loveLanguages as unknown as LoveLanguageEntry[] | null
  const partnerLL = partnerProfile?.loveLanguages as unknown as LoveLanguageEntry[] | null

  const myScores = useMemo(() => (myLL && Array.isArray(myLL) ? mapToCanonical(myLL) : null), [myLL])
  const partnerScores = useMemo(
    () => (partnerLL && Array.isArray(partnerLL) ? mapToCanonical(partnerLL) : null),
    [partnerLL],
  )

  if (!myScores && !partnerScores) {
    return <EmptyState message={t("Love languages haven't been detected yet. Keep chatting naturally and they'll emerge.")} />
  }

  const size = 260
  const cx = size / 2
  const cy = size / 2
  const maxR = 100
  const n = 5

  // Pentagon vertex positions (start from top)
  const vertices = CANONICAL_LANGUAGES.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return { x: cx + maxR * Math.cos(angle), y: cy + maxR * Math.sin(angle) }
  })

  // Label positions (pushed further out)
  const labelR = maxR + 24
  const labels = CANONICAL_LANGUAGES.map((lang, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return { label: t(lang), x: cx + labelR * Math.cos(angle), y: cy + labelR * Math.sin(angle) }
  })

  // Score to polygon
  const scorePolygon = (scores: number[], maxVal: number) => {
    return scores
      .map((s, i) => {
        const r = (s / (maxVal || 1)) * maxR
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      })
      .join(' ')
  }

  const allScores = [...(myScores ?? []), ...(partnerScores ?? [])]
  const maxVal = Math.max(...allScores, 1)

  // Background rings
  const rings = [0.25, 0.5, 0.75, 1].map((pct) =>
    vertices
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        return `${cx + maxR * pct * Math.cos(angle)},${cy + maxR * pct * Math.sin(angle)}`
      })
      .join(' '),
  )

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto" style={{ height: size }}>
        {/* background rings */}
        {rings.map((ring, i) => (
          <polygon key={i} points={ring} fill="none" stroke="#EDE8E2" strokeWidth="1" />
        ))}

        {/* axes */}
        {vertices.map((v, i) => (
          <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="#EDE8E2" strokeWidth="1" />
        ))}

        {/* my scores */}
        {myScores && (
          <polygon
            points={scorePolygon(myScores, maxVal)}
            fill="#E8845A"
            fillOpacity="0.2"
            stroke="#E8845A"
            strokeWidth="1.5"
          />
        )}

        {/* partner scores */}
        {partnerScores && (
          <polygon
            points={scorePolygon(partnerScores, maxVal)}
            fill="#8BAA8B"
            fillOpacity="0.2"
            stroke="#8BAA8B"
            strokeWidth="1.5"
          />
        )}

        {/* vertex dots */}
        {vertices.map((v, i) => (
          <circle key={i} cx={v.x} cy={v.y} r="3" fill="#D4CBC2" />
        ))}

        {/* labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fill="#7A6E62"
            fontWeight="500"
          >
            {l.label}
          </text>
        ))}
      </svg>

      {/* legend */}
      <div className="flex justify-center gap-6 mt-2 text-xs text-warm-500">
        {myScores && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral-400 inline-block" />
            {t('You')}
          </span>
        )}
        {partnerScores && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-400 inline-block" />
            {partnerName}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Shared Interests ─────────────────────────────────────────────────────

function SharedInterests({
  myProfile,
  partnerProfile,
  partnerName,
}: {
  myProfile: InsightsData['myProfile']
  partnerProfile: InsightsData['partnerProfile']
  partnerName: string
}) {
  const { locale } = useI18n()
  const myInterests = getDiscoveryList(myProfile?.interests)
  const partnerInterests = getDiscoveryList(partnerProfile?.interests)

  if (myInterests.length === 0 && partnerInterests.length === 0) {
    return <EmptyState message="No interests discovered yet. They'll appear here as conversations reveal shared hobbies and passions." />
  }

  const mySet = new Set(myInterests.map((i) => i.toLowerCase()))
  const partnerSet = new Set(partnerInterests.map((i) => i.toLowerCase()))

  // Deduplicate and classify
  const allMap = new Map<string, 'shared' | 'mine' | 'partner'>()
  for (const i of myInterests) {
    const key = i.toLowerCase()
    if (partnerSet.has(key)) {
      allMap.set(key, 'shared')
    } else {
      allMap.set(key, 'mine')
    }
  }
  for (const i of partnerInterests) {
    const key = i.toLowerCase()
    if (!allMap.has(key)) {
      allMap.set(key, mySet.has(key) ? 'shared' : 'partner')
    }
  }

  // Get original-cased versions
  const originals = new Map<string, string>()
  for (const i of [...myInterests, ...partnerInterests]) {
    const key = i.toLowerCase()
    if (!originals.has(key)) originals.set(key, i)
  }

  const colorMap = {
    shared: 'bg-violet-50 text-violet-700 border-violet-200',
    mine: 'bg-coral-50 text-coral-700 border-coral-200',
    partner: 'bg-sage-50 text-sage-700 border-sage-200',
  }

  const sorted = Array.from(allMap.entries()).sort((a, b) => {
    const order = { shared: 0, mine: 1, partner: 2 }
    return order[a[1]] - order[b[1]]
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {sorted.map(([key, who]) => (
          <Link
            key={key}
            to="/chat"
            onClick={() => storeChatDraft(buildInterestChatDraft(originals.get(key) ?? key, locale), locale)}
            className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium border ${colorMap[who]}`}
          >
            {originals.get(key) ?? key}
          </Link>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-warm-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
          Shared
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-coral-400 inline-block" />
          You
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sage-400 inline-block" />
          {partnerName}
        </span>
      </div>
    </div>
  )
}

// ── Wishlist ─────────────────────────────────────────────────────────────

const DEFAULT_DISCOVERY_ROWS = 6

function Wishlist({ entities }: { entities: InsightsData['entities'] }) {
  const { locale, t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const wishes = entities.filter((e) => e.type === 'wish')

  if (wishes.length === 0) {
    return <EmptyState message="No wishes found yet. When you or your partner mention things you'd like, they'll show up here." />
  }

  const visibleWishes = showAll ? wishes : wishes.slice(0, DEFAULT_DISCOVERY_ROWS)
  const hiddenCount = wishes.length - visibleWishes.length

  return (
    <div className="space-y-3">
      {visibleWishes.map((wish) => {
        const text = getEntityText(wish)
        const speaker = getEntityField(wish, 'speaker')
        const status = getEntityField(wish, 'status') || String(wish.status ?? 'active')

        return (
          <div key={wish.id} className="p-4 bg-warm-50 rounded-xl flex items-start gap-3">
            <div className="mt-0.5">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-warm-800">{text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {speaker && (
                  <span className="text-xs text-warm-400">{speaker}</span>
                )}
                {wish.extractedAt && (
                  <span className="text-xs text-warm-300">{formatDate(wish.extractedAt)}</span>
                )}
              </div>
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildWishChatDraft(text, locale), locale)}
                className="mt-2 inline-flex rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50"
              >
                {t('Plan in chat')}
              </Link>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                status === 'fulfilled'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {status}
            </span>
          </div>
        )
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-semibold text-warm-600 transition-colors hover:border-warm-300 hover:bg-warm-50"
        >
          Show {hiddenCount} more wishes
        </button>
      )}
    </div>
  )
}

// ── Important Dates ──────────────────────────────────────────────────────

function ImportantDates({ entities }: { entities: InsightsData['entities'] }) {
  const { locale, t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const dates = entities.filter((e) => e.type === 'important_date')

  if (dates.length === 0) {
    return <EmptyState message="No important dates found yet. Mention birthdays, anniversaries, or special days in your chats." />
  }

  const visibleDates = showAll ? dates : dates.slice(0, DEFAULT_DISCOVERY_ROWS)
  const hiddenCount = dates.length - visibleDates.length

  return (
    <div className="space-y-3">
      {visibleDates.map((entity) => {
        const description = getEntityText(entity)
        const dateStr = getEntityField(entity, 'date')
        const countdown = dateStr ? daysUntil(dateStr) : null

        return (
          <div key={entity.id} className="p-4 bg-warm-50 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-warm-800">{description}</p>
              {dateStr && (
                <p className="text-xs text-warm-400 mt-0.5">{formatDate(dateStr)}</p>
              )}
              <Link
                to="/chat"
                onClick={() => storeChatDraft(buildImportantDateChatDraft(description || dateStr, locale), locale)}
                className="mt-2 inline-flex rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
              >
                {t('Plan in chat')}
              </Link>
            </div>
            {countdown !== null && (
              <div className="text-right flex-shrink-0">
                {countdown > 0 ? (
                  <>
                    <p className="text-lg font-bold text-violet-600">{countdown}</p>
                    <p className="text-[10px] text-warm-400 uppercase tracking-wide">days away</p>
                  </>
                ) : countdown === 0 ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Today!</span>
                ) : (
                  <span className="text-xs text-warm-400">{Math.abs(countdown)}d ago</span>
                )}
              </div>
            )}
          </div>
        )
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-semibold text-warm-600 transition-colors hover:border-warm-300 hover:bg-warm-50"
        >
          Show {hiddenCount} more dates
        </button>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

function DiscoveryMove({
  data,
  partnerName,
}: {
  data: InsightsData
  partnerName: string
}) {
  const { locale, t } = useI18n()
  const move = buildDiscoveryMove({
    myInterests: data.myProfile?.interests,
    partnerInterests: data.partnerProfile?.interests,
    entities: data.entities,
    partnerName,
    locale,
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
            Discovery move
          </p>
          <h3 className="mt-1 font-display text-lg text-warm-800">{move.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-warm-500">
            {move.detail} Make the discovery visible in the relationship, not just in the app.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to="/chat"
            onClick={() => storeChatDraft(move.chatDraft, locale)}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
          >
            {t('Open in chat')}
          </Link>
          <Link
            to="/goals"
            onClick={() => storeGoalDraft(move.goalDraft, locale)}
            className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
          >
            {t('Make it a goal')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function DiscoveriesTab({ data }: { data: InsightsData }) {
  const { t } = useI18n()
  const partnerName = data.partner?.name ?? 'Partner'
  const hasProfiles = data.myProfile || data.partnerProfile
  const hasEntities = data.entities.length > 0

  if (!hasProfiles && !hasEntities) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
          <EmptyState message={t('No discoveries yet. Keep chatting naturally — the AI will learn about your love languages, interests, wishes, and important dates.')} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DiscoveryMove data={data} partnerName={partnerName} />

      {/* Love Languages */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">{t('Love Languages')}</h3>
        <LoveLanguagesRadar
          myProfile={data.myProfile}
          partnerProfile={data.partnerProfile}
          partnerName={partnerName}
        />
      </div>

      {/* Shared Interests */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">{t('Shared Interests')}</h3>
        <SharedInterests
          myProfile={data.myProfile}
          partnerProfile={data.partnerProfile}
          partnerName={partnerName}
        />
      </div>

      {/* Wishlist */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">Wishlist</h3>
        <Wishlist entities={data.entities} />
      </div>

      {/* Important Dates */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
        <h3 className="font-display text-base text-warm-800 mb-4">Important Dates</h3>
        <ImportantDates entities={data.entities} />
      </div>
    </div>
  )
}
