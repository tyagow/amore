import { useRef, useEffect, type KeyboardEvent } from 'react'

export function ChatInput({
  onSend,
  onReview,
  disabled,
  reviewLoading,
  inputText,
  setInputText,
}: {
  onSend: (text: string) => void
  onReview: (text: string) => void
  disabled: boolean
  reviewLoading: boolean
  inputText: string
  setInputText: (text: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInputText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleReview = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    onReview(trimmed)
  }

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [inputText])

  return (
    <div className="border-t border-warm-200 bg-warm-100 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-warm-300 px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-coral-400 focus:ring-1 focus:ring-coral-400/20 transition-colors"
          style={{ maxHeight: '96px' }}
        />
        <button
          onClick={handleReview}
          disabled={!inputText.trim() || reviewLoading}
          className="px-2.5 py-2 text-xs font-medium text-warm-500 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          title="Review tone with AI"
        >
          {reviewLoading ? (
            <svg
              className="w-4 h-4 animate-spin"
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
          ) : (
            '\u2728 Review'
          )}
        </button>
        <button
          onClick={handleSend}
          disabled={disabled || !inputText.trim()}
          className="px-4 py-2 text-sm font-medium bg-warm-900 text-white rounded-lg hover:bg-warm-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}
