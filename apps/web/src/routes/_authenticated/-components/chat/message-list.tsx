import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ChatMessage } from '~/types/chat'
import { DateDivider } from './date-divider'
import { MessageBubble } from './message-bubble'

export function MessageList({
  messages,
  hasMore,
  isLoading,
  onLoadMore,
}: {
  messages: ChatMessage[]
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const isAtBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const threshold = 100
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    isAtBottomRef.current = atBottom
    setShowScrollButton(!atBottom)
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; messages: ChatMessage[] }> = []
    let currentDate = ''

    for (const msg of messages) {
      const d =
        msg.timestamp instanceof Date
          ? msg.timestamp
          : new Date(msg.timestamp)
      const dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

      if (dateStr !== currentDate) {
        currentDate = dateStr
        groups.push({ date: dateStr, messages: [] })
      }
      groups[groups.length - 1].messages.push(msg)
    }

    return groups
  }, [messages])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3"
      onScroll={handleScroll}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <svg
            className="w-6 h-6 text-warm-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="56"
              strokeDashoffset="14"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Load earlier messages */}
      {!isLoading && hasMore && (
        <div className="flex justify-center mb-3">
          <button
            onClick={onLoadMore}
            className="text-xs text-coral-600 hover:text-coral-700 font-medium px-3 py-1.5 rounded-lg hover:bg-coral-50 transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 mb-4 rounded-full bg-coral-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-coral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-warm-400 leading-relaxed">
            No messages yet. Messages you send here will appear in your
            partner's WhatsApp.
          </p>
        </div>
      )}

      {/* Message groups */}
      {groupedMessages.map((group) => (
        <div key={group.date}>
          <DateDivider date={group.date} />
          {group.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      ))}

      <div ref={bottomRef} />

      {/* New messages floating button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-warm-900 text-white text-xs rounded-full shadow-lg hover:bg-warm-800 transition-colors z-10"
        >
          New messages
          <svg
            className="inline-block w-3 h-3 ml-1"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2v8M3 7l3 3 3-3" />
          </svg>
        </button>
      )}
    </div>
  )
}
