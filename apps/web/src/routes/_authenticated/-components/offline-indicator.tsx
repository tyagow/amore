import { useOnlineStatus } from '~/hooks/use-online-status'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-warm-800 text-white text-center py-2 text-sm font-medium shadow-lg pt-safe">
      <div className="flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        You're offline — some features may be unavailable
      </div>
    </div>
  )
}
