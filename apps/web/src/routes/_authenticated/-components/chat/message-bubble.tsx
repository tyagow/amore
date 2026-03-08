import { useMemo } from 'react'
import type { ChatMessage } from '~/types/chat'

function SpinnerIcon() {
  return (
    <svg
      className="w-3 h-3 text-warm-400 animate-spin"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28"
        strokeDashoffset="8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function getMediaConfig(mediaType?: string | null) {
  switch (mediaType) {
    case 'image':
      return {
        label: 'Photo',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        ),
      }
    case 'video':
      return {
        label: 'Video',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="15" height="16" rx="2" />
            <path d="M17 8l5-3v14l-5-3" />
          </svg>
        ),
      }
    case 'audio':
      return {
        label: 'Audio',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      }
    case 'document':
      return {
        label: 'Document',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      }
    case 'sticker':
      return {
        label: 'Sticker',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        ),
      }
    default:
      return {
        label: 'Media',
        icon: (
          <svg className="w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        ),
      }
  }
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const time = useMemo(() => {
    const d =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }, [message.timestamp])

  const isFromMe = message.fromMe

  if (message.isMedia) {
    const mediaConfig = getMediaConfig(message.mediaType)
    return (
      <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
          isFromMe
            ? 'bg-coral-50 text-warm-900 rounded-br-md'
            : 'bg-warm-100 text-warm-900 rounded-bl-md'
        }`}>
          <div className="flex items-center gap-2 py-1">
            {mediaConfig.icon}
            <span className="text-xs font-medium text-warm-500">{mediaConfig.label}</span>
          </div>
          {message.text && (
            <p className="whitespace-pre-wrap break-words mt-1">{message.text}</p>
          )}
          <span className="text-[10px] text-warm-400 mt-1 block text-right">{time}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isFromMe
            ? 'bg-coral-50 text-warm-900 rounded-br-md'
            : 'bg-warm-100 text-warm-900 rounded-bl-md'
        }`}
      >
        {!isFromMe && (
          <p className="text-xs font-medium text-warm-500 mb-0.5">
            {message.sender}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] text-warm-400">{time}</span>

          {isFromMe && message.status === 'sending' && <SpinnerIcon />}

          {isFromMe && message.status === 'queued' && (
            <svg
              className="w-3 h-3 text-warm-300"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 2" />
            </svg>
          )}

          {isFromMe && message.status === 'sent' && (
            <svg
              className="w-3 h-3 text-warm-400"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 8l4 4L14 4" />
            </svg>
          )}

          {isFromMe && message.status === 'delivered' && (
            <svg
              className="w-4 h-3 text-warm-400"
              viewBox="0 0 20 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 8l4 4L14 4" />
              <path d="M7 8l4 4L19 4" />
            </svg>
          )}

          {isFromMe && message.status === 'read' && (
            <svg
              className="w-4 h-3 text-coral-500"
              viewBox="0 0 20 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 8l4 4L14 4" />
              <path d="M7 8l4 4L19 4" />
            </svg>
          )}

          {isFromMe && message.status === 'error' && (
            <span className="text-red-500 text-[10px] font-medium">
              Failed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
