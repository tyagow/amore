import type { ReactNode } from 'react'

export function MobileSidebarSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`fixed inset-0 z-30 lg:hidden ${open ? '' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[70vh] bg-warm-100 rounded-t-2xl shadow-xl overflow-y-auto transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warm-300" />
        </div>

        <div className="sticky top-0 bg-warm-100 px-4 py-3 border-b border-warm-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-warm-700">
            AI Assistant
          </h3>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-600 p-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
