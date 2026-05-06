import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getAuthSession } from '~/server/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (session) {
      throw redirect({ to: '/dashboard', search: { upgraded: false } })
    }
  },
  component: Home,
})

function Home() {
  return (
    <div className="bg-warm-50 text-warm-800">
      {/* Hero */}
      <section
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--color-coral-50) 0%, transparent 70%)',
        }}
      >
        <h1 className="animate-in font-display text-6xl md:text-7xl tracking-[0.15em] text-warm-900">
          A m o r e
        </h1>

        <p
          className="animate-in mt-6 font-display italic text-xl text-warm-400"
          style={{ animationDelay: '200ms' }}
        >
          The space between you, understood.
        </p>

        <Link
          to="/signup"
          className="animate-in mt-10 bg-coral-500 hover:bg-coral-600 text-white px-8 py-3.5 rounded-xl shadow-lg font-medium transition-colors"
          style={{ animationDelay: '400ms' }}
        >
          Get Started
        </Link>

        <p
          className="animate-in mt-6 text-sm text-warm-400"
          style={{ animationDelay: '500ms' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-coral-500 font-medium hover:text-coral-600 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px flex-1 bg-warm-200" />
            <h2 className="font-display text-xl text-warm-400">
              How it works
            </h2>
            <div className="h-px flex-1 bg-warm-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-warm-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-coral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg text-warm-900 mb-2">
                Connect
              </h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                Link your WhatsApp conversations securely. Setup takes less than
                a minute.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-warm-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-coral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg text-warm-900 mb-2">
                Understand
              </h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                AI surfaces patterns in how you communicate — tone, topics, and
                timing.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-warm-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-coral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg text-warm-900 mb-2">Grow</h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                Get personalized coaching to strengthen your connection, day by
                day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <section className="pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-warm-400">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <span>
            Your conversations stay private. Only insights are stored.
          </span>
        </div>
      </section>
    </div>
  )
}
