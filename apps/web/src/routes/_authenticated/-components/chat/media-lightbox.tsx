import { useEffect, useCallback } from 'react'

interface MediaLightboxProps {
  waMessageId: string
  mediaType: string
  onClose: () => void
}

export function MediaLightbox({ waMessageId, mediaType, onClose }: MediaLightboxProps) {
  const mediaUrl = `/api/media/${waMessageId}`

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
        onClick={onClose}
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        ) : (
          <img
            src={mediaUrl}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            alt=""
          />
        )}
      </div>
    </div>
  )
}
