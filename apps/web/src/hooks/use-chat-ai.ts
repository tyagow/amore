import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '~/types/chat'
import {
  getChatAISuggestions,
  getChatAIMood,
  getChatAIReview,
} from '~/server/chat'
import { getIntelligence } from '~/server/intelligence'

// ── Types ───────────────────────────────────────────────

interface AISidebarState {
  suggestions: string[]
  mood: string | null
  coaching: string[]
  tensionFlag: boolean
  review: { tone: string; suggestions: string[]; revised: string } | null
  suggestionsLoading: boolean
  moodLoading: boolean
  reviewLoading: boolean
  aiError: string | null
}

export interface PartnerProfile {
  loveLanguages?: Array<{ language: string; confidence: number }> | null
  communicationStyle?: Record<string, Record<string, number>> | null
  interests?: string[] | null
}

export interface InsightRow {
  id: string
  coupleId: string
  type: string
  content: Record<string, unknown>
  severity: string | null
  generatedAt: Date
}

interface RelationshipData {
  healthScore: number | null
  partnerName: string | null
  contactJid: string | null
  partnerProfile: PartnerProfile | null
  recentInsights: InsightRow[]
  totalMessages: number
  coupleId: string | null
}

export interface UseChatAIReturn extends AISidebarState {
  reviewDraft: (text: string) => Promise<void>
  clearReview: () => void
  healthScore: number | null
  partnerProfile: PartnerProfile | null
  recentInsights: InsightRow[]
  partnerName: string | null
  contactJid: string | null
  totalMessages: number
  coupleId: string | null
}

// ── Helpers ─────────────────────────────────────────────

function recentMessagePayload(
  messages: ChatMessage[],
  count = 15,
): Array<{ sender: string; text: string; timestamp: string; fromMe: boolean }> {
  return messages
    .filter((m) => m.text)
    .slice(-count)
    .map((m) => ({
      sender: m.sender,
      text: m.text!,
      timestamp:
        m.timestamp instanceof Date
          ? m.timestamp.toISOString()
          : m.timestamp,
      fromMe: m.fromMe,
    }))
}

/** Returns true if under rate limit. Mutates the array in-place to prune old entries. */
function checkRateLimit(
  times: number[],
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const recentCalls = times.filter((t) => now - t < windowMs)
  times.length = 0
  times.push(...recentCalls)
  return recentCalls.length < max
}

// ── Hook ────────────────────────────────────────────────

export function useChatAI(messages: ChatMessage[]): UseChatAIReturn {
  const [state, setState] = useState<AISidebarState>({
    suggestions: [],
    mood: null,
    coaching: [],
    tensionFlag: false,
    review: null,
    suggestionsLoading: false,
    moodLoading: false,
    reviewLoading: false,
    aiError: null,
  })

  const [relData, setRelData] = useState<RelationshipData>({
    healthScore: null,
    partnerName: null,
    contactJid: null,
    partnerProfile: null,
    recentInsights: [],
    totalMessages: 0,
    coupleId: null,
  })

  // Rate limiting refs
  const suggestionCallTimesRef = useRef<number[]>([])
  const moodCallTimesRef = useRef<number[]>([])
  const reviewCallTimesRef = useRef<number[]>([])
  const messageCountSinceLastMoodRef = useRef(0)
  const prevMessageCountRef = useRef(0)
  const suggestionsAbortRef = useRef<AbortController | null>(null)
  const suggestionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Load relationship data on mount via unified intelligence
  useEffect(() => {
    getIntelligence()
      .then((result: unknown) => {
        const res = result as Record<string, unknown>
        if ('error' in res) return

        const couple = res.couple as { id: string; healthScore: number | null; whatsappJid: string | null }
        const recentInsights = (
          res.recentInsights as InsightRow[] | undefined
        ) ?? []

        // Pre-populate coaching tips from persisted insights
        const persistedCoaching = recentInsights
          .filter((i) => i.type === 'coaching_tip')
          .map((i) => {
            const content = i.content as { tip?: string }
            return content.tip ?? ''
          })
          .filter(Boolean)

        if (persistedCoaching.length > 0) {
          setState((prev) =>
            prev.coaching.length === 0
              ? { ...prev, coaching: persistedCoaching }
              : prev,
          )
        }

        const partner = res.partner as { name: string | null } | undefined
        const messageStats = res.messageStats as { totalMessages: number } | null

        setRelData({
          healthScore: couple.healthScore,
          partnerName: partner?.name ?? null,
          contactJid: couple.whatsappJid ?? null,
          partnerProfile: res.partnerProfile
            ? (res.partnerProfile as PartnerProfile)
            : null,
          recentInsights,
          totalMessages: messageStats?.totalMessages ?? 0,
          coupleId: couple.id,
        })
      })
      .catch(() => {
        // Couple may not exist yet
      })
  }, [])

  // Set error with auto-clear after 10s
  const setAiError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, aiError: error }))
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, aiError: null }))
    }, 10000)
  }, [])

  // Reply suggestions: trigger on new incoming message, debounce 3s, rate-limited 6/min
  useEffect(() => {
    if (messages.length === 0) return

    const currentCount = messages.length
    if (currentCount <= prevMessageCountRef.current) {
      prevMessageCountRef.current = currentCount
      return
    }

    const delta = currentCount - prevMessageCountRef.current
    const lastMessage = messages[messages.length - 1]
    prevMessageCountRef.current = currentCount

    // Increment mood counter for each new message (but not on history loads, delta <= 3)
    if (delta <= 3) {
      messageCountSinceLastMoodRef.current += delta
    }

    // Only trigger suggestions on incoming (non-fromMe) messages
    if (lastMessage.fromMe) return

    // Cancel previous in-flight request
    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current.abort()
    }
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current)
    }

    suggestionsTimerRef.current = setTimeout(async () => {
      if (!checkRateLimit(suggestionCallTimesRef.current, 6, 60000)) return

      suggestionsAbortRef.current = new AbortController()
      suggestionCallTimesRef.current.push(Date.now())

      setState((prev) => ({ ...prev, suggestionsLoading: true }))
      try {
        const result = await getChatAISuggestions({
          data: {
            messages: recentMessagePayload(messagesRef.current),
          },
        })
        if (typeof result === 'object' && result !== null && 'error' in result) {
          setAiError((result as Record<string, unknown>).error as string)
        } else {
          const res = result as { suggestions: string[] }
          setState((prev) => ({
            ...prev,
            suggestions: res.suggestions,
            suggestionsLoading: false,
          }))
          return
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          setAiError('Failed to load reply suggestions')
        }
      }
      setState((prev) => ({ ...prev, suggestionsLoading: false }))
    }, 3000)
  }, [messages.length, setAiError])

  // Mood/coaching: trigger every 7 new messages, rate-limited 2/min
  useEffect(() => {
    if (messages.length === 0) return
    if (messageCountSinceLastMoodRef.current < 7) return

    messageCountSinceLastMoodRef.current = 0

    if (!checkRateLimit(moodCallTimesRef.current, 2, 60000)) return
    moodCallTimesRef.current.push(Date.now())

    setState((prev) => ({ ...prev, moodLoading: true }))

    getChatAIMood({
      data: {
        messages: recentMessagePayload(messagesRef.current, 20),
      },
    })
      .then((result: unknown) => {
        const res = result as Record<string, unknown>
        if ('error' in res && typeof res.error === 'string') {
          setAiError(res.error)
          setState((prev) => ({ ...prev, moodLoading: false }))
        } else {
          setState((prev) => ({
            ...prev,
            mood: res.mood as string,
            coaching: res.coaching as string[],
            tensionFlag: res.tensionFlag as boolean,
            moodLoading: false,
          }))
        }
      })
      .catch(() => {
        setAiError('Failed to analyze mood')
        setState((prev) => ({ ...prev, moodLoading: false }))
      })
  }, [messages.length, setAiError])

  // Review draft -- manual call, rate-limited 3/hr
  const reviewDraft = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      if (!checkRateLimit(reviewCallTimesRef.current, 3, 3600000)) {
        setAiError('Review limit reached. Try again in a few minutes.')
        return
      }
      reviewCallTimesRef.current.push(Date.now())

      setState((prev) => ({ ...prev, reviewLoading: true }))
      try {
        const result = await getChatAIReview({
          data: {
            draft: text,
            messages: recentMessagePayload(messagesRef.current, 10),
          },
        })
        if (typeof result === 'object' && result !== null && 'error' in result) {
          setAiError((result as Record<string, unknown>).error as string)
        } else {
          const raw = result as {
            tone: string
            suggestions: string[]
            revised: string
          }
          // Em-dash cleanup
          const clean = (s: string) => s.replace(/\s*\u2014\s*/g, ' ')
          setState((prev) => ({
            ...prev,
            review: {
              tone: raw.tone,
              suggestions: raw.suggestions.map(clean),
              revised: clean(raw.revised),
            },
          }))
        }
      } catch {
        setAiError('Failed to review message')
      }
      setState((prev) => ({ ...prev, reviewLoading: false }))
    },
    [setAiError],
  )

  const clearReview = useCallback(() => {
    setState((prev) => ({ ...prev, review: null }))
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      if (suggestionsAbortRef.current) suggestionsAbortRef.current.abort()
    }
  }, [])

  return {
    ...state,
    reviewDraft,
    clearReview,
    healthScore: relData.healthScore,
    partnerProfile: relData.partnerProfile,
    recentInsights: relData.recentInsights,
    partnerName: relData.partnerName,
    contactJid: relData.contactJid,
    totalMessages: relData.totalMessages,
    coupleId: relData.coupleId,
  }
}
