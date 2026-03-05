import {
  pgTable, uuid, varchar, text, timestamp, integer,
  real, boolean, jsonb, index, uniqueIndex, primaryKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

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
  source: varchar('source', { length: 20 }).notNull().default('baileys'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('messages_couple_idx').on(table.coupleId),
  index('messages_timestamp_idx').on(table.timestamp),
  uniqueIndex('messages_wa_id_unique')
    .on(table.coupleId, table.waMessageId)
    .where(sql`wa_message_id IS NOT NULL`),
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
