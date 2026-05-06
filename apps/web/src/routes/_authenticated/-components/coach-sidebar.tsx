import { useEffect, useRef, useState } from 'react'
import { useCoach } from '~/hooks/use-coach'
import { useI18n, type Locale } from '~/lib/i18n'
import type { CoachThreadVisibility } from '~/server/coach-authorization'

function formatThreadDate(value: string, locale: Locale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
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
  threads: Array<{
    id: string
    title: string | null
    visibility: CoachThreadVisibility
    updatedAt: string
  }>
  activeId: string | null
  onSelect: (threadId: string) => void
  onDelete: (threadId: string) => void
  onNew: () => void
}) {
  const { locale, t } = useI18n()
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <button
          onClick={onNew}
          className="w-full rounded-2xl bg-coral-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-coral-600"
        >
          {t('New conversation')}
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
                    {thread.title || t('Untitled conversation')}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-warm-400">
                    <span>{t('Updated')} {formatThreadDate(thread.updatedAt, locale)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      thread.visibility === 'shared'
                        ? 'bg-sage-50 text-sage-700'
                        : 'bg-warm-100 text-warm-500'
                    }`}
                    >
                      {thread.visibility === 'shared' ? t('Shared') : t('Private')}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => onDelete(thread.id)}
                  className="rounded-full p-1 text-warm-400 transition-colors hover:bg-white hover:text-red-500"
                  aria-label={t('Delete conversation')}
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
            <p className="text-sm font-medium text-warm-700">{t('No coach conversations yet')}</p>
            <p className="mt-1 text-xs text-warm-400">{t('Start one and the coach will keep the thread history here.')}</p>
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
  const { t } = useI18n()
  return (
    <div className="mx-3 mt-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">{t('Coach nudge')}</p>
          <p className="mt-1 text-sm leading-5 text-amber-800">{nudge.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onEngage}
              className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
            >
              {t('Talk about it')}
            </button>
            <button
              onClick={onDismiss}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              {t('Dismiss')}
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

const QUICK_COACH_PROMPTS = [
  {
    label: 'Prepare repair',
    prompt: 'Help me prepare a calm repair conversation. I want to start with appreciation, own my part, and ask to understand without sounding defensive.',
    labelPt: 'Preparar reparo',
    promptPt: 'Me ajude a preparar uma conversa calma de reparo. Quero comecar com apreciacao, assumir minha parte e perguntar para entender sem soar defensivo(a).',
  },
  {
    label: 'Ask a better question',
    prompt: 'Give me three gentle questions I can ask my partner today that invite honesty without pressure.',
    labelPt: 'Pergunta melhor',
    promptPt: 'Me de tres perguntas gentis que eu possa fazer hoje para convidar honestidade sem pressao.',
  },
  {
    label: 'Choose one goal',
    prompt: 'Help me choose one tiny relationship goal for this week that is specific enough to actually do.',
    labelPt: 'Escolher uma meta',
    promptPt: 'Me ajude a escolher uma meta pequena de relacionamento para esta semana que seja especifica o bastante para realmente fazer.',
  },
  {
    label: 'Own my part',
    prompt: 'Help me write a message where I own my part without over-apologizing or making it about my guilt.',
    labelPt: 'Assumir minha parte',
    promptPt: 'Me ajude a escrever uma mensagem em que eu assumo minha parte sem pedir desculpas demais nem transformar isso na minha culpa.',
  },
  {
    label: 'Plan apology',
    prompt: 'Help me prepare a clear apology that names what I did, the impact I can see, what I own, and one repair ask without defending myself.',
    labelPt: 'Planejar desculpa',
    promptPt: 'Me ajude a preparar um pedido de desculpas claro que nomeie o que eu fiz, o impacto que consigo ver, o que assumo e um pedido de reparo sem me defender.',
  },
  {
    label: 'Build appreciation',
    prompt: 'Help me write a specific appreciation that names what I noticed, what it showed me about my partner, and how it made me feel.',
    labelPt: 'Criar apreciacao',
    promptPt: 'Me ajude a escrever uma apreciacao especifica que nomeie o que percebi, o que isso me mostrou sobre minha parceria e como me fez sentir.',
  },
]

function QuickCoachPrompts({
  onSelect,
}: {
  onSelect: (text: string) => void
}) {
  const { locale, t } = useI18n()
  return (
    <div className="shrink-0 px-3 pb-3 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
        {t('Start with a hard thing')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_COACH_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            onClick={() => onSelect(locale === 'pt-BR' ? prompt.promptPt : prompt.prompt)}
            className="rounded-2xl border border-warm-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-4 text-warm-700 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700"
          >
            {locale === 'pt-BR' ? prompt.labelPt : prompt.label}
          </button>
        ))}
      </div>
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
  const { locale, t } = useI18n()
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
  const [nextVisibility, setNextVisibility] = useState<CoachThreadVisibility>('private')
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

  useEffect(() => {
    if (showThreads || isLoading) return
    const draft = window.localStorage.getItem('amore-coach-draft')
    if (!draft) return
    window.localStorage.removeItem('amore-coach-draft')
    setInput(draft)
    requestAnimationFrame(() => inputRef.current?.focus())
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

  const handleNewThread = async (visibility: CoachThreadVisibility = nextVisibility) => {
    await newThread(visibility)
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
    : t('Relationship')

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-warm-200 bg-[radial-gradient(circle_at_top,_rgb(255,241,232),_rgb(251,245,240)_45%,_rgb(246,239,232)_100%)]">
      <div className="shrink-0 border-b border-warm-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThreads((value) => !value)}
                className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
                aria-label={t('Toggle conversation history')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" />
                </svg>
              </button>
              <div>
                <h2 className="text-sm font-semibold text-warm-900">
                  {showThreads ? t('Conversation history') : activeThread?.title || t('Relationship coach')}
                </h2>
                <p className="text-xs text-warm-400">
                  {showThreads ? t('Switch or clear old threads') : t('Direct guidance with your real relationship context')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!showThreads && (
              <button
                onClick={() => void handleNewThread()}
                className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-coral-600"
                aria-label={t('New conversation')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
              aria-label={t('Close coach')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!showThreads && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-[11px] font-medium text-coral-700">
                {t('Context')}: {pageLabel}
              </span>
              {activeThread && (
                <span className="rounded-full border border-warm-200 bg-white px-2.5 py-1 text-[11px] font-medium text-warm-500">
                  {activeThread.visibility === 'shared' ? t('Shared') : t('Private')}
                </span>
              )}
              {activeThread?.updatedAt && (
                <span className="text-[11px] text-warm-400">
                  {t('Updated')} {formatThreadDate(activeThread.updatedAt, locale)}
                </span>
              )}
            </div>
            <p className="text-[11px] leading-4 text-warm-400">
              {activeThread?.visibility === 'shared'
                ? t('Shared coach thread. Both partners can use this thread. Not therapy, emergency help, or abuse mediation.')
                : t('Private coach thread. Not shared with your partner unless you explicitly start a shared thread. Not therapy, emergency help, or abuse mediation.')}
            </p>
          </div>
        )}
      </div>

      {showThreads ? (
        <ThreadList
          threads={threads}
          activeId={activeThread?.id ?? null}
          onSelect={(threadId) => void handleThreadSelect(threadId)}
          onDelete={(threadId) => void handleThreadDelete(threadId)}
          onNew={() => void handleNewThread('private')}
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

          <QuickCoachPrompts
            onSelect={(text) => {
              setInput(text)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
          />

          <div className="shrink-0 px-3 pb-2">
            <div className="rounded-2xl border border-warm-200 bg-white p-2 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                {t('New thread visibility')}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {(['private', 'shared'] as const).map((visibility) => (
                  <button
                    key={visibility}
                    type="button"
                    onClick={() => setNextVisibility(visibility)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      nextVisibility === visibility
                        ? 'bg-coral-500 text-white'
                        : 'text-warm-600 hover:bg-warm-50'
                    }`}
                  >
                    {visibility === 'shared' ? t('Shared') : t('Private')}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-warm-400">
                {nextVisibility === 'shared'
                  ? t('Shared mode is explicit: both partners can access the thread. Do not include private import or coach details unless you want them shared.')
                  : t('Private mode is only for you. Partner-visible summaries require an explicit shared thread.')}
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-6 pt-4">
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
                  <p className="mt-4 text-sm font-medium text-warm-800">{t('Ask about tension, communication, goals, or what your recent patterns mean.')}</p>
                  <p className="mt-2 text-xs leading-5 text-warm-500">{t('The coach uses your relationship history, recent insights, and prior coaching threads to answer directly.')}</p>
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

          <div className="shrink-0 border-t border-warm-200/80 bg-white/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-sm">
            <div className="flex items-end gap-1.5 rounded-2xl border border-warm-200/60 bg-white px-3 py-1.5 shadow-sm transition-colors focus-within:border-coral-300 focus-within:ring-1 focus-within:ring-coral-300/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('Ask your coach...')}
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
                  aria-label={t('Stop coach response')}
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
                  aria-label={t('Send coach message')}
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
