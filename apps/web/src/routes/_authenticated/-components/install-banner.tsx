import { useInstallPrompt } from '~/hooks/use-install-prompt'

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss, dismissed } = useInstallPrompt()

  if (!canInstall || dismissed) return null

  return (
    <div className="card flex items-center gap-4 p-4 animate-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900">Install Amore</p>
        <p className="text-xs text-warm-500">Add to your home screen for the best experience</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={dismiss} className="px-3 py-1.5 text-xs font-medium text-warm-500 hover:text-warm-700 transition-colors">Later</button>
        <button onClick={() => promptInstall()} className="px-4 py-1.5 text-xs font-medium bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors">Install</button>
      </div>
    </div>
  )
}
