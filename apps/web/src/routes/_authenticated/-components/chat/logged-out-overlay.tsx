import { Link } from '@tanstack/react-router'

export function LoggedOutOverlay() {
  return (
    <div className="absolute inset-0 z-20 bg-warm-50/90 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-warm-900 mb-2">
          WhatsApp Disconnected
        </h2>
        <p className="text-sm text-warm-500 mb-6">
          Your WhatsApp session has ended. Reconnect to continue chatting.
        </p>
        <Link
          to="/whatsapp"
          className="inline-block px-6 py-2.5 bg-warm-900 text-white rounded-xl font-medium hover:bg-warm-800 transition-colors text-sm"
        >
          Reconnect
        </Link>
      </div>
    </div>
  )
}
