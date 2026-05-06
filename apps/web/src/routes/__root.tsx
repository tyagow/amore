import { HeadContent, Scripts, createRootRoute, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import appCss from '~/styles.css?url'
import { GlobalLanguageToggle, I18nProvider } from '~/lib/i18n'

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Something went wrong — Amore Couples</title>
        <link rel="stylesheet" href={appCss} />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
        <I18nProvider>
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-warm-600 mb-6">
                {error instanceof Error ? error.message : 'An unexpected error occurred.'}
              </p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
          <GlobalLanguageToggle />
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Amore Couples' },
      { name: 'theme-color', content: '#C96B4F' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png', sizes: '180x180' },
      { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  errorComponent: RootErrorComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // SW registration failed -- non-critical
      })
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
        <I18nProvider>
          {children}
          <GlobalLanguageToggle />
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  )
}
