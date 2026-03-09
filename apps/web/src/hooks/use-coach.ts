import { useCallback, useRef, useState } from 'react'
import {
  deleteThread,
  dismissNudge,
  getCoachNudges,
  getOrCreateThread,
  getThreadMessages,
  listThreads,
  saveCoachExchange,
} from '~/server/coach'

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
  createdAt: string
  updatedAt: string
}

export interface CoachNudge {
  id: string
  trigger: string
  message: string
  createdAt: string
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function normalizeThread(thread: {
  id: string
  title: string | null
  createdAt: Date | string
  updatedAt: Date | string
}): CoachThread {
  return {
    id: thread.id,
    title: thread.title,
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
  const [threads, setThreads] = useState<CoachThread[]>([])
  const [activeThread, setActiveThread] = useState<CoachThread | null>(null)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [nudges, setNudges] = useState<CoachNudge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const activeThreadRef = useRef<CoachThread | null>(null)
  const messageCountRef = useRef(0)

  const loadThreads = useCallback(async () => {
    const result = await listThreads() as Array<{
      id: string
      title: string | null
      createdAt: Date | string
      updatedAt: Date | string
    }>
    const normalized = result.map(normalizeThread)
    setThreads(normalized)
    return normalized
  }, [])

  const openThread = useCallback(async (threadId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const thread = normalizeThread(
        await getOrCreateThread({
          data: threadId ? { threadId } : {},
        }) as {
          id: string
          title: string | null
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
      } else {
        setMessages([])
        messageCountRef.current = 0
      }

      return thread
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open coach thread')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const newThread = useCallback(async () => {
    const thread = await openThread()
    await loadThreads()
    return thread
  }, [loadThreads, openThread])

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

    try {
      abortRef.current = new AbortController()

      const params = new URLSearchParams({
        threadId: thread.id,
        message: trimmed,
      })

      if (currentPage) {
        params.set('currentPage', currentPage)
      }

      const response = await fetch(`/sse/coach?${params.toString()}`, {
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to connect to coach')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Coach response stream unavailable')
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
            type: 'text' | 'done' | 'error' | 'ping'
            content?: string
            contextSnapshot?: Record<string, unknown>
          }

          if (payload.type === 'ping') continue

          if (payload.type === 'error') {
            throw new Error(payload.content || 'Coach request failed')
          }

          if (payload.type === 'text') {
            fullResponse += payload.content ?? ''
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
        }
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

      if (aborted && fullResponse.trim()) {
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
        setError(err instanceof Error ? err.message : 'Coach request failed')
      }
    } finally {
      abortRef.current = null
      setIsStreaming(false)
    }
  }, [currentPage, isStreaming, persistExchange])

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
