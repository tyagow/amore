import { useState, useEffect } from 'react'

export function useStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const isIosStandalone = 'standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true

    setIsStandalone(mediaQuery.matches || isIosStandalone)

    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches || isIosStandalone)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isStandalone
}
