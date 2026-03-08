import { HeadContent, Scripts, createRootRoute, type ErrorComponentProps } from '@tanstack/react-router'
import appCss from '~/styles.css?url'

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — Amore Couples</title>
        <link rel="stylesheet" href={appCss} />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
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
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Amore Couples' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  errorComponent: RootErrorComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-warm-50 text-warm-800 font-sans">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
