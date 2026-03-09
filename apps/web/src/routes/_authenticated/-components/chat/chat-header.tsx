import type { ConnectionStatus } from '~/types/chat'
import { StatusDot } from './status-dot'

export function ChatHeader({
  partnerName,
  connectionStatus,
  onResync,
  isResyncing,
}: {
  partnerName: string | null
  connectionStatus: ConnectionStatus
  onResync?: () => void
  isResyncing?: boolean
}) {
  const initial = partnerName ? partnerName.charAt(0).toUpperCase() : '?'

  return (
    <div>
      <div className="flex items-center justify-between border-b border-warm-200 bg-warm-50/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
          <h2 className="text-sm font-semibold text-warm-800">
            {partnerName ?? 'Chat'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onResync && (
            <button
              onClick={onResync}
              disabled={isResyncing}
              title="Resync messages"
              className="p-1.5 rounded-md text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${isResyncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          )}
          <StatusDot status={connectionStatus} />
        </div>
      </div>
      {isResyncing && (
        <div className="flex items-center gap-2 px-4 py-2 bg-coral-50 border-b border-coral-100 text-xs text-coral-700">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
          </svg>
          Syncing messages from WhatsApp...
        </div>
      )}
    </div>
  )
}
