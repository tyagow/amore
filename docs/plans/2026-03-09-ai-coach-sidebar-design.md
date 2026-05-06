# AI Relationship Coach — Sidebar Design

## Overview

A global conversational AI coach that lives in a slide-out sidebar panel, accessible from every authenticated page. The coach provides direct, opinionated relationship advice using the couple's actual data — health scores, sentiment trends, communication patterns, goals, love languages, and WhatsApp messages.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement | Global sidebar (all pages) | Always accessible, page-context-aware |
| Memory | Full conversation threads | Therapist-like memory, revisit past sessions |
| Context | Auto-inject relevant data | No friction, coach just "knows" what's relevant |
| Proactivity | Nudges on significant events | Score drops, conflict alerts, goal deadlines |
| Personality | Opinionated & direct | Clear advice, not Socratic deflection |

## Architecture

### 1. UI Layer — Global Sidebar Panel

**Desktop**: 350px slide-out panel on the right. Page content shrinks when open. Toggle via brain icon in left nav sidebar.

**Mobile**: Floating action button (bottom-right) opens a full-screen bottom sheet with the coach chat.

Key elements:
- Chat interface with streaming responses (SSE)
- Thread switcher (past conversations with titles/dates)
- Nudge badge (red dot on nav icon for unread proactive nudges)
- Page-aware greeting based on current route
- Context indicator chip showing what data the coach is referencing

### 2. Conversation Engine

Server function flow:
1. Receive user message
2. Classify intent → pick relevant context to fetch
3. Assemble system prompt (persona + relationship snapshot + relevant context + coach memory)
4. Send full thread history + new message to Claude
5. Stream response via SSE
6. After response: extract session notes (takeaways, commitments, themes) → save to coach_memory

### 3. Memory & Context Layer

#### New DB Tables

**`coach_threads`**
- id (uuid, PK)
- coupleId (FK → couples)
- title (varchar) — auto-generated from first message
- createdAt, updatedAt (timestamp)

**`coach_messages`**
- id (uuid, PK)
- threadId (FK → coach_threads)
- role (varchar: 'user' | 'assistant')
- content (text)
- contextSnapshot (jsonb) — what data was injected for this message
- createdAt (timestamp)

**`coach_memory`**
- id (uuid, PK)
- coupleId (FK → couples)
- category (varchar: 'takeaway' | 'commitment' | 'theme' | 'preference')
- content (text)
- sourceThreadId (FK → coach_threads, nullable)
- createdAt (timestamp)

**`coach_nudges`**
- id (uuid, PK)
- coupleId (FK → couples)
- trigger (varchar: 'score_drop' | 'conflict_alert' | 'goal_deadline' | 'milestone')
- message (text)
- dismissed (boolean, default false)
- createdAt (timestamp)

### 4. Context Auto-Injection

Intent classification (fast, ~100 tokens) determines what to fetch:

| Intent | Data Fetched |
|--------|-------------|
| communication | Message patterns, initiation balance, response times |
| conflict | Recent low-sentiment messages, conflict alerts, score history |
| goals | Active goals, progress, suggestions |
| emotions | Sentiment trends, mood states, love languages |
| partner | Recent messages, partner profile, shared interests |
| general | Health score, summary, recent insights (lightweight) |

### 5. Coach Personality

System prompt principles:
- **Opinionated and direct** — gives concrete recommendations, states observations clearly
- Uses actual couple data — never guesses or fabricates
- References specific patterns ("Your initiation ratio is 70/30 — that needs to change")
- Remembers past coaching conversations ("Last time you committed to X — how's that going?")
- Only asks questions when genuinely needing more info
- Suggests concrete, actionable steps
- Knows both partners' love languages, communication styles, interests
- Never takes sides — frames as "the relationship"
- Page-aware greetings (dashboard: "Looking at your dashboard — anything to dig into?")

### 6. Proactive Nudge System

Triggers (checked after each analysis run):
- Health score drops >10 points
- New conflict alert generated
- Goal deadline within 3 days
- Positive milestone (score hits new high, streak achieved)

Nudge appears as:
- Red badge dot on coach nav icon
- Opening sidebar shows nudge as coach's first message in a new thread
- User can dismiss or engage

## Thread Management

- New thread auto-created when sidebar opens with no active thread
- Thread title auto-generated from first user message
- Thread list in sidebar header (dropdown/drawer)
- Threads older than 90 days: archived (queryable but not default-loaded)

## Mobile UX

- FAB button (bottom-right, above bottom nav)
- Taps opens full-screen sheet sliding up
- Back button returns to previous page
- Same chat interface as desktop
- Nudge badge shown on FAB

## Technical Notes

- Streaming via SSE (same pattern as existing wa-bridge communication)
- Claude model: use FAST_MODEL for intent classification, main model for coaching responses
- Thread history sent as conversation turns (last N messages, with summarization for long threads)
- Coach memory extracted asynchronously after response completes
- Context snapshot stored per-message for debugging/audit
