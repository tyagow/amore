import type { ChatMessage } from '~/types/chat'

export function isPlayableAudioMessage(message: ChatMessage) {
  return Boolean(
    message.isMedia &&
      message.mediaType === 'audio' &&
      message.waMessageId,
  )
}

export function getAudioMediaUrl(message: ChatMessage) {
  if (!isPlayableAudioMessage(message)) return null
  return `/api/media/${message.waMessageId}`
}

export function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}
