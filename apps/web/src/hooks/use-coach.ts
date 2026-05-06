import { useCallback, useRef, useState } from 'react'
import {
  deleteThread,
  dismissNudge,
  getCoachNudges,
  getCoachStarter,
  getOrCreateThread,
  getThreadMessages,
  listThreads,
  saveCoachExchange,
} from '~/server/coach'
import { openUpgradeModal } from '~/lib/upgrade-gate'
import { useI18n } from '~/lib/i18n'
import {
  getCoachThreadVisibility,
  type CoachThreadVisibility,
} from '~/server/coach-authorization'

export interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  isStreaming?: boolean
}

export interface CoachThread {
  id: string
  title: string | null
  visibility: CoachThreadVisibility
  createdAt: string
  updatedAt: string
}

export interface CoachNudge {
  id: string
  trigger: string
  message: string
  createdAt: string
}

export interface CoachStarter {
  insight: string
  suggestions: string[]
}

const COACH_STREAM_STALL_TIMEOUT_MS = 60_000

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function normalizeThread(thread: {
  id: string
  title: string | null
  coupleId?: string | null
  userId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}): CoachThread {
  return {
    id: thread.id,
    title: thread.title,
    visibility: getCoachThreadVisibility({
      coupleId: thread.coupleId ?? null,
      userId: thread.userId ?? null,
    }),
    createdAt: toIsoString(thread.createdAt),
    updatedAt: toIsoString(thread.updatedAt),
  }
}

function normalizeMessage(message: {
  id: string
  role: string
  content: string
  createdAt: Date | string
}): CoachMessage {
  return {
    id: message.id,
    role: message.role as CoachMessage['role'],
    content: message.content,
    createdAt: toIsoString(message.createdAt),
  }
}

function normalizeNudge(nudge: {
  id: string
  trigger: string
  message: string
  createdAt: Date | string
}): CoachNudge {
  return {
    id: nudge.id,
    trigger: nudge.trigger,
    message: nudge.message,
    createdAt: toIsoString(nudge.createdAt),
  }
}

export function useCoach(currentPage?: string) {
  const { locale, t } = useI18n()
  const [threads, setThreads] = useState<CoachThread[]>([])
  const [activeThread, setActiveThread] = useState<CoachThread | null>(null)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [nudges, setNudges] = useState<CoachNudge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starter, setStarter] = useState<CoachStarter | null>(null)
  const [starterLoading, setStarterLoading] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const activeThreadRef = useRef<CoachThread | null>(null)
  const messageCountRef = useRef(0)

  const loadThreads = useCallback(async () => {
    const result = await listThreads() as Array<{
      id: string
      title: string | null
      coupleId?: string | null
      userId?: string | null
      createdAt: Date | string
      updatedAt: Date | string
    }>
    const normalized = result.map(normalizeThread)
    setThreads(normalized)
    return normalized
  }, [])

  const loadNudges = useCallback(async () => {
    const result = await getCoachNudges() as Array<{
      id: string
      trigger: string
      message: string
      createdAt: Date | string
    }>
    const normalized = result.map(normalizeNudge)
    setNudges(normalized)
    return normalized
  }, [])

  const loadStarter = useCallback(async (threadMessages: CoachMessage[]) => {

    // New thread (no messages) or stale thread (last message > 1h ago)
    const isNew = threadMessages.length === 0
    const isStale = threadMessages.length > 0 &&
      Date.now() - new Date(threadMessages[threadMessages.length - 1].createdAt).getTime() > 60 * 60 * 1000

    if (!isNew && !isStale) {
      setStarter(null)
      return
    }

    setStarterLoading(true)
    try {
      const result = await getCoachStarter({ data: { locale } })
      setStarter(result as CoachStarter | null)
    } catch (err) {
      console.error('[coach] failed to load starter', err)
      setStarter(null)
    } finally {
      setStarterLoading(false)
    }
  }, [currentPage, locale])

  const openThread = useCallback(async (
    threadId?: string,
    visibility: CoachThreadVisibility = 'private',
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const thread = normalizeThread(
        await getOrCreateThread({
          data: threadId ? { threadId } : { visibility },
        }) as {
          id: string
          title: string | null
          coupleId?: string | null
          userId?: string | null
          createdAt: Date | string
          updatedAt: Date | string
        },
      )

      activeThreadRef.current = thread
      setActiveThread(thread)

      if (threadId) {
        const result = await getThreadMessages({ data: { threadId } }) as Array<{
          id: string
          role: string
          content: string
          createdAt: Date | string
        }>
        const normalized = result.map(normalizeMessage)
        setMessages(normalized)
        messageCountRef.current = normalized.length
        void loadStarter(normalized)
      } else {
        setMessages([])
        messageCountRef.current = 0
        void loadStarter([])
      }

      return thread
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to open coach thread'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadStarter, t])

  const newThread = useCallback(async (visibility: CoachThreadVisibility = 'private') => {
    const thread = await openThread(undefined, visibility)
    await loadThreads()
    return thread
  }, [loadThreads, openThread])

  const persistExchange = useCallback(async ({
    threadId,
    userMessage,
    assistantMessage,
    contextSnapshot,
    isFirstMessage,
  }: {
    threadId: string
    userMessage: string
    assistantMessage: string
    contextSnapshot?: Record<string, unknown>
    isFirstMessage: boolean
  }) => {
    await saveCoachExchange({
      data: {
        threadId,
        userMessage,
        assistantMessage,
        contextSnapshot,
        isFirstMessage,
      },
    })

    const latestThreads = await loadThreads()
    const refreshed = latestThreads.find((thread) => thread.id === threadId)
    if (refreshed) {
      activeThreadRef.current = refreshed
      setActiveThread(refreshed)
    }
  }, [loadThreads])

  const sendMessage = useCallback(async (text: string) => {
    const thread = activeThreadRef.current
    if (!thread || isStreaming) return

    const trimmed = text.trim()
    if (!trimmed) return

    setError(null)
    setStarter(null)

    const userMessage: CoachMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    const assistantId = `temp-assistant-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      },
    ])

    setIsStreaming(true)
    const isFirstMessage = messageCountRef.current === 0
    let fullResponse = ''
    let contextSnapshot: Record<string, unknown> | undefined
    let limitReached = false
    let timedOut = false
    let streamWatchdog: ReturnType<typeof setTimeout> | null = null
    const timeoutMessage = t('Coach response timed out. Please try again.')

    function clearStreamWatchdog() {
      if (streamWatchdog) {
        clearTimeout(streamWatchdog)
        streamWatchdog = null
      }
    }

    function armStreamWatchdog() {
      clearStreamWatchdog()
      streamWatchdog = setTimeout(() => {
        timedOut = true
        abortRef.current?.abort()
      }, COACH_STREAM_STALL_TIMEOUT_MS)
    }

    try {
      abortRef.current = new AbortController()
      armStreamWatchdog()

      const params = new URLSearchParams({
        threadId: thread.id,
        message: trimmed,
      })

      if (currentPage) {
        params.set('currentPage', currentPage)
      }
      params.set('locale', locale)

      const response = await fetch(`/sse/coach?${params.toString()}`, {
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(t('Failed to connect to coach'))
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error(t('Coach response stream unavailable'))
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const line = chunk
            .split('\n')
            .find((entry) => entry.startsWith('data: '))

          if (!line) continue

          const payload = JSON.parse(line.slice(6)) as {
            type: 'text' | 'done' | 'error' | 'ping' | 'limit_reached'
            content?: string
            contextSnapshot?: Record<string, unknown>
            feature?: string
            limit?: number
            used?: number
            resetAt?: string
            upgradeUrl?: string
          }

          if (payload.type === 'ping') continue

          if (payload.type === 'limit_reached') {
            limitReached = true
            clearStreamWatchdog()
            openUpgradeModal({
              feature: payload.feature ?? 'coach_message',
              limit: payload.limit,
              used: payload.used,
              resetAt: payload.resetAt,
              upgradeUrl: payload.upgradeUrl,
            })
            break
          }

          if (payload.type === 'error') {
            clearStreamWatchdog()
            throw new Error(payload.content || t('Coach request failed'))
          }

          if (payload.type === 'text') {
            fullResponse += payload.content ?? ''
            armStreamWatchdog()
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: fullResponse, isStreaming: true }
                  : message,
              ),
            )
            continue
          }

          fullResponse = payload.content ?? fullResponse
          contextSnapshot = payload.contextSnapshot
          clearStreamWatchdog()
        }

        if (limitReached) {
          break
        }
      }

      if (limitReached) {
        setMessages((prev) => prev.filter((message) => message.id !== assistantId))
        return
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: fullResponse, isStreaming: false }
            : message,
        ),
      )

      messageCountRef.current += 2

      if (fullResponse.trim()) {
        void persistExchange({
          threadId: thread.id,
          userMessage: trimmed,
          assistantMessage: fullResponse,
          contextSnapshot,
          isFirstMessage,
        }).catch((err) => {
          console.error('[coach] failed to persist exchange', err)
        })
      }
    } catch (err) {
      const aborted =
        err instanceof Error && err.name === 'AbortError'

      if (timedOut) {
        if (fullResponse.trim()) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: fullResponse, isStreaming: false }
                : message,
            ),
          )
        } else {
          setMessages((prev) => prev.filter((message) => message.id !== assistantId))
        }
        setError(timeoutMessage)
      } else if (aborted && fullResponse.trim()) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: fullResponse, isStreaming: false }
              : message,
          ),
        )
        messageCountRef.current += 2
        void persistExchange({
          threadId: thread.id,
          userMessage: trimmed,
          assistantMessage: fullResponse,
          contextSnapshot,
          isFirstMessage,
        }).catch((persistError) => {
          console.error('[coach] failed to persist partial exchange', persistError)
        })
      } else {
        setMessages((prev) => prev.filter((message) => message.id !== assistantId))
      }

      if (!aborted) {
        setError(err instanceof Error ? err.message : t('Coach request failed'))
      }
    } finally {
      clearStreamWatchdog()
      abortRef.current = null
      setIsStreaming(false)
    }
  }, [currentPage, isStreaming, locale, persistExchange, t])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const removeThread = useCallback(async (threadId: string) => {
    await deleteThread({ data: { threadId } })

    if (activeThreadRef.current?.id === threadId) {
      activeThreadRef.current = null
      setActiveThread(null)
      setMessages([])
      messageCountRef.current = 0
    }

    const latestThreads = await loadThreads()
    if (!activeThreadRef.current && latestThreads[0]) {
      await openThread(latestThreads[0].id)
    }
  }, [loadThreads, openThread])

  const handleDismissNudge = useCallback(async (nudgeId: string) => {
    await dismissNudge({ data: { nudgeId } })
    setNudges((prev) => prev.filter((nudge) => nudge.id !== nudgeId))
  }, [])

  return {
    threads,
    activeThread,
    messages,
    isStreaming,
    nudges,
    isLoading,
    error,
    starter,
    starterLoading,
    loadThreads,
    openThread,
    newThread,
    sendMessage,
    stopStreaming,
    removeThread,
    loadNudges,
    dismissNudge: handleDismissNudge,
  }
}
