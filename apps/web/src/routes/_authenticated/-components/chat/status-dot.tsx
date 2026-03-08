import type { ConnectionStatus } from '~/types/chat'

const config: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: 'bg-emerald-500', label: 'Connected' },
  connecting: {
    color: 'bg-amber-500 animate-pulse',
    label: 'Connecting...',
  },
  reconnecting: {
    color: 'bg-amber-500 animate-pulse',
    label: 'Reconnecting...',
  },
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
  'logged-out': { color: 'bg-red-500', label: 'Logged out' },
  'session-expired': { color: 'bg-red-500', label: 'Session expired' },
}

export function StatusDot({ status }: { status: ConnectionStatus }) {
  const { color, label } = config[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-warm-500">{label}</span>
    </div>
  )
}
