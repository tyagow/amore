import { useEffect, useRef, useState } from 'react'
import { useCoach } from '~/hooks/use-coach'

function formatThreadDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function CoachBubble({
  role,
  content,
  isStreaming,
}: {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-coral-500 px-4 py-3 text-sm text-white shadow-sm">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-3xl rounded-bl-md border border-warm-200 bg-white px-4 py-3 text-sm leading-6 text-warm-800 shadow-sm whitespace-pre-wrap">
        {content}
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-coral-400 align-[-2px]" />
        )}
      </div>
    </div>
  )
}

function ThreadList({
  threads,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  threads: Array<{ id: string; title: string | null; updatedAt: string }>
  activeId: string | null
  onSelect: (threadId: string) => void
  onDelete: (threadId: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <button
          onClick={onNew}
          className="w-full rounded-2xl bg-coral-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-coral-600"
        >
          New conversation
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {threads.map((thread) => {
          const active = thread.id === activeId

          return (
            <div
              key={thread.id}
              className={`rounded-2xl border px-3 py-3 transition-colors ${
                active
                  ? 'border-coral-200 bg-coral-50'
                  : 'border-transparent bg-white hover:border-warm-200 hover:bg-warm-100/80'
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => onSelect(thread.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-sm font-medium text-warm-800">
                    {thread.title || 'Untitled conversation'}
                  </div>
                  <div className="mt-1 text-xs text-warm-400">
                    Updated {formatThreadDate(thread.updatedAt)}
                  </div>
                </button>
                <button
                  onClick={() => onDelete(thread.id)}
                  className="rounded-full p-1 text-warm-400 transition-colors hover:bg-white hover:text-red-500"
                  aria-label="Delete conversation"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}

        {threads.length === 0 && (
          <div className="rounded-3xl border border-dashed border-warm-200 bg-white/70 px-5 py-10 text-center">
            <p className="text-sm font-medium text-warm-700">No coach conversations yet</p>
            <p className="mt-1 text-xs text-warm-400">Start one and the coach will keep the thread history here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NudgeBanner({
  nudge,
  onDismiss,
  onEngage,
}: {
  nudge: { id: string; trigger: string; message: string }
  onDismiss: () => void
  onEngage: () => void
}) {
  return (
    <div className="mx-3 mt-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">Coach nudge</p>
          <p className="mt-1 text-sm leading-5 text-amber-800">{nudge.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onEngage}
              className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
            >
              Talk about it
            </button>
            <button
              onClick={onDismiss}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StarterShimmer() {
  return (
    <div className="space-y-3 px-3 py-4">
      <div className="rounded-3xl rounded-bl-md border border-warm-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-warm-200" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-warm-200" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-32 animate-pulse rounded-full bg-warm-100" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-warm-100" />
        <div className="h-8 w-36 animate-pulse rounded-full bg-warm-100" />
      </div>
    </div>
  )
}

function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 px-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-coral-200 bg-white px-3 py-1.5 text-xs font-medium text-coral-700 shadow-sm transition-colors hover:bg-coral-50 hover:border-coral-300 active:bg-coral-100"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

export function CoachSidebar({
  currentPage,
  onClose,
}: {
  currentPage?: string
  onClose: () => void
}) {
  const {
    threads,
    activeThread,
    messages,
    isStreaming,
    isLoading,
    nudges,
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
    dismissNudge,
  } = useCoach(currentPage)

  const [input, setInput] = useState('')
  const [showThreads, setShowThreads] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [threadList] = await Promise.all([loadThreads(), loadNudges()])
      if (cancelled) return

      if (threadList[0]) {
        await openThread(threadList[0].id)
        return
      }

      await openThread()
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [loadNudges, loadThreads, openThread])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    if (!showThreads && !isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading, showThreads])

  const handleSend = async (chipText?: string) => {
    const text = (chipText ?? input).trim()
    if (!text || isStreaming) return

    setInput('')
    await sendMessage(text)
  }

  const handleThreadSelect = async (threadId: string) => {
    await openThread(threadId)
    setShowThreads(false)
  }

  const handleThreadDelete = async (threadId: string) => {
    await removeThread(threadId)
  }

  const handleNewThread = async () => {
    await newThread()
    setShowThreads(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const handleNudgeEngage = async () => {
    const nudge = nudges[0]
    if (!nudge) return

    await dismissNudge(nudge.id)
    setInput(nudge.message)
    inputRef.current?.focus()
  }

  const pageLabel = currentPage
    ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
    : 'Relationship'

  return (
    <div className="flex h-full flex-col border-l border-warm-200 bg-[radial-gradient(circle_at_top,_rgba(255,241,232,0.9),_rgba(251,245,240,1)_45%,_rgba(246,239,232,1)_100%)]">
      <div className="border-b border-warm-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThreads((value) => !value)}
                className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
                aria-label="Toggle conversation history"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" />
                </svg>
              </button>
              <div>
                <h2 className="text-sm font-semibold text-warm-900">
                  {showThreads ? 'Conversation history' : activeThread?.title || 'Relationship coach'}
                </h2>
                <p className="text-xs text-warm-400">
                  {showThreads ? 'Switch or clear old threads' : 'Direct guidance with your real relationship context'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!showThreads && (
              <button
                onClick={() => void handleNewThread()}
                className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-coral-600"
                aria-label="New conversation"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
              aria-label="Close coach"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!showThreads && (
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-[11px] font-medium text-coral-700">
              Context: {pageLabel}
            </span>
            {activeThread?.updatedAt && (
              <span className="text-[11px] text-warm-400">
                Updated {formatThreadDate(activeThread.updatedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {showThreads ? (
        <ThreadList
          threads={threads}
          activeId={activeThread?.id ?? null}
          onSelect={(threadId) => void handleThreadSelect(threadId)}
          onDelete={(threadId) => void handleThreadDelete(threadId)}
          onNew={() => void handleNewThread()}
        />
      ) : (
        <>
          {nudges[0] && (
            <NudgeBanner
              nudge={nudges[0]}
              onDismiss={() => void dismissNudge(nudges[0].id)}
              onEngage={() => void handleNudgeEngage()}
            />
          )}

          {error && (
            <div className="mx-3 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-coral-200 border-t-coral-500" />
              </div>
            ) : messages.length === 0 ? (
              starterLoading ? (
                <StarterShimmer />
              ) : starter ? (
                <div className="space-y-3">
                  <CoachBubble role="assistant" content={starter.insight} />
                  <SuggestionChips
                    suggestions={starter.suggestions}
                    onSelect={(text) => {
                      void handleSend(text)
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-warm-200 bg-white/75 px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-coral-50 text-coral-600">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.895-.356-1.755-.988-2.387l-.547-.547Z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm font-medium text-warm-800">Ask about tension, communication, goals, or what your recent patterns mean.</p>
                  <p className="mt-2 text-xs leading-5 text-warm-500">The coach uses your relationship history, recent insights, and prior coaching threads to answer directly.</p>
                </div>
              )
            ) : (
              messages.map((message) => (
                <CoachBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={message.isStreaming}
                />
              ))
            )}
          </div>

          <div className="border-t border-warm-200/80 bg-white/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-sm">
            <div className="flex items-end gap-1.5 rounded-2xl border border-warm-200/60 bg-white px-3 py-1.5 shadow-sm transition-colors focus-within:border-coral-300 focus-within:ring-1 focus-within:ring-coral-300/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                rows={1}
                className="max-h-24 min-h-[2rem] flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-5 text-warm-800 outline-none placeholder:text-warm-400"
                onInput={(event) => {
                  const target = event.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 96)}px`
                }}
                disabled={isLoading}
              />

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warm-100 text-warm-600 transition-colors hover:bg-warm-200"
                  aria-label="Stop coach response"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-500 text-white transition-colors hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Send coach message"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 12 14 0m-7-7 7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
