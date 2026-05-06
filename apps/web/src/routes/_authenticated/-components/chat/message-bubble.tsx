import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '~/types/chat'
import { MediaLightbox } from './media-lightbox'
import {
  formatAudioTime,
  getAudioMediaUrl,
  isPlayableAudioMessage,
} from './audio-message'

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

function VoiceMessagePlayer({
  message,
  isFromMe,
}: {
  message: ChatMessage
  isFromMe: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioUrl = getAudioMediaUrl(message)
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const markPaused = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('pause', markPaused)
    audio.addEventListener('ended', markPaused)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('pause', markPaused)
      audio.removeEventListener('ended', markPaused)
    }
  }, [audioUrl])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 py-1">
        {getMediaConfig('audio').icon}
        <span className="text-xs font-medium text-warm-500">Audio unavailable</span>
      </div>
    )
  }

  return (
    <div className="min-w-[230px] max-w-[320px] py-1">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlayback}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isFromMe
              ? 'bg-coral-500 text-white hover:bg-coral-600'
              : 'bg-warm-900 text-white hover:bg-warm-800'
          }`}
          title={isPlaying ? 'Pause voice message' : 'Play voice message'}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isPlaying ? (
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3.5A1.5 1.5 0 0 0 3.5 5v6A1.5 1.5 0 0 0 5 12.5 1.5 1.5 0 0 0 6.5 11V5A1.5 1.5 0 0 0 5 3.5Zm6 0A1.5 1.5 0 0 0 9.5 5v6a1.5 1.5 0 0 0 3 0V5A1.5 1.5 0 0 0 11 3.5Z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 translate-x-px" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.5 3.7v8.6c0 .7.76 1.13 1.36.76l6.64-4.3a.9.9 0 0 0 0-1.52L5.86 2.94A.9.9 0 0 0 4.5 3.7Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex h-7 items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, index) => {
              const height = 7 + ((index * 11) % 18)
              const played = index / 24 <= progress
              return (
                <span
                  // Static decorative waveform; index is stable for this fixed-length shape.
                  key={index}
                  className={`w-0.5 rounded-full ${
                    played
                      ? isFromMe
                        ? 'bg-coral-500'
                        : 'bg-warm-700'
                      : 'bg-warm-300'
                  }`}
                  style={{ height }}
                />
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-warm-500">
            <span>Voice message</span>
            <span>{formatAudioTime(duration || currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [showLightbox, setShowLightbox] = useState(false)

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
    const hasPlayableAudio = isPlayableAudioMessage(message)
    const hasFullMedia = message.waMessageId && (message.mediaType === 'image' || message.mediaType === 'video' || message.mediaType === 'sticker')

    return (
      <>
        <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
            isFromMe
              ? 'bg-coral-50 text-warm-900 rounded-br-md'
              : 'bg-warm-100 text-warm-900 rounded-bl-md'
          }`}>
            {hasPlayableAudio ? (
              <VoiceMessagePlayer message={message} isFromMe={isFromMe} />
            ) : message.thumbnail ? (
              <img
                src={`data:image/jpeg;base64,${message.thumbnail}`}
                className={`rounded-lg max-w-full ${hasFullMedia ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                alt=""
                onClick={hasFullMedia ? () => setShowLightbox(true) : undefined}
              />
            ) : hasFullMedia ? (
              <div
                className="flex items-center gap-2 py-1 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setShowLightbox(true)}
              >
                {mediaConfig.icon}
                <span className="text-xs font-medium text-warm-500">{mediaConfig.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1">
                {mediaConfig.icon}
                <span className="text-xs font-medium text-warm-500">{mediaConfig.label}</span>
              </div>
            )}
            {message.text && (
              <p className="whitespace-pre-wrap break-words mt-1">{message.text}</p>
            )}
            <span className="text-[10px] text-warm-400 mt-1 block text-right">{time}</span>
          </div>
        </div>
        {showLightbox && hasFullMedia && (
          <MediaLightbox
            waMessageId={message.waMessageId!}
            mediaType={message.mediaType!}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </>
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
