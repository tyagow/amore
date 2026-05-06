# AI Relationship Coach Sidebar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a global conversational AI coach sidebar accessible from every authenticated page, with thread history, auto-injected relationship context, streaming responses, and proactive nudges.

**Architecture:** Global slide-out panel on the right side of the authenticated layout. New Nitro SSE route streams Claude responses token-by-token. Four new DB tables store threads, messages, coach memory, and nudges. Intent classifier picks relevant relationship data to inject. Nudges triggered post-analysis.

**Tech Stack:** Drizzle ORM (Postgres), Anthropic SDK (streaming), Nitro SSE routes, TanStack Start server functions, React state management.

**Design doc:** `docs/plans/2026-03-09-ai-coach-sidebar-design.md`

---

## Phase 1: DB Schema

### Task 1.1: Add coach tables to schema

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add the four new tables at the end of schema.ts (before relations)**

Add after the `coupleEntities` table definition:

```ts
// ── Coach ────────────────────────────────────────────────────
export const coachThreads = pgTable('coach_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('coach_threads_couple_idx').on(table.coupleId),
]);

export const coachMessages = pgTable('coach_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').notNull().references(() => coachThreads.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  contextSnapshot: jsonb('context_snapshot'), // what data was injected
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_messages_thread_idx').on(table.threadId),
]);

export const coachMemory = pgTable('coach_memory', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  category: varchar('category', { length: 50 }).notNull(), // 'takeaway' | 'commitment' | 'theme' | 'preference'
  content: text('content').notNull(),
  sourceThreadId: text('source_thread_id').references(() => coachThreads.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_memory_couple_idx').on(table.coupleId),
]);

export const coachNudges = pgTable('coach_nudges', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  trigger: varchar('trigger', { length: 50 }).notNull(), // 'score_drop' | 'conflict_alert' | 'goal_deadline' | 'milestone'
  message: text('message').notNull(),
  dismissed: boolean('dismissed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_nudges_couple_idx').on(table.coupleId),
]);
```

**Step 2: Push schema to local DB**

Run: `cd packages/db && npx drizzle-kit push`
Expected: Tables created successfully, no errors.

**Step 3: Commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add coach_threads, coach_messages, coach_memory, coach_nudges tables"
```

---

## Phase 2: Coach Conversation Engine (AI Package)

### Task 2.1: Create coach conversation AI function with streaming

**Files:**
- Create: `packages/ai/src/coach-conversation.ts`

**Step 1: Create the coach conversation module**

This is separate from existing `coach.ts` (which is for batch coaching tips). This module handles the conversational coach with streaming.

```ts
import { getClient } from './client.js';
import { AI_MODEL, FAST_MODEL } from './config.js';

// ── Types ────────────────────────────────────────────────────

export interface CoachContext {
  healthScore: number | null;
  summary: string | null;
  recentInsights: Array<{ type: string; content: unknown; generatedAt: Date | string }>;
  goals: Array<{ title: string; status: string; description: string | null }>;
  patterns: {
    initiationBalance?: Record<string, number> | null;
    avgResponseMinutes?: Record<string, number> | null;
    messageCountBySender?: Record<string, number> | null;
  } | null;
  sentimentTrend: Array<{ date: string; avg: number }>;
  loveLanguages: {
    mine: Array<{ language: string; confidence: number }> | null;
    partner: Array<{ language: string; confidence: number }> | null;
  };
  recentMessages: Array<{ sender: string; text: string; timestamp: Date | string }>;
  moodStates: Array<{ userId: string; mood: string; note: string | null }>;
  coachMemory: Array<{ category: string; content: string }>;
}

export interface ThreadMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type CoachIntent = 'communication' | 'conflict' | 'goals' | 'emotions' | 'partner' | 'general';

// ── Intent Classifier ────────────────────────────────────────

export async function classifyIntent(message: string): Promise<CoachIntent> {
  const client = getClient();
  const resp = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 20,
    system: `Classify the user's relationship coaching question into exactly one category. Respond with ONLY the category word, nothing else.

Categories:
- communication: about how they talk, message patterns, initiation, response times
- conflict: about fights, tension, disagreements, hurt feelings, low sentiment
- goals: about relationship goals, plans, commitments, progress
- emotions: about feelings, mood, love languages, emotional needs, sentiment
- partner: about their partner specifically, what partner likes/wants, recent conversations
- general: anything else, greetings, vague questions, meta-questions about the app`,
    messages: [{ role: 'user', content: message }],
  });
  const text = resp.content[0]?.type === 'text' ? resp.content[0].text.trim().toLowerCase() : 'general';
  const valid: CoachIntent[] = ['communication', 'conflict', 'goals', 'emotions', 'partner', 'general'];
  return valid.includes(text as CoachIntent) ? (text as CoachIntent) : 'general';
}

// ── System Prompt Builder ────────────────────────────────────

function buildSystemPrompt(context: Partial<CoachContext>, currentPage?: string): string {
  const parts: string[] = [];

  parts.push(`You are a direct, opinionated relationship coach for a couple using the Amore app. You have access to their real relationship data — never guess or fabricate facts.

Your style:
- Give concrete, actionable advice. State what you see clearly.
- Be warm but direct. "Your communication is one-sided right now — here's what to do" not "Have you considered..."
- Only ask questions when you genuinely need more information.
- Reference specific data when relevant ("Your initiation ratio is 70/30").
- Remember past coaching conversations and follow up on commitments.
- Never take sides — frame everything as "the relationship."
- Keep responses concise (2-4 paragraphs max unless the topic demands more).`);

  if (context.healthScore != null) {
    parts.push(`\nRelationship health score: ${context.healthScore}/100`);
  }
  if (context.summary) {
    parts.push(`Recent analysis summary: ${context.summary}`);
  }
  if (context.patterns) {
    parts.push(`Communication patterns: ${JSON.stringify(context.patterns)}`);
  }
  if (context.goals?.length) {
    parts.push(`Active goals:\n${context.goals.map(g => `- ${g.title} (${g.status}): ${g.description || 'No description'}`).join('\n')}`);
  }
  if (context.sentimentTrend?.length) {
    const recent = context.sentimentTrend.slice(-7);
    parts.push(`Sentiment trend (last ${recent.length} days): ${recent.map(s => `${s.date}: ${s.avg.toFixed(2)}`).join(', ')}`);
  }
  if (context.loveLanguages?.mine?.length || context.loveLanguages?.partner?.length) {
    parts.push(`Love languages — User: ${JSON.stringify(context.loveLanguages.mine)}, Partner: ${JSON.stringify(context.loveLanguages.partner)}`);
  }
  if (context.recentMessages?.length) {
    const msgs = context.recentMessages.slice(-10);
    parts.push(`Recent WhatsApp messages (last ${msgs.length}):\n${msgs.map(m => `[${m.sender}]: ${m.text}`).join('\n')}`);
  }
  if (context.moodStates?.length) {
    parts.push(`Current mood states: ${context.moodStates.map(m => `${m.userId}: ${m.mood}${m.note ? ` (${m.note})` : ''}`).join(', ')}`);
  }
  if (context.coachMemory?.length) {
    parts.push(`\nYour session notes from past coaching:\n${context.coachMemory.map(m => `- [${m.category}] ${m.content}`).join('\n')}`);
  }
  if (context.recentInsights?.length) {
    const insights = context.recentInsights.slice(0, 5);
    parts.push(`Recent insights:\n${insights.map(i => `- [${i.type}] ${JSON.stringify(i.content)}`).join('\n')}`);
  }

  if (currentPage) {
    const greetings: Record<string, string> = {
      dashboard: 'The user is on their dashboard. If this is the start of a conversation, you might reference what they see there.',
      insights: 'The user is reviewing their relationship insights/analytics.',
      goals: 'The user is looking at their relationship goals.',
      chat: 'The user is in their WhatsApp chat view.',
      profile: 'The user is on their profile page.',
    };
    if (greetings[currentPage]) parts.push(`\n${greetings[currentPage]}`);
  }

  return parts.join('\n');
}

// ── Streaming Coach Response ─────────────────────────────────

export async function streamCoachResponse(
  threadHistory: ThreadMessage[],
  newMessage: string,
  context: Partial<CoachContext>,
  currentPage?: string,
): Promise<AsyncIterable<string>> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt(context, currentPage);

  const messages = [
    ...threadHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: newMessage },
  ];

  const stream = client.messages.stream({
    model: AI_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  return stream.textStream;
}

// ── Memory Extraction ────────────────────────────────────────

export interface ExtractedMemory {
  category: 'takeaway' | 'commitment' | 'theme' | 'preference';
  content: string;
}

export async function extractCoachMemory(
  userMessage: string,
  assistantResponse: string,
): Promise<ExtractedMemory[]> {
  const client = getClient();
  const resp = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 500,
    system: `Extract key takeaways from this coaching exchange. Return a JSON array of objects with "category" (one of: takeaway, commitment, theme, preference) and "content" (one concise sentence).

Only extract genuinely notable items:
- commitment: user explicitly committed to doing something
- takeaway: an important insight or realization
- theme: a recurring topic or pattern
- preference: user stated a preference about how they want advice

If nothing notable, return an empty array [].
Return ONLY the JSON array, no other text.`,
    messages: [
      { role: 'user', content: `User said: "${userMessage}"\n\nCoach responded: "${assistantResponse}"` },
    ],
  });

  try {
    const text = resp.content[0]?.type === 'text' ? resp.content[0].text : '[]';
    const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Thread Title Generation ──────────────────────────────────

export async function generateThreadTitle(firstMessage: string): Promise<string> {
  const client = getClient();
  const resp = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 30,
    system: 'Generate a short title (3-6 words) for this coaching conversation based on the first message. Return ONLY the title, no quotes or punctuation.',
    messages: [{ role: 'user', content: firstMessage }],
  });
  const text = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : 'Coaching session';
  return text.slice(0, 100);
}
```

**Step 2: Export from package index**

Check `packages/ai/src/index.ts` and add the export:
```ts
export * from './coach-conversation.js';
```

**Step 3: Verify build**

Run: `cd packages/ai && pnpm run build` (or `tsc --noEmit` if no build script)
Expected: No errors

**Step 4: Commit**

```bash
git add packages/ai/src/coach-conversation.ts packages/ai/src/index.ts
git commit -m "feat(ai): add coach conversation engine with streaming, intent classifier, memory extraction"
```

---

## Phase 3: Server Functions & SSE Route

### Task 3.1: Create coach server functions (thread CRUD, context fetching)

**Files:**
- Create: `apps/web/src/server/coach.ts`

**Step 1: Create the server functions**

Follow the same patterns as `intelligence.ts` — `createServerFn`, `requireCouple()`, Drizzle queries.

```ts
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { db } from '@amore-couples/db';
import {
  coachThreads,
  coachMessages,
  coachMemory,
  coachNudges,
  couples,
  insights,
  coupleGoals,
  messages,
  moodStates,
  userRelationshipProfiles,
  healthScoreHistory,
} from '@amore-couples/db/schema';
import { eq, desc, and, gte, sql, asc } from 'drizzle-orm';
import { requireCouple } from './require-couple';
import {
  classifyIntent,
  extractCoachMemory,
  generateThreadTitle,
  type CoachContext,
  type CoachIntent,
} from '@amore-couples/ai';

// ── Get or create active thread ──────────────────────────────

export const getOrCreateThread = createServerFn({ method: 'POST' })
  .validator(z.object({ threadId: z.string().optional() }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple();

    if (data.threadId) {
      const existing = await db
        .select()
        .from(coachThreads)
        .where(and(eq(coachThreads.id, data.threadId), eq(coachThreads.coupleId, couple.id)))
        .limit(1);
      if (existing[0]) return existing[0];
    }

    const [thread] = await db
      .insert(coachThreads)
      .values({ coupleId: couple.id })
      .returning();
    return thread;
  });

// ── List threads ─────────────────────────────────────────────

export const listThreads = createServerFn({ method: 'GET' }).handler(async () => {
  const { couple } = await requireCouple();
  return db
    .select()
    .from(coachThreads)
    .where(eq(coachThreads.coupleId, couple.id))
    .orderBy(desc(coachThreads.updatedAt))
    .limit(50);
});

// ── Get thread messages ──────────────────────────────────────

export const getThreadMessages = createServerFn({ method: 'GET' })
  .validator(z.object({ threadId: z.string() }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple();

    // Verify thread belongs to couple
    const thread = await db
      .select()
      .from(coachThreads)
      .where(and(eq(coachThreads.id, data.threadId), eq(coachThreads.coupleId, couple.id)))
      .limit(1);
    if (!thread[0]) throw new Error('Thread not found');

    return db
      .select()
      .from(coachMessages)
      .where(eq(coachMessages.threadId, data.threadId))
      .orderBy(asc(coachMessages.createdAt));
  });

// ── Delete thread ────────────────────────────────────────────

export const deleteThread = createServerFn({ method: 'POST' })
  .validator(z.object({ threadId: z.string() }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple();
    await db
      .delete(coachThreads)
      .where(and(eq(coachThreads.id, data.threadId), eq(coachThreads.coupleId, couple.id)));
    return { ok: true };
  });

// ── Fetch context based on intent ────────────────────────────

export async function fetchCoachContext(
  coupleId: string,
  userId: string,
  partnerId: string,
  intent: CoachIntent,
): Promise<Partial<CoachContext>> {
  const ctx: Partial<CoachContext> = {};

  // Always fetch basics
  const [coupleRow] = await db
    .select({ healthScore: couples.healthScore })
    .from(couples)
    .where(eq(couples.id, coupleId));
  ctx.healthScore = coupleRow?.healthScore ?? null;

  // Always fetch coach memory
  const memory = await db
    .select({ category: coachMemory.category, content: coachMemory.content })
    .from(coachMemory)
    .where(eq(coachMemory.coupleId, coupleId))
    .orderBy(desc(coachMemory.createdAt))
    .limit(20);
  ctx.coachMemory = memory;

  // Intent-specific fetching
  if (intent === 'communication' || intent === 'general') {
    const recentInsightsRows = await db
      .select()
      .from(insights)
      .where(and(eq(insights.coupleId, coupleId), eq(insights.type, 'communication_pattern')))
      .orderBy(desc(insights.generatedAt))
      .limit(3);
    ctx.recentInsights = recentInsightsRows;

    // Get latest analysis summary from health_score_history
    const [latest] = await db
      .select({ summary: healthScoreHistory.summary })
      .from(healthScoreHistory)
      .where(eq(healthScoreHistory.coupleId, coupleId))
      .orderBy(desc(healthScoreHistory.recordedAt))
      .limit(1);
    ctx.summary = latest?.summary ?? null;
  }

  if (intent === 'conflict') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const conflictInsights = await db
      .select()
      .from(insights)
      .where(and(
        eq(insights.coupleId, coupleId),
        sql`${insights.type} IN ('conflict_alert', 'conflict_pattern')`,
      ))
      .orderBy(desc(insights.generatedAt))
      .limit(5);
    ctx.recentInsights = conflictInsights;

    // Low sentiment messages
    const lowSentiment = await db
      .select({ sender: messages.senderId, text: messages.text, timestamp: messages.timestamp })
      .from(messages)
      .where(and(
        eq(messages.coupleId, coupleId),
        sql`${messages.sentiment} < -0.3`,
        gte(messages.timestamp, thirtyDaysAgo),
      ))
      .orderBy(desc(messages.timestamp))
      .limit(10);
    ctx.recentMessages = lowSentiment.map(m => ({
      sender: m.sender === userId ? 'You' : 'Partner',
      text: m.text ?? '',
      timestamp: m.timestamp,
    }));
  }

  if (intent === 'goals') {
    const goals = await db
      .select()
      .from(coupleGoals)
      .where(eq(coupleGoals.coupleId, coupleId))
      .orderBy(desc(coupleGoals.createdAt));
    ctx.goals = goals.map(g => ({
      title: g.title,
      status: g.status,
      description: g.description,
    }));
  }

  if (intent === 'emotions') {
    // Sentiment trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sentimentRows = await db
      .select({
        date: sql<string>`DATE(${messages.timestamp})`,
        avg: sql<number>`AVG(${messages.sentiment})`,
      })
      .from(messages)
      .where(and(
        eq(messages.coupleId, coupleId),
        gte(messages.timestamp, thirtyDaysAgo),
        sql`${messages.sentiment} IS NOT NULL`,
      ))
      .groupBy(sql`DATE(${messages.timestamp})`)
      .orderBy(sql`DATE(${messages.timestamp})`);
    ctx.sentimentTrend = sentimentRows.map(r => ({ date: String(r.date), avg: Number(r.avg) }));

    // Mood states
    const moods = await db
      .select()
      .from(moodStates)
      .where(eq(moodStates.coupleId, coupleId))
      .orderBy(desc(moodStates.createdAt))
      .limit(4);
    ctx.moodStates = moods.map(m => ({
      userId: m.userId === userId ? 'You' : 'Partner',
      mood: m.mood,
      note: m.note,
    }));

    // Love languages
    const profiles = await db
      .select()
      .from(userRelationshipProfiles)
      .where(eq(userRelationshipProfiles.coupleId, coupleId));
    const mine = profiles.find(p => p.userId === userId);
    const theirs = profiles.find(p => p.userId === partnerId);
    ctx.loveLanguages = {
      mine: (mine?.loveLanguages as Array<{ language: string; confidence: number }>) ?? null,
      partner: (theirs?.loveLanguages as Array<{ language: string; confidence: number }>) ?? null,
    };
  }

  if (intent === 'partner') {
    // Recent messages
    const recentMsgs = await db
      .select({ sender: messages.senderId, text: messages.text, timestamp: messages.timestamp })
      .from(messages)
      .where(eq(messages.coupleId, coupleId))
      .orderBy(desc(messages.timestamp))
      .limit(20);
    ctx.recentMessages = recentMsgs.map(m => ({
      sender: m.sender === userId ? 'You' : 'Partner',
      text: m.text ?? '',
      timestamp: m.timestamp,
    }));

    // Partner profile
    const [partnerProfile] = await db
      .select()
      .from(userRelationshipProfiles)
      .where(and(
        eq(userRelationshipProfiles.coupleId, coupleId),
        eq(userRelationshipProfiles.userId, partnerId),
      ));
    if (partnerProfile) {
      ctx.loveLanguages = {
        mine: null,
        partner: (partnerProfile.loveLanguages as Array<{ language: string; confidence: number }>) ?? null,
      };
    }
  }

  return ctx;
}

// ── Save coach message + extract memory (post-response) ──────

export const saveCoachExchange = createServerFn({ method: 'POST' })
  .validator(z.object({
    threadId: z.string(),
    userMessage: z.string(),
    assistantMessage: z.string(),
    contextSnapshot: z.record(z.unknown()).optional(),
    isFirstMessage: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple();

    // Verify thread ownership
    const [thread] = await db
      .select()
      .from(coachThreads)
      .where(and(eq(coachThreads.id, data.threadId), eq(coachThreads.coupleId, couple.id)));
    if (!thread) throw new Error('Thread not found');

    // Save both messages
    await db.insert(coachMessages).values([
      { threadId: data.threadId, role: 'user', content: data.userMessage, contextSnapshot: data.contextSnapshot },
      { threadId: data.threadId, role: 'assistant', content: data.assistantMessage },
    ]);

    // Update thread timestamp
    await db
      .update(coachThreads)
      .set({ updatedAt: new Date() })
      .where(eq(coachThreads.id, data.threadId));

    // Generate title if first message
    if (data.isFirstMessage) {
      const title = await generateThreadTitle(data.userMessage);
      await db
        .update(coachThreads)
        .set({ title })
        .where(eq(coachThreads.id, data.threadId));
    }

    // Extract memory asynchronously (don't block response)
    extractCoachMemory(data.userMessage, data.assistantMessage)
      .then(async (memories) => {
        if (memories.length > 0) {
          await db.insert(coachMemory).values(
            memories.map(m => ({
              coupleId: couple.id,
              category: m.category,
              content: m.content,
              sourceThreadId: data.threadId,
            })),
          );
        }
      })
      .catch(console.error);

    return { ok: true };
  });

// ── Get nudges ───────────────────────────────────────────────

export const getCoachNudges = createServerFn({ method: 'GET' }).handler(async () => {
  const { couple } = await requireCouple();
  return db
    .select()
    .from(coachNudges)
    .where(and(eq(coachNudges.coupleId, couple.id), eq(coachNudges.dismissed, false)))
    .orderBy(desc(coachNudges.createdAt))
    .limit(5);
});

// ── Dismiss nudge ────────────────────────────────────────────

export const dismissNudge = createServerFn({ method: 'POST' })
  .validator(z.object({ nudgeId: z.string() }))
  .handler(async ({ data }) => {
    const { couple } = await requireCouple();
    await db
      .update(coachNudges)
      .set({ dismissed: true })
      .where(and(eq(coachNudges.id, data.nudgeId), eq(coachNudges.coupleId, couple.id)));
    return { ok: true };
  });
```

**Step 2: Verify build**

Run: `cd apps/web && pnpm run build`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/server/coach.ts
git commit -m "feat(web): add coach server functions — thread CRUD, context fetching, nudges"
```

### Task 3.2: Create SSE streaming route for coach responses

**Files:**
- Create: `apps/web/server/routes/sse/coach.ts`

**Step 1: Create the SSE route**

Follow the existing pattern in `server/routes/sse/updates.ts` — Nitro event handler with `ReadableStream` + `text/event-stream`.

```ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { db } from '@amore-couples/db';
import { coachThreads, coachMessages } from '@amore-couples/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { streamCoachResponse, classifyIntent, type ThreadMessage } from '@amore-couples/ai';
import { fetchCoachContext } from '~/server/coach';

// Auth helper — reuse the same session validation as other SSE routes
async function getSessionFromCookie(event: any) {
  // Import the auth instance used by the app
  const { auth } = await import('~/lib/auth');
  const session = await auth.api.getSession({ headers: event.node.req.headers });
  return session;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const threadId = query.threadId as string;
  const message = query.message as string;
  const currentPage = (query.currentPage as string) || undefined;

  if (!threadId || !message) {
    throw createError({ statusCode: 400, message: 'threadId and message are required' });
  }

  // Auth
  const session = await getSessionFromCookie(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Verify thread ownership and get couple info
  const [thread] = await db
    .select()
    .from(coachThreads)
    .where(eq(coachThreads.id, threadId));

  if (!thread) {
    throw createError({ statusCode: 404, message: 'Thread not found' });
  }

  // Get thread history
  const historyRows = await db
    .select({ role: coachMessages.role, content: coachMessages.content })
    .from(coachMessages)
    .where(eq(coachMessages.threadId, threadId))
    .orderBy(asc(coachMessages.createdAt));

  const threadHistory: ThreadMessage[] = historyRows.map(r => ({
    role: r.role as 'user' | 'assistant',
    content: r.content,
  }));

  // Classify intent and fetch context
  const intent = await classifyIntent(message);

  // We need couple + user info — fetch from thread's coupleId
  // For now, use the session user. The couple lookup is handled inside fetchCoachContext.
  const { requireCouple } = await import('~/server/require-couple');
  const { couple, partnerId } = await requireCouple();
  const context = await fetchCoachContext(couple.id, session.user.id, partnerId, intent);

  // Stream response
  const textStream = await streamCoachResponse(threadHistory, message, context, currentPage);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';
        for await (const chunk of textStream) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
        }
        // Send completion event with the full response
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullResponse })}\n\n`));
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});
```

**Step 2: Verify the route is picked up by Nitro**

Run: `cd apps/web && pnpm run build`
Expected: No errors. Nitro auto-discovers routes in `server/routes/`.

**Step 3: Commit**

```bash
git add apps/web/server/routes/sse/coach.ts
git commit -m "feat(web): add SSE route for streaming coach responses"
```

---

## Phase 4: Coach Hook (Frontend State Management)

### Task 4.1: Create the useCoach hook

**Files:**
- Create: `apps/web/src/hooks/use-coach.ts`

**Step 1: Create the hook**

This hook manages coach state — threads, messages, streaming, nudges. Pattern follows `use-chat-ai.ts`.

```ts
import { useState, useCallback, useRef } from 'react';
import {
  getOrCreateThread,
  listThreads,
  getThreadMessages,
  deleteThread,
  saveCoachExchange,
  getCoachNudges,
  dismissNudge,
} from '~/server/coach';

interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

interface CoachThread {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CoachNudge {
  id: string;
  trigger: string;
  message: string;
  createdAt: string;
}

export function useCoach(currentPage?: string) {
  const [threads, setThreads] = useState<CoachThread[]>([]);
  const [activeThread, setActiveThread] = useState<CoachThread | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [nudges, setNudges] = useState<CoachNudge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messageCountRef = useRef(0);

  // Load threads list
  const loadThreads = useCallback(async () => {
    const result = await listThreads();
    setThreads(result);
    return result;
  }, []);

  // Load or create a thread
  const openThread = useCallback(async (threadId?: string) => {
    setIsLoading(true);
    try {
      const thread = await getOrCreateThread({ data: { threadId } });
      setActiveThread(thread);

      if (threadId) {
        const msgs = await getThreadMessages({ data: { threadId } });
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          createdAt: m.createdAt.toISOString?.() ?? String(m.createdAt),
        })));
        messageCountRef.current = msgs.length;
      } else {
        setMessages([]);
        messageCountRef.current = 0;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start a new thread
  const newThread = useCallback(async () => {
    const thread = await getOrCreateThread({ data: {} });
    setActiveThread(thread);
    setMessages([]);
    messageCountRef.current = 0;
    await loadThreads();
  }, [loadThreads]);

  // Send message and stream response
  const sendMessage = useCallback(async (text: string) => {
    if (!activeThread || isStreaming) return;

    // Add user message optimistically
    const userMsg: CoachMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add placeholder for assistant
    const assistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }]);

    setIsStreaming(true);
    const isFirstMessage = messageCountRef.current === 0;

    try {
      // Start SSE stream
      const params = new URLSearchParams({
        threadId: activeThread.id,
        message: text,
        ...(currentPage && { currentPage }),
      });

      abortRef.current = new AbortController();
      const response = await fetch(`/sse/coach?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to connect to coach');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullResponse += data.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullResponse, isStreaming: true }
                    : m,
                ),
              );
            } else if (data.type === 'done') {
              fullResponse = data.content;
            } else if (data.type === 'error') {
              throw new Error(data.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Finalize the streaming message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: fullResponse, isStreaming: false }
            : m,
        ),
      );
      messageCountRef.current += 2;

      // Save exchange to DB (async, don't block UI)
      saveCoachExchange({
        data: {
          threadId: activeThread.id,
          userMessage: text,
          assistantMessage: fullResponse,
          isFirstMessage,
        },
      }).then(() => {
        if (isFirstMessage) loadThreads();
      }).catch(console.error);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      // Remove failed assistant message
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      console.error('Coach error:', err);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeThread, isStreaming, currentPage, loadThreads]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  // Delete a thread
  const removeThread = useCallback(async (threadId: string) => {
    await deleteThread({ data: { threadId } });
    if (activeThread?.id === threadId) {
      setActiveThread(null);
      setMessages([]);
    }
    await loadThreads();
  }, [activeThread, loadThreads]);

  // Load nudges
  const loadNudges = useCallback(async () => {
    const result = await getCoachNudges();
    setNudges(result);
  }, []);

  // Dismiss a nudge
  const handleDismissNudge = useCallback(async (nudgeId: string) => {
    await dismissNudge({ data: { nudgeId } });
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  }, []);

  return {
    threads,
    activeThread,
    messages,
    isStreaming,
    isLoading,
    nudges,
    loadThreads,
    openThread,
    newThread,
    sendMessage,
    stopStreaming,
    removeThread,
    loadNudges,
    dismissNudge: handleDismissNudge,
  };
}
```

**Step 2: Verify build**

Run: `cd apps/web && pnpm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-coach.ts
git commit -m "feat(web): add useCoach hook — thread management, SSE streaming, nudges"
```

---

## Phase 5: Coach Sidebar Component

### Task 5.1: Build the CoachSidebar component

**Files:**
- Create: `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx`

**Step 1: Create the component**

This is the main coach panel UI. Follows the visual style from existing components (warm colors, rounded cards).

```tsx
import { useState, useRef, useEffect } from 'react';
import { useCoach } from '~/hooks/use-coach';

// ── Message Bubble ───────────────────────────────────────────

function CoachBubble({ role, content, isStreaming }: {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-coral-100 text-coral-900 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-sm">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-warm-200 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] text-sm text-warm-800 whitespace-pre-wrap">
        {content}
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-coral-400 ml-0.5 animate-pulse rounded-sm" />}
      </div>
    </div>
  );
}

// ── Thread List Drawer ───────────────────────────────────────

function ThreadList({ threads, activeId, onSelect, onDelete, onNew }: {
  threads: Array<{ id: string; title: string | null; updatedAt: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNew}
        className="mx-3 mt-2 mb-3 px-4 py-2 bg-coral-500 text-white rounded-xl text-sm font-medium hover:bg-coral-600 transition-colors"
      >
        + New conversation
      </button>
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {threads.map(t => (
          <div
            key={t.id}
            className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer text-sm transition-colors ${
              t.id === activeId ? 'bg-coral-50 text-coral-700' : 'hover:bg-warm-100 text-warm-700'
            }`}
          >
            <button onClick={() => onSelect(t.id)} className="flex-1 text-left truncate">
              {t.title || 'Untitled'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
              className="ml-2 text-warm-400 hover:text-red-500 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {threads.length === 0 && (
          <p className="text-center text-warm-400 text-xs py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}

// ── Nudge Banner ─────────────────────────────────────────────

function NudgeBanner({ nudge, onDismiss, onEngage }: {
  nudge: { id: string; trigger: string; message: string };
  onDismiss: () => void;
  onEngage: () => void;
}) {
  return (
    <div className="mx-3 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
      <p className="text-amber-800">{nudge.message}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onEngage}
          className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600"
        >
          Let's talk about it
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1 text-amber-600 hover:text-amber-800 text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Main Coach Sidebar ───────────────────────────────────────

export function CoachSidebar({ currentPage, onClose }: {
  currentPage?: string;
  onClose: () => void;
}) {
  const {
    threads, activeThread, messages, isStreaming, isLoading, nudges,
    loadThreads, openThread, newThread, sendMessage, stopStreaming,
    removeThread, loadNudges, dismissNudge,
  } = useCoach(currentPage);

  const [input, setInput] = useState('');
  const [showThreads, setShowThreads] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Init: load threads and nudges, open latest or new thread
  useEffect(() => {
    async function init() {
      const [threadList] = await Promise.all([loadThreads(), loadNudges()]);
      if (threadList.length > 0) {
        await openThread(threadList[0].id);
      } else {
        await openThread();
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Focus input when ready
  useEffect(() => {
    if (!isLoading && !showThreads) inputRef.current?.focus();
  }, [isLoading, showThreads]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleThreadSelect = async (threadId: string) => {
    await openThread(threadId);
    setShowThreads(false);
  };

  const handleNudgeEngage = async (nudge: { id: string; message: string }) => {
    await dismissNudge(nudge.id);
    setInput(nudge.message);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-warm-50 border-l border-warm-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className="text-warm-500 hover:text-warm-700"
            title="Thread history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <h2 className="font-semibold text-warm-800 text-sm">
            {showThreads ? 'Conversations' : 'Coach'}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {!showThreads && (
            <button
              onClick={newThread}
              className="text-warm-400 hover:text-coral-500 p-1"
              title="New conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showThreads ? (
        <ThreadList
          threads={threads}
          activeId={activeThread?.id ?? null}
          onSelect={handleThreadSelect}
          onDelete={removeThread}
          onNew={async () => { await newThread(); setShowThreads(false); }}
        />
      ) : (
        <>
          {/* Nudges */}
          {nudges.length > 0 && (
            <NudgeBanner
              nudge={nudges[0]}
              onDismiss={() => dismissNudge(nudges[0].id)}
              onEngage={() => handleNudgeEngage(nudges[0])}
            />
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-coral-300 border-t-coral-500 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-3xl mb-3">🧠</div>
                <p className="text-warm-600 text-sm font-medium mb-1">Your relationship coach</p>
                <p className="text-warm-400 text-xs">
                  Ask about your communication patterns, get advice on conflicts,
                  set goals, or just check in on how things are going.
                </p>
              </div>
            ) : (
              messages.map(m => (
                <CoachBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  isStreaming={m.isStreaming}
                />
              ))
            )}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-end gap-2 bg-white border border-warm-200 rounded-2xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-warm-800 placeholder:text-warm-400 outline-none max-h-24"
                style={{ height: 'auto', minHeight: '1.5rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                }}
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-warm-200 text-warm-600 hover:bg-warm-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-coral-500 text-white hover:bg-coral-600 disabled:opacity-40 disabled:hover:bg-coral-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m-7 7l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd apps/web && pnpm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx
git commit -m "feat(web): add CoachSidebar component — chat UI, thread list, nudge banner"
```

---

## Phase 6: Global Layout Integration

### Task 6.1: Add coach toggle to nav

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/nav.tsx`

**Step 1: Add coach icon to both mobile and desktop navs**

Add a new `NavProps` field: `onCoachToggle: () => void` and `coachOpen: boolean` and `hasNudges: boolean`.

In the **desktop sidebar**, add a coach button above the sign-out button:
```tsx
<SidebarItem to="#" label="Coach" onClick={props.onCoachToggle} active={props.coachOpen}>
  {/* brain icon */}
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
  {props.hasNudges && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
</SidebarItem>
```

The coach button is NOT a route link — it's a button that calls `onCoachToggle`. This is different from other nav items. The nav component doesn't need to know about routing for this.

**Note:** The exact implementation will need to adapt to the existing `NavItem`/`SidebarItem` components. These currently use `<Link to={...}>` — the coach button should be a `<button>` instead. Add a variant or create a `SidebarButton` sub-component.

**Step 2: Verify the nav still renders correctly**

Run: `cd apps/web && pnpm run build`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/-components/nav.tsx
git commit -m "feat(web): add coach toggle button to nav with nudge badge"
```

### Task 6.2: Add coach sidebar to authenticated layout

**Files:**
- Modify: `apps/web/src/routes/_authenticated.tsx`

**Step 1: Add coach sidebar state and panel to the layout**

The authenticated layout currently wraps all pages with Nav + content area. Add:
1. Coach open/close state
2. CoachSidebar panel conditionally rendered
3. Content area adjusts width when panel is open
4. Mobile FAB button

```tsx
// Add to imports
import { useState, useEffect } from 'react';
import { CoachSidebar } from './-components/coach-sidebar';
import { getCoachNudges } from '~/server/coach';

function AuthenticatedLayout() {
  const { pendingRequestCount } = Route.useRouteContext();
  const [coachOpen, setCoachOpen] = useState(false);
  const [hasNudges, setHasNudges] = useState(false);

  // Check for nudges on mount
  useEffect(() => {
    getCoachNudges().then(nudges => setHasNudges(nudges.length > 0)).catch(() => {});
  }, []);

  // Get current page name from route
  const currentPage = Route.useMatch()?.pathname?.split('/').pop() || 'dashboard';

  return (
    <div className="min-h-screen bg-warm-50">
      <Nav
        pendingRequestCount={pendingRequestCount}
        onCoachToggle={() => setCoachOpen(!coachOpen)}
        coachOpen={coachOpen}
        hasNudges={hasNudges}
      />

      {/* Content area — shrinks when coach panel is open on desktop */}
      <div className={`md:ml-64 pb-20 md:pb-0 transition-all duration-300 ${coachOpen ? 'lg:mr-[350px]' : ''}`}>
        <Outlet />
      </div>

      {/* Coach panel — desktop */}
      {coachOpen && (
        <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-[350px] z-40 shadow-xl">
          <CoachSidebar
            currentPage={currentPage}
            onClose={() => setCoachOpen(false)}
          />
        </div>
      )}

      {/* Coach panel — mobile (full screen sheet) */}
      {coachOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-warm-50">
          <CoachSidebar
            currentPage={currentPage}
            onClose={() => setCoachOpen(false)}
          />
        </div>
      )}

      {/* Mobile FAB — shown when coach is closed */}
      {!coachOpen && (
        <button
          onClick={() => setCoachOpen(true)}
          className="lg:hidden fixed bottom-24 right-4 z-30 w-14 h-14 bg-coral-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-coral-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {hasNudges && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd apps/web && pnpm run build`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.tsx
git commit -m "feat(web): integrate coach sidebar into authenticated layout — desktop panel + mobile FAB/sheet"
```

---

## Phase 7: Proactive Nudge System

### Task 7.1: Add nudge generation to the analysis pipeline

**Files:**
- Modify: `packages/ai/src/orchestrate.ts`

**Step 1: Add nudge generation after analysis completes**

At the end of `runAnalysisPipeline`, after all insights are generated, check for nudge-worthy events. This doesn't modify the pipeline return value — it inserts nudges directly into the DB (or returns them for the caller to insert).

Add a new exported function:

```ts
export interface NudgeTrigger {
  trigger: 'score_drop' | 'conflict_alert' | 'goal_deadline' | 'milestone';
  message: string;
}

export function detectNudgeTriggers(
  currentScore: number,
  previousScore: number | null,
  insights: Array<{ type: string }>,
): NudgeTrigger[] {
  const nudges: NudgeTrigger[] = [];

  // Score drop > 10 points
  if (previousScore != null && currentScore < previousScore - 10) {
    const drop = previousScore - currentScore;
    nudges.push({
      trigger: 'score_drop',
      message: `Your relationship health dropped ${drop} points to ${currentScore}. Want to talk about what might be going on?`,
    });
  }

  // Conflict alert generated
  if (insights.some(i => i.type === 'conflict_alert')) {
    nudges.push({
      trigger: 'conflict_alert',
      message: `I noticed some tension in your recent conversations. Would it help to talk through what happened?`,
    });
  }

  // New high score milestone
  if (previousScore != null && currentScore >= 80 && previousScore < 80) {
    nudges.push({
      trigger: 'milestone',
      message: `Your health score hit ${currentScore} — that's great! Want to talk about what's been working well?`,
    });
  }

  return nudges;
}
```

**Step 2: Wire nudge detection into the analysis callers**

In `apps/web/src/server/intelligence.ts` (the `triggerAnalysis` server fn), after the pipeline runs and insights are saved, call `detectNudgeTriggers` and insert any nudges into `coachNudges`.

Similarly in `apps/wa-bridge/src/analysis/run.ts`.

```ts
import { detectNudgeTriggers } from '@amore-couples/ai';
import { coachNudges } from '@amore-couples/db/schema';

// After pipeline completes and insights are saved:
const nudgeTriggers = detectNudgeTriggers(
  output.healthScore,
  previousHealthScore, // fetch this before the pipeline runs
  output.insights,
);

if (nudgeTriggers.length > 0) {
  await db.insert(coachNudges).values(
    nudgeTriggers.map(n => ({
      coupleId: couple.id,
      trigger: n.trigger,
      message: n.message,
    })),
  );
}
```

**Step 3: Verify build**

Run: `pnpm run build`

**Step 4: Commit**

```bash
git add packages/ai/src/orchestrate.ts apps/web/src/server/intelligence.ts apps/wa-bridge/src/analysis/run.ts
git commit -m "feat: add proactive nudge detection after analysis — score drops, conflicts, milestones"
```

---

## Phase 8: Schema Push & Verification

### Task 8.1: Push schema to local DB and verify

**Step 1: Push schema**

Run: `cd packages/db && npx drizzle-kit push`
Expected: 4 new tables created

**Step 2: Start dev server**

Run: `pnpm run dev:restart`

**Step 3: Verify coach sidebar opens**

1. Open the app in browser
2. Click the brain icon in the nav (desktop) or the FAB (mobile)
3. Coach sidebar should slide open
4. Type a message — it should stream back a response
5. Close and reopen — message history should be preserved
6. Click thread history — should show the thread with auto-generated title

**Step 4: Verify nudge badge (manual test)**

Insert a test nudge directly:
```sql
INSERT INTO coach_nudges (id, couple_id, trigger, message, dismissed, created_at)
VALUES (gen_random_uuid(), '<couple-id>', 'score_drop', 'Test nudge: your score dropped', false, NOW());
```
Reload page — brain icon should show red badge dot.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: coach sidebar integration fixes"
```

---

## Phase 9: Deploy to Railway

### Task 9.1: Push schema to production DB and deploy

**Step 1: Push schema to prod**

Run: `cd packages/db && DATABASE_URL="<prod-public-url>" npx drizzle-kit push`
Expected: 4 tables created on production DB

**Step 2: Push to main**

Run: `git push origin main`
Expected: Railway auto-deploys both services

**Step 3: Verify on production**

1. Open https://web-production-60c2.up.railway.app
2. Navigate to dashboard
3. Click coach icon — sidebar should open
4. Send a message — should stream a response
5. Check thread history works

**Step 4: Commit any prod fixes if needed**

---

## Summary of Files

| Action | File |
|--------|------|
| Modify | `packages/db/src/schema.ts` — 4 new tables |
| Create | `packages/ai/src/coach-conversation.ts` — streaming engine, classifier, memory extraction |
| Modify | `packages/ai/src/index.ts` — export new module |
| Modify | `packages/ai/src/orchestrate.ts` — nudge detection |
| Create | `apps/web/src/server/coach.ts` — server functions |
| Create | `apps/web/server/routes/sse/coach.ts` — SSE streaming route |
| Create | `apps/web/src/hooks/use-coach.ts` — frontend hook |
| Create | `apps/web/src/routes/_authenticated/-components/coach-sidebar.tsx` — sidebar component |
| Modify | `apps/web/src/routes/_authenticated/-components/nav.tsx` — coach toggle |
| Modify | `apps/web/src/routes/_authenticated.tsx` — layout integration |
| Modify | `apps/web/src/server/intelligence.ts` — nudge insertion |
| Modify | `apps/wa-bridge/src/analysis/run.ts` — nudge insertion |
