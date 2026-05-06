import type { TodayCoachBrief } from '@amore-couples/ai/today-coach'

export function TodayCoachCard({ brief }: { brief: TodayCoachBrief }) {
  const openCoach = () => {
    window.dispatchEvent(
      new CustomEvent('amore:open-coach', {
        detail: { prompt: brief.coachPrompt },
      }),
    )
  }

  const confidenceLabel = {
    high: 'Strong signal',
    medium: 'Directional signal',
    low: 'Needs more data',
  }[brief.confidence]

  return (
    <section className="overflow-hidden rounded-3xl border border-coral-200 bg-white shadow-[0_12px_36px_rgba(42,33,24,0.08)]">
      <div className="border-b border-coral-100 bg-coral-50/70 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral-600">
              Today Coach
            </p>
            <h2 className="mt-1 font-display text-2xl text-warm-950">
              {brief.priority}
            </h2>
          </div>
          <span className="rounded-full border border-coral-200 bg-white px-3 py-1 text-xs font-medium text-coral-700">
            {confidenceLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-400">
              One action
            </p>
            <p className="mt-1 text-base leading-7 text-warm-900">
              {brief.action}
            </p>
          </div>

          <button
            type="button"
            onClick={openCoach}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-coral-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-600 md:w-auto"
          >
            Ask coach about this
          </button>
        </div>

        <div className="border-t border-warm-100 bg-warm-50/70 px-5 py-5 md:border-l md:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-400">
            Pattern
          </p>
          <p className="mt-2 text-sm leading-6 text-warm-700">
            {brief.pattern}
          </p>
          <p className="mt-4 text-xs text-warm-400">
            Source: {brief.source}
          </p>
        </div>
      </div>
    </section>
  )
}
