import {
  pgTable, uuid, varchar, text, timestamp, integer,
  real, boolean, jsonb, index, uniqueIndex, primaryKey, date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ── Push Subscriptions ──────────────────────────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
}, (table) => [
  index('push_subscriptions_user_idx').on(table.userId),
])

// ── Notification Preferences ────────────────────────────

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  moodAlerts: boolean('mood_alerts').notNull().default(true),
  coachNudges: boolean('coach_nudges').notNull().default(true),
  scoreDrops: boolean('score_drops').notNull().default(true),
  milestones: boolean('milestones').notNull().default(true),
  goalUpdates: boolean('goal_updates').notNull().default(true),
  weeklyDigest: boolean('weekly_digest').notNull().default(false),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  quietStart: varchar('quiet_start', { length: 5 }),
  quietEnd: varchar('quiet_end', { length: 5 }),
  timezone: varchar('timezone', { length: 50 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Notification Deliveries (audit log) ─────────────────

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId: uuid('couple_id').references(() => couples.id),
  type: varchar('type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  sourceId: text('source_id'),
  deliveredAt: timestamp('delivered_at'),
  clickedAt: timestamp('clicked_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('notification_deliveries_user_idx').on(table.userId),
  index('notification_deliveries_type_idx').on(table.type),
  index('notification_deliveries_created_idx').on(table.createdAt),
])

// ── Better Auth tables ──────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Couples (the core entity) ───────────────────────────

// NOTE: Application code must ensure userAId < userBId (lexicographic) to prevent duplicate couples (A,B) vs (B,A)
export const couples = pgTable('couples', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  userAId: text('user_a_id').notNull().references(() => users.id),
  userBId: text('user_b_id').notNull().references(() => users.id),
  whatsappJid: varchar('whatsapp_jid', { length: 50 }),
  healthScore: integer('health_score'),
  lastAnalyzed: timestamp('last_analyzed'),
  messagesSinceAnalysis: integer('messages_since_analysis').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('couples_users_unique').on(table.userAId, table.userBId),
  index('couples_user_a_idx').on(table.userAId),
  index('couples_user_b_idx').on(table.userBId),
])

// ── Connection Requests ─────────────────────────────────

export const connectionRequests = pgTable('connection_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: text('from_user_id').notNull().references(() => users.id),
  toUserId: text('to_user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('connection_request_unique').on(table.fromUserId, table.toUserId),
])

// ── Messages (from WhatsApp bridge) ─────────────────────

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  waMessageId: varchar('wa_message_id', { length: 255 }),
  senderId: text('sender_id').notNull().references(() => users.id),
  text: text('text'),
  timestamp: timestamp('timestamp').notNull(),
  sentiment: real('sentiment'),
  isMedia: boolean('is_media').notNull().default(false),
  mediaType: varchar('media_type', { length: 20 }),
  thumbnail: text('thumbnail'),  // base64 JPEG thumbnail from Baileys
  source: varchar('source', { length: 20 }).notNull().default('baileys'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('messages_couple_idx').on(table.coupleId),
  index('messages_timestamp_idx').on(table.timestamp),
  uniqueIndex('messages_wa_id_unique')
    .on(table.coupleId, table.waMessageId)
    .where(sql`wa_message_id IS NOT NULL`),
])

// ── Message Media (full-resolution media files) ──────────
export const messageMedia = pgTable('message_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  waMessageId: varchar('wa_message_id', { length: 255 }).notNull(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  data: text('data').notNull(),          // base64-encoded media binary
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),  // original size in bytes
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('message_media_wa_id_unique')
    .on(table.coupleId, table.waMessageId),
])

// ── Mood States ─────────────────────────────────────────

export const moodStates = pgTable('mood_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  userId: text('user_id').notNull().references(() => users.id),
  mood: varchar('mood', { length: 20 }).notNull(),
  source: varchar('source', { length: 20 }).notNull().default('manual'),
  visibility: varchar('visibility', { length: 20 }).notNull().default('visible'),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (table) => [
  index('mood_states_couple_idx').on(table.coupleId),
  index('mood_states_user_idx').on(table.userId),
  index('mood_states_created_idx').on(table.createdAt),
])

// ── Couple Goals ────────────────────────────────────────

export const coupleGoals = pgTable('couple_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  source: varchar('source', { length: 20 }).notNull().default('user'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  suggestedBy: text('suggested_by').references(() => users.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('couple_goals_couple_idx').on(table.coupleId),
])

// ── Insights ────────────────────────────────────────────

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  type: varchar('type', { length: 50 }).notNull(),
  content: jsonb('content').notNull(),
  severity: varchar('severity', { length: 20 }),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
}, (table) => [
  index('insights_couple_idx').on(table.coupleId),
  index('insights_type_idx').on(table.type),
])

// ── User Relationship Profiles ──────────────────────────

export const userRelationshipProfiles = pgTable('user_relationship_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  userId: text('user_id').notNull().references(() => users.id),
  loveLanguages: jsonb('love_languages'),
  communicationStyle: jsonb('communication_style'),
  interests: jsonb('interests'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('user_profile_couple_user_unique').on(table.coupleId, table.userId),
])

// ── WhatsApp Auth (for Baileys) ─────────────────────────

export const waSessions = pgTable('wa_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  bridgeSessionId: text('bridge_session_id').notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('disconnected'),
  lastConnected: timestamp('last_connected'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const waAuthCreds = pgTable('wa_auth_creds', {
  sessionId: text('session_id').primaryKey(),
  creds: jsonb('creds').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const waAuthKeys = pgTable('wa_auth_keys', {
  sessionId: text('session_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  id: varchar('id', { length: 255 }).notNull(),
  value: jsonb('value'),
}, (table) => [
  primaryKey({ columns: [table.sessionId, table.type, table.id] }),
])

// ── Health Score History ──────────────────────────────

export const healthScoreHistory = pgTable('health_score_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  score: integer('score').notNull(),
  summary: text('summary'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
})

// ── Couple Entities ───────────────────────────────────

export const coupleEntities = pgTable('couple_entities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  type: varchar('type', { length: 30 }).notNull(),
  content: jsonb('content').notNull(),
  extractedAt: timestamp('extracted_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
})

// ── Coach ──────────────────────────────────────────────

export const coachThreads = pgTable('coach_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('coach_threads_couple_idx').on(table.coupleId),
  index('coach_threads_user_idx').on(table.userId),
])

export const coachMessages = pgTable('coach_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').notNull().references(() => coachThreads.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  contextSnapshot: jsonb('context_snapshot'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_messages_thread_idx').on(table.threadId),
])

export const coachMemory = pgTable('coach_memory', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull(),
  content: text('content').notNull(),
  sourceThreadId: text('source_thread_id').references(() => coachThreads.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_memory_couple_idx').on(table.coupleId),
])

export const coachNudges = pgTable('coach_nudges', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  trigger: varchar('trigger', { length: 50 }).notNull(),
  message: text('message').notNull(),
  dismissed: boolean('dismissed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coach_nudges_couple_idx').on(table.coupleId),
])

// ── Chat Exports ──────────────────────────────────────

export const chatExports = pgTable('chat_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  coupleId: uuid('couple_id').references(() => couples.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  messageCount: integer('message_count').notNull(),
  dateRangeStart: timestamp('date_range_start'),
  dateRangeEnd: timestamp('date_range_end'),
  senderNames: jsonb('sender_names').notNull(),
  userSenderName: varchar('user_sender_name', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('processing'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('chat_exports_user_idx').on(table.userId),
])

// ── Daily Check-ins ────────────────────────────────────

export const dailyCheckins = pgTable('daily_checkins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  mood: varchar('mood', { length: 20 }).notNull(),
  note: text('note'),
  question: text('question').notNull(),
  answer: text('answer'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('daily_checkins_couple_idx').on(table.coupleId),
  index('daily_checkins_date_idx').on(table.date),
  uniqueIndex('daily_checkins_user_date_unique').on(table.coupleId, table.userId, table.date),
])

// ── Engagement Streaks ─────────────────────────────────

export const engagementStreaks = pgTable('engagement_streaks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastCheckinDate: date('last_checkin_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('engagement_streaks_user_unique').on(table.userId),
])

// ── Feature Usage (monetization gating) ───────────────

export const featureUsage = pgTable('feature_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: varchar('feature', { length: 50 }).notNull(),
  usedAt: timestamp('used_at').notNull().defaultNow(),
}, (table) => [
  index('idx_feature_usage_lookup').on(table.userId, table.feature, table.usedAt),
])

// ── Subscriptions (Stripe, for future Phase 4) ───────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('inactive'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Relations ─────────────────────────────────────────

export const couplesRelations = relations(couples, ({ many }) => ({
  healthScoreHistory: many(healthScoreHistory),
  coupleEntities: many(coupleEntities),
  coachThreads: many(coachThreads),
  coachMemory: many(coachMemory),
  coachNudges: many(coachNudges),
}))

export const healthScoreHistoryRelations = relations(healthScoreHistory, ({ one }) => ({
  couple: one(couples, {
    fields: [healthScoreHistory.coupleId],
    references: [couples.id],
  }),
}))

export const coupleEntitiesRelations = relations(coupleEntities, ({ one }) => ({
  couple: one(couples, {
    fields: [coupleEntities.coupleId],
    references: [couples.id],
  }),
}))

export const coachThreadsRelations = relations(coachThreads, ({ one, many }) => ({
  couple: one(couples, {
    fields: [coachThreads.coupleId],
    references: [couples.id],
  }),
  user: one(users, {
    fields: [coachThreads.userId],
    references: [users.id],
  }),
  messages: many(coachMessages),
}))

export const coachMessagesRelations = relations(coachMessages, ({ one }) => ({
  thread: one(coachThreads, {
    fields: [coachMessages.threadId],
    references: [coachThreads.id],
  }),
}))

export const coachMemoryRelations = relations(coachMemory, ({ one }) => ({
  couple: one(couples, {
    fields: [coachMemory.coupleId],
    references: [couples.id],
  }),
  sourceThread: one(coachThreads, {
    fields: [coachMemory.sourceThreadId],
    references: [coachThreads.id],
  }),
}))

export const coachNudgesRelations = relations(coachNudges, ({ one }) => ({
  couple: one(couples, {
    fields: [coachNudges.coupleId],
    references: [couples.id],
  }),
}))

export const dailyCheckinsRelations = relations(dailyCheckins, ({ one }) => ({
  couple: one(couples, {
    fields: [dailyCheckins.coupleId],
    references: [couples.id],
  }),
  user: one(users, {
    fields: [dailyCheckins.userId],
    references: [users.id],
  }),
}))

export const engagementStreaksRelations = relations(engagementStreaks, ({ one }) => ({
  user: one(users, {
    fields: [engagementStreaks.userId],
    references: [users.id],
  }),
}))
