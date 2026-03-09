# Frontend UX/UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Amore Couples frontend from a cold stone/neutral MVP into a warm, intimate, data-rich couples wellness app.

**Architecture:** Surgical Tailwind class replacements across all routes and components. Add Google Fonts (DM Sans + DM Serif Display) via @theme. Surface already-fetched-but-hidden data (mood timestamps, partner avatar, insight severity, data freshness). Fix broken UX flows (partner gate, dead OAuth buttons).

**Tech Stack:** TanStack Start (React 19), Tailwind CSS v4 with @theme, no new dependencies.

**Design doc:** `docs/plans/2026-03-07-frontend-redesign-design.md`

---

## Task 1: Typography + Color Foundation

**Files:**
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/routes/__root.tsx`

**Step 1: Add Google Fonts and @theme to styles.css**

Replace the contents of `apps/web/src/styles.css` with:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');

@theme {
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-display: 'DM Serif Display', Georgia, serif;
}
```

**Step 2: Update __root.tsx body classes**

In `apps/web/src/routes/__root.tsx`, change both `<body>` tags:
- Line 13: `bg-stone-50 text-stone-900` -> `bg-stone-50 text-stone-900 font-sans`
- Line 55: `bg-stone-50 text-stone-900` -> `bg-stone-50 text-stone-900 font-sans`

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`
Expected: Build passes, no errors.

**Step 4: Commit**

```
feat: add DM Sans/Serif Display fonts and @theme config
```

---

## Task 2: Navigation Redesign

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/nav.tsx`

**Step 1: Update mobile bottom nav**

In `nav.tsx` line 20, change mobile nav container:
```
FROM: className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 md:hidden"
TO:   className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-stone-100 md:hidden"
```

**Step 2: Update mobile NavItem active state**

In `NavItem` component (line 134-135), change:
```
FROM: className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-stone-400 transition-colors"
      activeProps={{ className: 'text-stone-900' }}
TO:   className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-stone-400 transition-colors"
      activeProps={{ className: 'text-rose-500' }}
```

**Step 3: Update desktop sidebar brand**

In `nav.tsx` line 61, change the Amore brand link:
```
FROM: className="text-xl font-bold text-stone-900 tracking-tight"
TO:   className="text-2xl font-display text-rose-500 tracking-tight"
```

**Step 4: Update desktop SidebarItem active state**

In `SidebarItem` component (line 167-168), change:
```
FROM: className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
      activeProps={{ className: 'bg-stone-100 text-stone-900' }}
TO:   className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
      activeProps={{ className: 'bg-rose-50 text-rose-600' }}
```

**Step 5: Update sign-out button hover**

In `nav.tsx` line 105, change:
```
FROM: className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
TO:   className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
```

**Step 6: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 7: Commit**

```
feat: redesign nav with rose active states and frosted glass mobile bar
```

---

## Task 3: Landing Page Redesign

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Rewrite the landing page**

Replace the `Home` component in `index.tsx` (lines 14-41) with:

```tsx
function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-6">
      <div className="text-center max-w-lg">
        {/* Brand */}
        <h1 className="font-display text-5xl text-stone-900 tracking-tight">
          Amore
        </h1>
        <p className="mt-4 text-lg text-stone-500 leading-relaxed">
          Understand each other better. AI-powered relationship insights from your real conversations.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/signup"
            className="px-6 py-2.5 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 shadow-sm shadow-rose-200 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-2.5 border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-2xl p-5 border border-stone-100">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-3">
              <span className="text-xl">{'\u2764\uFE0F'}</span>
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Mood Sharing</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Share how you feel daily and see your partner's mood in real time.</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <span className="text-xl">{'\u{1F4CA}'}</span>
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Health Score</h3>
            <p className="text-xs text-stone-500 leading-relaxed">AI analyzes your conversations to measure relationship health over time.</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <span className="text-xl">{'\u{1F4A1}'}</span>
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Smart Coaching</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Personalized tips based on your love languages and communication patterns.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 3: Commit**

```
feat: redesign landing page with value proposition and feature highlights
```

---

## Task 4: Auth Pages — Remove Google OAuth + Apply Rose Theme

**Files:**
- Modify: `apps/web/src/routes/login.tsx`
- Modify: `apps/web/src/routes/signup.tsx`

**Step 1: Clean up login.tsx**

In `login.tsx`:
1. Delete lines 85-100 (the "or" divider and Google OAuth button)
2. Line 39: Change `text-3xl font-bold text-stone-900` to `font-display text-3xl text-stone-900`
3. Line 54: Change `focus:ring-stone-500` to `focus:ring-rose-300`
4. Line 69: Change `focus:ring-stone-500` to `focus:ring-rose-300`
5. Line 79: Change `bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500` to `bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm shadow-rose-200`
6. Line 104: Change `text-stone-900 font-medium` to `text-rose-500 font-medium`

**Step 2: Clean up signup.tsx**

In `signup.tsx`:
1. Delete lines 101-117 (the "or" divider and Google OAuth button)
2. Line 33: Change `navigate({ to: '/setup' })` to `navigate({ to: '/connect' })`
3. Line 40: Change `text-3xl font-bold text-stone-900` to `font-display text-3xl text-stone-900`
4. Line 55, 70, 86: Change `focus:ring-stone-500` to `focus:ring-rose-300`
5. Line 96: Change `bg-stone-900` pattern to `bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm shadow-rose-200`
6. Line 121: Change `text-stone-900 font-medium` to `text-rose-500 font-medium`

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 4: Commit**

```
fix: remove dead Google OAuth buttons, apply rose theme to auth pages
```

---

## Task 5: Health Ring Redesign

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/health-ring.tsx`
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`

**Step 1: Rewrite health-ring.tsx**

Replace the entire `HealthRing` component with a gradient-stroke SVG ring, glow filter, larger size (200px), animated entrance, and font-display score. Also accept new props for data freshness (`lastAnalyzed`, `messagesSinceAnalysis`).

```tsx
interface HealthRingProps {
  score: number | null
  lastAnalyzed?: string | Date | null
  messagesSinceAnalysis?: number | null
}

export function HealthRing({ score, lastAnalyzed, messagesSinceAnalysis }: HealthRingProps) {
  const size = 200
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = score != null ? (score / 100) * circumference : 0
  const offset = circumference - progress

  const gradientId = score == null ? 'gray' : score > 70 ? 'green' : score > 40 ? 'amber' : 'red'

  const gradientColors: Record<string, [string, string]> = {
    gray: ['#d6d3d1', '#a8a29e'],
    green: ['#10b981', '#34d399'],
    amber: ['#f59e0b', '#fbbf24'],
    red: ['#ef4444', '#f87171'],
  }

  const [c1, c2] = gradientColors[gradientId]

  const freshnessText = lastAnalyzed
    ? `Analyzed ${formatTimeAgo(lastAnalyzed)}${messagesSinceAnalysis ? ` \u00B7 ${messagesSinceAnalysis} new messages` : ''}`
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <defs>
            <linearGradient id={`ring-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
            className="stroke-stone-100" />

          {/* Progress circle */}
          {score != null && (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
              strokeWidth={strokeWidth} strokeLinecap="round"
              stroke={`url(#ring-${gradientId})`}
              strokeDasharray={circumference} strokeDashoffset={offset}
              filter="url(#ring-glow)"
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score != null ? (
            <>
              <span className="font-display text-5xl" style={{ color: c1 }}>{score}</span>
              <span className="text-xs text-stone-400 uppercase tracking-wide">Health</span>
            </>
          ) : (
            <span className="text-sm text-stone-400 text-center px-4">No data yet</span>
          )}
        </div>
      </div>

      <p className="text-sm text-stone-500">
        {score == null
          ? 'Connect WhatsApp to get your score'
          : score > 70
            ? 'Your relationship is thriving'
            : score > 40
              ? 'Room for growth'
              : 'Needs attention'}
      </p>

      {freshnessText && (
        <p className="text-xs text-stone-400">{freshnessText}</p>
      )}
    </div>
  )
}

function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'yesterday'
  return `${diffD} days ago`
}
```

**Step 2: Pass new props from dashboard.tsx**

In `dashboard.tsx` line 49, change:
```tsx
FROM: <HealthRing score={data.couple.healthScore} />
TO:   <HealthRing
        score={data.couple.healthScore}
        lastAnalyzed={data.couple.lastAnalyzed}
      />
```

Also update the returned data from `getDashboardData` — in `apps/web/src/server/dashboard.ts` line 53-57, the `couple` object already includes `lastAnalyzed`. We need to also add `messagesSinceAnalysis`. Add it to the return:

```tsx
couple: {
  id: couple.id,
  healthScore: couple.healthScore,
  lastAnalyzed: couple.lastAnalyzed,
  messagesSinceAnalysis: couple.messagesSinceAnalysis,
},
```

Then pass in dashboard.tsx:
```tsx
<HealthRing
  score={data.couple.healthScore}
  lastAnalyzed={data.couple.lastAnalyzed}
  messagesSinceAnalysis={data.couple.messagesSinceAnalysis}
/>
```

**Step 3: Update dashboard health ring card**

In `dashboard.tsx` line 48, change:
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 mb-6 flex justify-center"
TO:   className="bg-white rounded-3xl shadow-md border border-stone-100 p-8 mb-6 flex justify-center"
```

**Step 4: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 5: Commit**

```
feat: redesign health ring with gradient stroke, glow, and data freshness
```

---

## Task 6: Dashboard Header + Card Tinting

**Files:**
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`

**Step 1: Update dashboard header typography**

In `dashboard.tsx`:
- Line 37: Change `text-2xl font-bold text-stone-900` to `font-display text-3xl text-stone-900`

**Step 2: Update layout background**

In `_authenticated.tsx` line 72:
```
FROM: className="min-h-screen bg-stone-50"
TO:   className="min-h-screen bg-stone-50"
```
(keep as-is — stone-50 is close enough to warm-50)

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 4: Commit**

```
feat: update dashboard header with display font
```

---

## Task 7: Mood Card — Timestamps, Source Badges, Tinting

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/mood-card.tsx`
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`

**Step 1: Update MoodData interface and MoodCard**

Add `source` field to `MoodData` interface and update the component to show timestamps and source badges. Update card to rose-tinted background:

```tsx
interface MoodData {
  mood: string
  note: string | null
  createdAt: string | Date
  source?: string | null
}
```

Update `MoodDisplay` to show relative time and source badge:

```tsx
function MoodDisplay({ label, mood }: { label: string; mood: MoodData }) {
  const emoji = MOOD_EMOJI[mood.mood] ?? '\u{1F610}'
  const moodLabel = MOOD_LABEL[mood.mood] ?? mood.mood

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-900">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-stone-500">{moodLabel}</p>
          <span className="text-xs text-stone-400">{'\u00B7'} {formatTimeAgo(mood.createdAt)}</span>
          {mood.source === 'ai_detected' && (
            <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">AI</span>
          )}
        </div>
        {mood.note && (
          <p className="text-xs text-stone-400 mt-0.5 italic">&ldquo;{mood.note}&rdquo;</p>
        )}
      </div>
    </div>
  )
}
```

Add `formatTimeAgo` helper (same as health-ring):

```tsx
function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'yesterday'
  return `${diffD}d ago`
}
```

Update the card container (line 51):
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
TO:   className="bg-gradient-to-br from-rose-50/40 to-white rounded-2xl shadow-sm border border-rose-100 p-6"
```

Update section header (line 52):
```
FROM: className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4"
TO:   className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4"
```

**Step 2: Pass source from dashboard data**

In `dashboard.tsx`, the `myMood` and `partnerMood` from the loader already include all fields from the DB query (`moodStates` table). The `source` field is already in the query results — it just needs to be typed. No server changes needed since `findMany` returns all columns by default.

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 4: Commit**

```
feat: add mood timestamps, AI source badges, and rose tinting to MoodCard
```

---

## Task 8: Mood Selector — Rose Theme + Larger Targets

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/mood-selector.tsx`

**Step 1: Update mood buttons**

In `mood-selector.tsx`:

Card container (line 63):
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
TO:   className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
```
(keep as-is — selector stays neutral/functional)

Section header (line 64):
```
FROM: className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4"
TO:   className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4"
```

Mood button classes (line 78-82):
```
FROM: selectedMood === m.value
        ? 'bg-stone-100 ring-2 ring-stone-400'
        : 'hover:bg-stone-50'
TO:   selectedMood === m.value
        ? 'bg-rose-50 ring-2 ring-rose-400 scale-110 shadow-md'
        : 'hover:bg-stone-50 hover:scale-105'
```

Emoji size (line 84):
```
FROM: className="text-2xl"
TO:   className="text-3xl"
```

**Step 2: Update visibility picker**

Visibility selected state (line 102-105):
```
FROM: visibility === v.value
        ? 'border-stone-400 bg-stone-50'
        : 'border-stone-200 hover:border-stone-300'
TO:   visibility === v.value
        ? 'border-rose-300 bg-rose-50/50'
        : 'border-stone-200 hover:border-stone-300'
```

**Step 3: Update textarea and submit button**

Textarea focus (line 128):
```
FROM: focus:ring-2 focus:ring-stone-300
TO:   focus:ring-2 focus:ring-rose-300
```

Submit button (line 134):
```
FROM: className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
TO:   className="w-full bg-rose-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-rose-600 shadow-sm shadow-rose-200 disabled:opacity-50 transition-colors"
```

**Step 4: Update confirmation state**

Confirmation card (line 53):
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 text-center"
TO:   className="bg-rose-50/50 rounded-2xl shadow-sm border border-rose-100 p-6 text-center"
```

**Step 5: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 6: Commit**

```
feat: redesign mood selector with rose theme, larger targets, scale animation
```

---

## Task 9: Goals Card — Tinting + Due Date Colors

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/goals-card.tsx`

**Step 1: Update card background and header**

Card container (line 19):
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
TO:   className="bg-gradient-to-br from-emerald-50/40 to-white rounded-2xl shadow-sm border border-emerald-100 p-6"
```

Section header (line 21):
```
FROM: className="text-sm font-semibold text-stone-900 uppercase tracking-wide"
TO:   className="text-xs font-semibold uppercase tracking-wider text-stone-400"
```

**Step 2: Add dueDate to interface and render**

Update the Goal interface:
```tsx
interface Goal {
  id: string
  title: string
  description: string | null
  status: string
  source: string
  dueDate?: string | Date | null
  suggestedBy?: string | null
}
```

After the description and AI badge block in each goal item (after line 54), add:

```tsx
{goal.dueDate && (
  <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
    new Date(goal.dueDate) < new Date() ? 'text-red-700 bg-red-50' :
    new Date(goal.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 ? 'text-amber-700 bg-amber-50' :
    'text-stone-500 bg-stone-50'
  }`}>
    Due {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
  </span>
)}
```

**Step 3: Update empty state**

Empty state CTA (line 65):
```
FROM: className="text-sm text-stone-600 font-medium hover:text-stone-900 transition-colors"
TO:   className="text-sm text-rose-500 font-medium hover:text-rose-600 transition-colors"
```

**Step 4: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 5: Commit**

```
feat: add green tinting, due date colors to GoalsCard
```

---

## Task 10: Insights Card — Severity Colors + Tinting

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/insights-card.tsx`

**Step 1: Update card background and header**

Card container (line 82):
```
FROM: className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
TO:   className="bg-gradient-to-br from-violet-50/40 to-white rounded-2xl shadow-sm border border-violet-100 p-6"
```

Section header (line 83):
```
FROM: className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4"
TO:   className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4"
```

**Step 2: Add severity indicator**

In each insight item (line 90), add a severity dot before the TypeBadge:

Replace the insight item `div` (lines 90-101) with:

```tsx
<div key={insight.id} className="space-y-1.5">
  <div className="flex items-center gap-2">
    {insight.severity === 'high' && (
      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
    )}
    {insight.severity === 'medium' && (
      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
    )}
    <TypeBadge type={insight.type} />
    <span className="text-[10px] text-stone-400">
      {formatDate(insight.generatedAt)}
    </span>
  </div>
  <p className="text-sm text-stone-700 leading-relaxed line-clamp-2">
    {getInsightText(insight.content)}
  </p>
</div>
```

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 4: Commit**

```
feat: add severity indicators and violet tinting to InsightsCard
```

---

## Task 11: Coaching Card + Mood Detection Modal — Rose Buttons

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/coaching-card.tsx`
- Modify: `apps/web/src/routes/_authenticated/-components/mood-detection-modal.tsx`

**Step 1: Update coaching card**

No major changes needed — amber theme is already warm. Just update the section header text styling.

In `coaching-card.tsx` line 52:
```
FROM: className="text-sm font-semibold text-stone-900"
TO:   className="text-sm font-semibold text-stone-800"
```

**Step 2: Update mood detection modal buttons**

In `mood-detection-modal.tsx`:

"Yes, that's right" button (line 140):
```
FROM: className="flex-1 bg-stone-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
TO:   className="flex-1 bg-rose-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
```

Confirm button (line 188):
```
FROM: className="flex-1 bg-stone-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
TO:   className="flex-1 bg-rose-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
```

Visibility selected state (line 166-169):
```
FROM: selectedVisibility === v.value
        ? 'border-stone-400 bg-stone-50'
        : 'border-stone-200 hover:border-stone-300'
TO:   selectedVisibility === v.value
        ? 'border-rose-300 bg-rose-50/50'
        : 'border-stone-200 hover:border-stone-300'
```

**Step 3: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 4: Commit**

```
feat: apply rose theme to mood detection modal and coaching card
```

---

## Task 12: Error Components + Authenticated Layout — Rose Buttons

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`
- Modify: `apps/web/src/routes/_authenticated.tsx`

**Step 1: Update root error component**

In `__root.tsx` line 22:
```
FROM: className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
TO:   className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
```

**Step 2: Update auth error component**

In `_authenticated.tsx` line 22:
```
FROM: className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
TO:   className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
```

**Step 3: Remove partner gate**

In `_authenticated.tsx` lines 49-53, change the redirect logic:

```tsx
// FROM:
const publicPaths = ['/connect', '/setup']
if (!hasCouple && !publicPaths.includes(location.pathname)) {
  throw redirect({ to: '/connect' })
}

// TO:
// Allow solo access — no hard redirect to /connect
// Components show contextual empty states when no couple exists
```

Simply delete lines 50-53 (the redirect block). Keep the `publicPaths` removal and the `hasCouple` in the return context so components can conditionally render.

**Step 4: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 5: Commit**

```
feat: remove partner gate, apply rose to error components
```

---

## Task 13: Profile, Goals, WhatsApp, Connect Pages — Rose Buttons

**Files:**
- Modify: `apps/web/src/routes/_authenticated/profile.tsx`
- Modify: `apps/web/src/routes/_authenticated/goals.tsx`
- Modify: `apps/web/src/routes/_authenticated/whatsapp.tsx`
- Modify: `apps/web/src/routes/_authenticated/connect.tsx`
- Modify: `apps/web/src/routes/_authenticated/setup.tsx`

**Step 1: Global find-and-replace across all 5 files**

Apply these replacements in every file:

| Find | Replace |
|------|---------|
| `bg-stone-900 text-white` (button context) | `bg-rose-500 text-white` |
| `hover:bg-stone-800` (button hover) | `hover:bg-rose-600` |
| `focus:ring-stone-500` | `focus:ring-rose-300` |
| `ring-stone-500` | `ring-rose-300` |
| `border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50` (secondary button) | `border-rose-200 text-rose-700 rounded-lg font-medium hover:bg-rose-50` |

Also update page titles in each file to use `font-display`:
- Any `text-2xl font-bold` heading -> `font-display text-3xl`

Update section headers:
- Any `text-sm font-semibold text-stone-900 uppercase tracking-wide` -> `text-xs font-semibold uppercase tracking-wider text-stone-400`

**Step 2: Build to verify**

Run: `cd apps/web && pnpm run build`

**Step 3: Commit**

```
feat: apply rose theme to profile, goals, whatsapp, connect, and setup pages
```

---

## Task 14: Final Build + Deploy Verification

**Step 1: Full build**

Run: `cd /Users/partiu/workspace/amore-couples && pnpm run build`

Expected: Build passes with zero errors.

**Step 2: Local dev check**

Run: `cd apps/web && pnpm run dev`

Open browser, check:
- [ ] Landing page shows value proposition and rose buttons
- [ ] Login/signup have no Google OAuth button
- [ ] Nav shows rose active state and frosted glass on mobile
- [ ] Brand says "Amore" in serif font, rose color
- [ ] Dashboard health ring has gradient stroke and glow
- [ ] Mood card shows rose tint
- [ ] Goals card shows green tint
- [ ] Insights card shows violet tint
- [ ] All primary buttons are rose, not stone

**Step 3: Commit everything**

```
chore: final build verification for frontend redesign
```

---

## Summary

| Task | What | Impact |
|------|------|--------|
| 1 | Fonts + @theme | Foundation |
| 2 | Nav redesign | Brand identity |
| 3 | Landing page | First impression |
| 4 | Auth cleanup | Trust (remove broken buttons) |
| 5 | Health ring | Hero element transformation |
| 6 | Dashboard header | Typography warmth |
| 7 | Mood card | Data surfacing (timestamps, AI badge) |
| 8 | Mood selector | Daily ritual delight |
| 9 | Goals card | Visual hierarchy + due dates |
| 10 | Insights card | Severity indicators |
| 11 | Modal + coaching | Consistency |
| 12 | Error + partner gate | UX flow fix |
| 13 | All other pages | Complete coverage |
| 14 | Build verify | Ship it |
