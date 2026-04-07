import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const DISMISS_KEY = 'amore-pwa-install-dismissed'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const installedHandler = () => setDeferredPrompt(null)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }, [])

  return { canInstall: deferredPrompt !== null, promptInstall, dismiss, dismissed }
}
