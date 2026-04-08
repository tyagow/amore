import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
} from '~/server/billing'

const FEATURE_ROWS = [
  ['AI coach messages', '3 per day', 'Unlimited'],
  ['Tone reviews', '1 per day', 'Unlimited'],
  ['Insights', 'Basic overview only', 'Advanced tabs and deeper analysis'],
  ['Reply suggestions', 'Locked', 'Included'],
  ['Profile editing', 'Locked', 'Included'],
] as const

export const Route = createFileRoute('/_authenticated/pricing')({
  loader: async () => getBillingStatus(),
  component: PricingPage,
})

function PricingPage() {
  const billing = Route.useLoaderData()
  const [pendingAction, setPendingAction] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setPendingAction('checkout')
    setError(null)

    try {
      const { url } = await createCheckoutSession()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.')
      setPendingAction(null)
    }
  }

  const handlePortal = async () => {
    setPendingAction('portal')
    setError(null)

    try {
      const { url } = await createPortalSession()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open billing portal.')
      setPendingAction(null)
    }
  }

  const periodEnd = billing.subscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(billing.subscription.currentPeriodEnd))
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-warm-200 bg-[linear-gradient(135deg,_rgba(255,248,243,1)_0%,_rgba(255,238,226,1)_100%)] shadow-[0_20px_60px_rgba(42,33,24,0.08)]">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-coral-500">
              Pricing
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-warm-950 sm:text-5xl">
              Relationship support that grows with the conversation
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-warm-600">
              Start free for daily guidance. Upgrade when you want unlimited coaching,
              richer insights, and the tools that help hard moments land better.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <PlanCard
                tone="free"
                title="Free"
                price="$0"
                subtitle="For trying Amore on your own rhythm"
                bullets={[
                  '3 coach messages per day',
                  '1 tone review per day',
                  'Basic insights overview',
                ]}
              />
              <PlanCard
                tone="premium"
                title="Premium"
                price="$9.99"
                subtitle="Per month, billed by Stripe"
                bullets={[
                  'Unlimited coach, tone review, and analysis',
                  'Advanced insights and reply suggestions',
                  'Profile editing and live mood support',
                ]}
                badge={billing.plan === 'premium' ? 'Active' : 'Best value'}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-coral-100 bg-white/85 p-6 shadow-[0_18px_40px_rgba(201,107,79,0.10)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral-500">
                  Your access
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-warm-950">
                  {billing.plan === 'premium' ? 'Premium is active' : 'You are on Free'}
                </h2>
              </div>
              <span className="rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-coral-700">
                {billing.plan}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-warm-600">
              {billing.plan === 'premium' && billing.premiumSource === 'self' && (
                <p>
                  Your Stripe subscription is {billing.subscription?.status ?? 'active'}.
                  {periodEnd ? ` Current period ends on ${periodEnd}.` : ''}
                </p>
              )}
              {billing.plan === 'premium' && billing.premiumSource === 'partner' && (
                <p>
                  Your couple already has premium access through your partner&apos;s subscription.
                </p>
              )}
              {billing.plan === 'free' && (
                <p>
                  Upgrade to remove daily and weekly limits as your relationship support needs grow.
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              {billing.plan === 'premium' && billing.canManageSubscription ? (
                <button
                  onClick={handlePortal}
                  disabled={pendingAction !== null}
                  className="rounded-full bg-coral-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingAction === 'portal' ? 'Opening portal...' : 'Manage subscription'}
                </button>
              ) : billing.plan === 'premium' ? (
                <div className="rounded-2xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-600">
                  Premium is already unlocked for your couple. Billing is managed from the subscriber&apos;s account.
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={pendingAction !== null}
                  className="rounded-full bg-coral-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingAction === 'checkout' ? 'Opening checkout...' : 'Upgrade to premium'}
                </button>
              )}

              <Link
                to="/dashboard"
                className="text-center text-sm font-medium text-warm-500 transition-colors hover:text-warm-700"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-warm-200 bg-white shadow-[0_12px_32px_rgba(42,33,24,0.06)]">
        <div className="border-b border-warm-200 px-6 py-5">
          <h2 className="text-2xl font-semibold text-warm-950">Compare plans</h2>
          <p className="mt-1 text-sm text-warm-500">
            Premium removes the friction once Amore becomes part of your day-to-day rhythm.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-warm-50">
              <tr className="text-left text-sm text-warm-500">
                <th className="px-6 py-4 font-medium">Feature</th>
                <th className="px-6 py-4 font-medium">Free</th>
                <th className="px-6 py-4 font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(([label, free, premium]) => (
                <tr key={label} className="border-t border-warm-100 text-sm text-warm-800">
                  <td className="px-6 py-4 font-medium text-warm-900">{label}</td>
                  <td className="px-6 py-4">{free}</td>
                  <td className="px-6 py-4 text-coral-700">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  tone,
  title,
  price,
  subtitle,
  bullets,
  badge,
}: {
  tone: 'free' | 'premium'
  title: string
  price: string
  subtitle: string
  bullets: string[]
  badge?: string
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        tone === 'premium'
          ? 'border-coral-200 bg-coral-50/70'
          : 'border-warm-200 bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-warm-500">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-warm-950">{price}</span>
            {tone === 'premium' && <span className="text-sm text-warm-500">/ month</span>}
          </div>
          <p className="mt-2 text-sm text-warm-600">{subtitle}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-600">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-2 text-sm text-warm-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-coral-400" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
