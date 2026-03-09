# Frontend UX/UI Redesign Design

Date: 2026-03-07
Status: Approved (brainstorming complete)

## Goal

Transform Amore Couples from an MVP-tier stone/neutral dashboard into a warm, intimate, premium couples wellness app. Real UX changes, not just cosmetic — surface unused data, fix broken flows, add emotional resonance.

## Design Principles

1. **Warm & intimate** — rose/coral primary palette, serif display headings, soft gradients
2. **Data-forward** — surface the rich data already in the DB (sentiment, timestamps, severity, avatars)
3. **Alive, not static** — micro-animations, timestamps, partner presence, celebration moments
4. **Solo-friendly** — remove hard partner gate, allow exploration before connecting

## Constraints

- No new component library (keep hand-rolled Tailwind, add shadcn/ui only if needed later)
- Tailwind v4 with `@theme` in styles.css (not tailwind.config)
- No new backend dependencies for Phase 1 (use existing data)
- Must not break existing Railway deployment
- Mobile-first, responsive

---

## 1. Color System

Replace stone palette with warm rose/coral + warm neutrals.

### Custom Properties (styles.css @theme)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | rose-500 `#f43f5e` | Buttons, active nav, CTAs, brand |
| Primary hover | rose-600 `#e11d48` | Button hover states |
| Secondary | amber-500 `#f59e0b` | AI features, coaching, suggestions |
| Background | warm-50 `#fafaf9` | Page background |
| Card border | warm-200 `#e7e5e4` | Default card borders |
| Text primary | warm-900 `#1c1917` | Headings |
| Text secondary | warm-600 `#57534e` | Body text |
| Text muted | warm-400 `#a8a29e` | Captions, labels |

### Card Tinting

| Card | Background |
|------|-----------|
| Mood Card | `from-rose-50/40 to-white` |
| Goals Card | `from-emerald-50/40 to-white` |
| Insights Card | `from-violet-50/40 to-white` |
| Coaching Card | Keep `bg-amber-50` |
| Health Ring | `bg-white shadow-md` (elevated hero) |

### Gradient

Primary gradient: `linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)` — for brand moments.

---

## 2. Typography

- **Display font**: DM Serif Display (Google Fonts) — headings, health score, page titles
- **Body font**: DM Sans (Google Fonts) — body text, labels, buttons
- Page titles: `font-display text-3xl`
- Card section headers: `text-xs font-semibold uppercase tracking-wider text-warm-500`
- Health score number: `font-display text-5xl`
- Body: `text-sm leading-relaxed`

---

## 3. Component Redesigns

### Buttons
- Primary: `bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200`
- Secondary: `border border-rose-200 text-rose-700 hover:bg-rose-50`
- Ghost: `text-warm-500 hover:text-warm-700 hover:bg-warm-100`
- AI/Special: `bg-gradient-to-r from-amber-400 to-amber-500 text-white`

### Health Ring
- SVG gradient stroke (emerald gradient >70, amber gradient 40-70, red gradient <40)
- Glow filter behind ring
- Size increase to 200px
- Animated entrance (strokeDashoffset animation)
- Data freshness text below: "Based on X messages, analyzed Y ago"

### Mood Card
- Partner avatar rendered (use `users.image`, initials fallback)
- Timestamp: "2h ago" from `moodStates.createdAt`
- Source badge: brain icon for AI-detected, hand icon for manual
- Rose-tinted card background

### Mood Selector
- Larger emoji targets (`text-3xl`)
- Selected state: `bg-rose-50 ring-2 ring-rose-400 scale-110 shadow-md`
- Hover: `hover:scale-105 transition-all duration-150`

### Goals Card
- Show `dueDate` with color coding (amber approaching, red overdue)
- Show `suggestedBy` attribution
- Green-tinted card background

### Insights Card
- Severity color coding (red dot high, amber dot medium)
- Expandable text (remove line-clamp, add "show more")
- Violet-tinted card background
- Sort high-severity first

### Navigation
- Mobile: `text-rose-500` active, frosted glass bg (`bg-white/80 backdrop-blur-lg`), active dot indicator
- Desktop: `bg-rose-50 text-rose-600` active, rose left-bar indicator, brand in `font-display text-2xl text-rose-500`

---

## 4. UX Flow Changes

### Remove Partner Gate
- `_authenticated.tsx`: Allow solo access to dashboard, profile, goals
- Show contextual empty states instead of hard redirect to /connect
- Gentle prompts to invite partner, don't block

### Remove Dead Google OAuth
- Delete Google OAuth buttons from login.tsx and signup.tsx

### Merge Setup into Signup
- Remove `/setup` route (name already collected in signup)
- After signup, go directly to /connect (or onboarding)

### Landing Page Redesign
- Hero with emotional headline, value proposition
- Feature highlights (mood sharing, health score, AI coaching)
- Warm visual design with DM Serif Display headings

---

## 5. Data Surfacing (Zero Backend Changes)

These use data already fetched but not displayed:

| Data | Source | Display |
|------|--------|---------|
| Mood timestamp | `moodStates.createdAt` | "2h ago" in MoodCard |
| Mood source | `moodStates.source` | AI/manual badge in MoodCard |
| Data freshness | `couples.lastAnalyzed` + `messagesSinceAnalysis` | Text below health ring |
| Partner avatar | `users.image` | Header, MoodCard, sidebar |
| Insight severity | `insights.severity` | Color-coded dot/border |
| Goal due date | `coupleGoals.dueDate` | Color-coded in GoalsCard |
| Goal suggestor | `coupleGoals.suggestedBy` | Attribution text |

---

## 6. Loading & Empty States

### Loading
- Skeleton screens for dashboard cards during route transitions
- `pendingComponent` on authenticated routes

### Empty States
- Warm illustrations (simple SVG hearts/icons)
- Encouraging copy with clear CTA buttons
- Rose-tinted background: `bg-rose-50/30 rounded-2xl py-12`

---

## 7. Future Phases (Not in this implementation)

- Mood history page (server function exists, needs UI)
- Sentiment trend visualization (needs new server function)
- Health score history (needs schema change)
- Celebration moments / confetti system
- Weekly relationship summary
- Guided onboarding flow
- Framer Motion animations
- Dark mode
