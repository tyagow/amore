# Amore Couples — System Capabilities Document

> Generated: 2026-04-07 | Full codebase analysis

## 1. User-Facing Features

### Pages and Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | Login | Email/password + Google OAuth sign-in |
| `/signup` | Signup | Email/password registration with name field |
| `/_authenticated/dashboard` | Dashboard | Main hub: health score, mood selector, partner moods, sentiment sparkline, coaching cards, goals, insights, onboarding |
| `/_authenticated/connect` | Connect | Send/receive couple connection requests by email |
| `/_authenticated/setup` | Setup | Post-signup display name entry |
| `/_authenticated/whatsapp` | WhatsApp Connection | QR code scanning, contact selection, session management |
| `/_authenticated/chat` | Live Chat | Real-time WhatsApp chat with partner, media viewer, tone review, AI sidebar |
| `/_authenticated/goals` | Goals | Create/complete/dismiss couple goals, AI suggestions |
| `/_authenticated/profile` | Profile | Love languages, communication style, interests (AI-populated + manual override) |
| `/_authenticated/insights` | Insights | Tabbed analytics: Overview, Communication, Emotions, Discoveries, Coaching |

### Key UI Components

- **CoupleHero** — Hero card with names, health score ring, mood badges, sentiment sparkline
- **MoodSelector** — 5-level mood picker (great/good/neutral/low/struggling) with visibility options (silent/visible/alert) and optional note
- **MoodDetectionModal** — Popup when AI detects mood shift; user can confirm or dismiss
- **CoachSidebar** — Persistent right sidebar (desktop) or full-screen overlay (mobile) with streaming AI coach. Thread management, nudge badges, starter suggestions
- **CoachingCard** — Dashboard card showing active coaching tips from mood alerts
- **PatternCards** — Sentiment trend chart and message stats bar chart
- **GoalsCard** / **InsightsCard** — Dashboard summary cards
- **OnboardingCard** — Guides new users through WhatsApp connection and first analysis
- **Nav** — Desktop sidebar + mobile bottom tab navigation with coach toggle button and nudge indicator
- **Chat components** — `ChatHeader`, `MessageList`, `MessageBubble`, `ChatInput`, `ReviewPanel`, `AISidebar`, `MediaLightbox`, `StatusDot`, `DateDivider`, `LoggedOutOverlay`, `MobileSidebarSheet`

### Key Files

- Routes: `apps/web/src/routes/`
- Components: `apps/web/src/routes/_authenticated/-components/`
- Chat components: `apps/web/src/routes/_authenticated/-components/chat/`
- Insight tabs: `apps/web/src/routes/_authenticated/-components/insights/`

---

## 2. API Endpoints / Server Functions

### TanStack Start Server Functions (`apps/web/src/server/`)

| Module | Function | Method | Description |
|--------|----------|--------|-------------|
| `auth.ts` | `getAuthSession` | GET | Get current session via Better Auth |
| `connections.ts` | `searchAndSendRequest` | POST | Send connection request by email (anti-enumeration) |
| `connections.ts` | `getPendingRequests` | GET | Get incoming pending requests |
| `connections.ts` | `getSentRequests` | GET | Get outgoing requests |
| `connections.ts` | `acceptConnectionRequest` | POST | Accept request and create couple |
| `connections.ts` | `declineConnectionRequest` | POST | Decline request |
| `connections.ts` | `getMyCouple` | GET | Check if user has active couple |
| `dashboard.ts` | `getDashboardData` | GET | Aggregate dashboard data (moods, goals, insights, sentiment, message stats) |
| `intelligence.ts` | `getIntelligence` | GET | Unified intelligence fetch (shared by dashboard and chat) |
| `intelligence.ts` | `triggerAnalysis` | POST | Run full AI analysis pipeline on local DB messages |
| `mood.ts` | `setMood` | POST | Set user mood with visibility/note, SSE alert if visibility=alert |
| `mood.ts` | `getLatestMood` | GET | Get user's latest non-expired mood |
| `mood.ts` | `getMoodHistory` | GET | Couple mood timeline (last N days) |
| `mood.ts` | `getPartnerMood` | GET | Partner's latest visible/alert mood |
| `mood-detection.ts` | `triggerMoodDetection` | POST | AI mood shift detection from messages |
| `mood-detection.ts` | `getPendingMoodDetections` | GET | Get unresolved mood detections |
| `mood-detection.ts` | `confirmMoodDetection` | POST | Confirm AI mood detection, create mood state |
| `mood-detection.ts` | `dismissMoodDetection` | POST | Dismiss AI mood detection |
| `coaching.ts` | `generateMoodCoachingTips` | POST | AI coaching tips triggered by partner mood alert |
| `coaching.ts` | `getActiveCoaching` | GET | Get recent coaching_tip insights (24h) |
| `goals.ts` | `createGoal` | POST | Create couple goal (user or AI-suggested) |
| `goals.ts` | `getActiveGoals` | GET | Active goals |
| `goals.ts` | `getCompletedGoals` | GET | Completed goals |
| `goals.ts` | `completeGoal` | POST | Mark goal complete |
| `goals.ts` | `dismissGoal` | POST | Dismiss goal |
| `goals.ts` | `getAISuggestedGoals` | GET | AI-generated goal suggestions based on insights |
| `profile.ts` | `getProfile` | GET | Get own relationship profile |
| `profile.ts` | `getPartnerProfile` | GET | Get partner's profile (read-only) |
| `profile.ts` | `updateProfile` | POST | Manual profile edit (marks as source: 'manual') |
| `profile.ts` | `writeProfileFromAnalysis` | POST | Write AI-extracted profile data (preserves manual overrides) |
| `chat.ts` | `getChatAISuggestions` | POST | AI reply suggestions based on recent messages |
| `chat.ts` | `getChatAIMood` | POST | Live conversation mood analysis |
| `chat.ts` | `getChatAIReview` | POST | Tone review of draft message before sending |
| `insights.ts` | `getInsightsData` | GET | Full insights analytics (all parallel queries) |
| `coach.ts` | `getOrCreateThread` | POST | Get or create a coach thread |
| `coach.ts` | `listThreads` | GET | List coach threads for couple |
| `coach.ts` | `getThreadMessages` | GET | Get messages in a coach thread |
| `coach.ts` | `deleteThread` | POST | Delete a coach thread |
| `coach.ts` | `saveCoachExchange` | POST | Persist user+assistant messages, extract memory, generate title |
| `coach.ts` | `getCoachNudges` | GET | Get undismissed nudges |
| `coach.ts` | `dismissNudge` | POST | Dismiss a nudge |
| `coach.ts` | `getCoachStarter` | GET | AI-generated conversation starter for coach |
| `wa-session.ts` | `createWaSession` | POST | Create/reconnect WhatsApp bridge session |
| `wa-session.ts` | `pollWaSession` | GET | Poll session status + QR code |
| `wa-session.ts` | `getWaSessionStatus` | GET | Get current WA session status |
| `wa-session.ts` | `disconnectWaSession` | POST | Disconnect WA session |
| `wa-session.ts` | `fetchWaContacts` | GET | Get contacts from bridge |
| `wa-session.ts` | `selectWaContact` | POST | Bind partner JID to couple |

### Nitro Server Routes (`apps/web/server/routes/`)

| Route | Protocol | Description |
|-------|----------|-------------|
| `GET /sse/updates` | SSE | Real-time couple dashboard events (mood_update, goal_update, insight_update, analysis_complete) |
| `GET /sse/user-events` | SSE | User-scoped events (connection_request_received, connection_request_accepted) |
| `GET /sse/coach` | SSE | Streaming coach responses with threadId+message query params |
| `WS /ws/chat` | WebSocket | Live chat proxy — authenticates, resolves couple, proxies to wa-bridge, handles history + reconnect |
| `GET /api/media/:waMessageId` | HTTP | Media proxy with JWT auth to wa-bridge |
| `GET /api/auth/*` | HTTP | Better Auth catch-all route |

### WA Bridge REST API (`apps/wa-bridge/`)

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check (unauthenticated) |
| `/sessions` | POST | Create new Baileys session |
| `/sessions/:id` | GET | Get session status + QR + message count |
| `/sessions/:id/contacts` | GET | Get WhatsApp contacts |
| `/sessions/:id/contact` | POST | Bind JID to couple |
| `/sessions/:id/send` | POST | Send WhatsApp message |
| `/sessions/:id/restart` | POST | Restart session |
| `/sessions/:id` | DELETE | Delete session + auth data |
| `/analysis/:coupleId` | POST | Trigger manual analysis |
| `/media/:waMessageId` | GET | Serve stored media (JWT-authenticated) |

### WA Bridge WebSocket

Endpoint: `ws://bridge:port?sessionId=...` (JWT in Authorization header)

- Client sends: `send` (jid, text, clientId), `resync`
- Server broadcasts: `qr`, `connected`, `message`, `logged-out`, `reconnecting`, `reconnect-failed`, `messages-persisted`, `resync-complete`, `sent-echo`, `message-receipt`

---

## 3. AI Capabilities

All AI functions in `packages/ai/src/`. Provider: **Anthropic Claude**.

### Models

- Primary: `claude-sonnet-4-6` — analysis, coaching, tone review, coach conversations
- Fast: `claude-haiku-4-5-20251001` — reply suggestions, live mood, mood detection, intent classification, memory extraction, thread titles, starters, goal suggestions

### Functions

| Function | File | Purpose | Model |
|----------|------|---------|-------|
| `analyzeConversation` | `analyze.ts` | Health score (1-100), per-message sentiments, communication patterns, summary | Sonnet |
| `extractEntities` | `extract.ts` | Extract wishes, important dates, interests, love languages with confidence scores | Sonnet |
| `generateCoachingTips` | `coach.ts` | 3-5 actionable coaching tips from analysis | Sonnet |
| `generateMoodCoaching` | `coach.ts` | 2-3 empathetic tips for partner of someone feeling low | Sonnet |
| `generateReplySuggestions` | `chat.ts` | 2-3 contextual reply suggestions | Haiku |
| `analyzeLiveMood` | `chat.ts` | Live conversation mood label + coaching tips + tension flag | Haiku |
| `reviewMessageTone` | `chat.ts` | Review draft message tone, provide suggestions + revised version | Sonnet |
| `detectMoodShift` | `mood-detect.ts` | Detect mood shift from messages (mood level, confidence, reason) | Haiku |
| `classifyIntent` | `coach-conversation.ts` | Classify user message intent (communication, conflict, goals, emotions, etc.) | Haiku |
| `streamCoachResponse` | `coach-conversation.ts` | Stream full coaching response with rich context (health, patterns, goals, sentiments, love languages, moods, memory) | Sonnet |
| `extractCoachMemory` | `coach-conversation.ts` | Extract durable memory items from coaching exchange | Haiku |
| `generateThreadTitle` | `coach-conversation.ts` | Generate 3-6 word thread title | Haiku |
| `generateCoachStarter` | `coach-conversation.ts` | Context-specific insight + 3-4 action prompts for coach sidebar | Haiku |
| `runAnalysisPipeline` | `orchestrate.ts` | Full pipeline: analyzeConversation + extractEntities (parallel) → generateCoachingTips | Both |
| `detectNudgeTriggers` | `orchestrate.ts` | Rule-based: score_drop (>10pts), conflict_alert, milestone (crossing 80+) | N/A |

### Infrastructure

- `config.ts` — `parseAIResponse`, `parseValidatedResponse` (Zod), `withRetry` with exponential backoff (2s/4s/8s)
- `schemas.ts` — Zod schemas for all AI response formats
- `client.ts` — Singleton Anthropic client

---

## 4. WhatsApp Integration (wa-bridge)

### Architecture

Standalone Hono + Node.js service wrapping Baileys WhatsApp Web library. Runs on Railway, communicates with web app via JWT-authenticated REST + WebSocket.

### Session Management (`sessions/manager.ts`)

- SessionManager extends EventEmitter
- One Baileys socket per user
- Postgres-backed auth state (creds + signal keys in `wa_auth_creds` / `wa_auth_keys`)
- Auto-restore sessions on bridge restart
- Auto-reconnect with exponential backoff (3s base, max 300s, max 10 retries)
- LID (Linked ID) resolution via `wa_auth_keys` lid-mapping entries

### Message Handling (`messages/ingest.ts`)

- `normalizeMessage` — Baileys proto to NormalizedMessage
- `unwrapMessageContent` — Recursively unwraps ephemeral, viewOnce, edited wrappers (up to 8 levels)
- `extractMessageText` — Text from conversation, extendedTextMessage, or media captions
- `getMediaType` — image, video, audio, document, sticker
- `extractMessageThumbnail` — JPEG/PNG thumbnails from media
- `persistMessages` — Bulk insert with onConflictDoNothing, triggers analysis/mood detection
- `handleMessageRevoke` — Deletes revoked messages
- History sync + on-demand resync via `fetchMessageHistory`

### Media Handling (`messages/media.ts`)

- Downloads via Baileys `downloadMediaMessage`
- Stores as base64 in `message_media` table
- 16MB size limit, fire-and-forget

### Analysis Triggers (`analysis/trigger.ts`)

- Auto-analysis every 50 messages (configurable)
- Mood detection every 10 messages per couple
- Historical analysis on first run (4 time windows: 7d, 30d, 90d, 180d)
- Concurrency guard via in-memory Set

---

## 5. Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, name, plan (free) |
| `sessions` | Auth sessions | id, userId, token, expiresAt |
| `accounts` | OAuth accounts | userId, providerId, accessToken |
| `verifications` | Email verification tokens | identifier, value, expiresAt |
| `couples` | Core relationship entity | id, userAId, userBId, status, whatsappJid, healthScore, lastAnalyzed, messagesSinceAnalysis |
| `connection_requests` | Partner connection flow | fromUserId, toUserId, status |
| `messages` | WhatsApp messages | coupleId, waMessageId, senderId, text, timestamp, sentiment, isMedia, mediaType, thumbnail |
| `message_media` | Full-resolution media | waMessageId, data (base64), mimeType, fileSize |
| `mood_states` | Mood tracking | coupleId, userId, mood, source, visibility, note, expiresAt (24h) |
| `couple_goals` | Shared goals | coupleId, title, description, source, status |
| `insights` | AI-generated insights | coupleId, type (InsightType), content (JSONB), severity |
| `user_relationship_profiles` | Love languages, comm style, interests | coupleId, userId, loveLanguages, communicationStyle, interests |
| `wa_sessions` | WhatsApp session tracking | userId, bridgeSessionId, status |
| `wa_auth_creds` | Baileys auth credentials | sessionId, creds (JSONB) |
| `wa_auth_keys` | Baileys signal keys | sessionId+type+id, value (JSONB) |
| `health_score_history` | Score over time | coupleId, score, summary, periodStart, periodEnd |
| `couple_entities` | Extracted entities (wishes, dates) | coupleId, type, content (JSONB) |
| `coach_threads` | Coaching conversation threads | coupleId, title |
| `coach_messages` | Messages within threads | threadId, role, content, contextSnapshot |
| `coach_memory` | Durable coaching memory | coupleId, category, content, sourceThreadId |
| `coach_nudges` | Proactive coaching nudges | coupleId, trigger, message, dismissed |

### Insight Types

`health_score`, `communication_pattern`, `love_language`, `coaching_tip`, `conflict_alert`, `goal_suggestion`, `sentiment_trend`, `conversation_highlight`, `conflict_pattern`, `shared_interest`, `wish`, `important_date`, `mood_detection`

---

## 6. Real-Time Features

### Server-Sent Events (SSE)

| Endpoint | Scope | Events |
|----------|-------|--------|
| `GET /sse/updates` | Couple | `mood_update`, `goal_update`, `insight_update`, `analysis_complete` |
| `GET /sse/user-events` | User | `connection_request_received`, `connection_request_accepted` |
| `GET /sse/coach` | Couple | Streaming coach: `text` chunks, `done`, `error`, `ping` |

### WebSocket Chat

- Browser ↔ web server ↔ wa-bridge (proxy chain)
- History loading from DB, real-time message relay
- DB poll fallback every 5 seconds
- Exponential backoff reconnection on client

### Client Hooks

- `useDashboardEvents` — SSE subscription for real-time dashboard updates
- `useChatWebSocket` — Full WS lifecycle: connect, reconnect, send with throttle, optimistic updates, offline queue
- `useChatAI` — Automated: reply suggestions (3s debounce, 6/min), live mood (every 7 msgs, 2/min), tone review (3/hr)
- `useCoach` — Thread CRUD, streaming via SSE, nudge management, starter loading

---

## 7. Authentication & Authorization

- **Better Auth** with Drizzle adapter (PostgreSQL)
- Email/password + Google OAuth
- Session cookie-based auth
- `_authenticated` layout route checks session in `beforeLoad`
- **`requireCouple()`** — Central auth helper returning `{ session, couple, partnerId }`
- All queries filter by `coupleId` for data isolation
- **WA Bridge JWT** — HS256, 5m expiry, shared `WA_BRIDGE_JWT_SECRET`
- **Media JWT** — 1m expiry with `coupleId` claim
- **Optional site password** — HTTP Basic Auth via `SITE_PASSWORD` env var

---

## 8. Background Jobs / Automated Triggers

No traditional cron jobs. Event-driven triggers only:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Messages persisted | Every 50 messages | `runAnalysis()` or `runHistoricalAnalysis()` (first time) |
| Messages persisted | Every 10 messages | AI mood shift detection |
| Bridge startup | On boot | Auto-restore non-disconnected sessions |
| Coach exchange saved | Each save | Fire-and-forget memory extraction |
| Dashboard (client) | 5s poll during onboarding | Check for analysis completion |

---

## 9. Admin / Debug Tools

- **Site password gate** — Optional HTTP Basic Auth via `SITE_PASSWORD` env
- **Manual analysis trigger** — Dashboard button + server function + bridge endpoint
- **Drizzle Studio** — `pnpm db:studio` for direct DB inspection
- **Health endpoint** — `GET /health` on wa-bridge
- **`scripts/trigger-analysis.ts`** — Manual analysis trigger script
- **`scripts/dev-restart.sh`** — Development restart helper

---

## 10. Infrastructure

### Stack

- **Frontend**: TanStack Start (React + Vite SSR), TanStack Router (file-based)
- **Backend**: Nitro server (via TanStack Start) + Hono (wa-bridge)
- **Database**: PostgreSQL 17 (Drizzle ORM)
- **Cache**: Redis 7 (docker-compose, referenced but not actively used)
- **AI**: Anthropic Claude API (Sonnet + Haiku)
- **WhatsApp**: Baileys (@whiskeysockets/baileys)
- **Auth**: Better Auth with Drizzle adapter
- **Monorepo**: pnpm 9 + Turborepo

### Services

| Service | Port (dev) | Port (prod) | Deploy |
|---------|-----------|-------------|--------|
| Web app | 9941 | 3000 | Dockerfile, Railway |
| WA Bridge | 9945 | 3000 | Dockerfile, Railway |
| PostgreSQL | 5440 | — | Railway |
| Redis | 6381 | — | Railway |

### Key Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Both | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Both | Claude AI API key |
| `WA_BRIDGE_URL` | Web | URL of wa-bridge service |
| `WA_BRIDGE_JWT_SECRET` | Both | Shared JWT secret |
| `GOOGLE_CLIENT_ID/SECRET` | Web | Google OAuth |
| `SITE_PASSWORD` | Web | Optional site-wide auth |
| `ANALYSIS_THRESHOLD` | Bridge | Messages before auto-analysis (default 50) |

### Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Web app only |
| `pnpm dev:local` | Web + wa-bridge |
| `pnpm dev:full` | All packages |
| `pnpm dev:restart` | Restart dev servers |
| `pnpm db:push` | Push schema to DB |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm build` | Build all packages |
| `pnpm check-types` | TypeScript type checking |
