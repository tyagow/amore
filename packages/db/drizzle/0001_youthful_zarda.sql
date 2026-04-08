CREATE TABLE "chat_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"couple_id" uuid,
	"filename" varchar(255) NOT NULL,
	"message_count" integer NOT NULL,
	"date_range_start" timestamp,
	"date_range_end" timestamp,
	"sender_names" jsonb NOT NULL,
	"user_sender_name" varchar(255),
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"source_thread_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"context_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_nudges" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid NOT NULL,
	"trigger" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid,
	"user_id" text,
	"title" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"content" jsonb NOT NULL,
	"extracted_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"mood" varchar(20) NOT NULL,
	"note" text,
	"question" text NOT NULL,
	"answer" text,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_checkin_date" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"feature" varchar(50) NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_score_history" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"summary" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wa_message_id" varchar(255) NOT NULL,
	"couple_id" uuid NOT NULL,
	"data" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"couple_id" uuid,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"source_id" text,
	"delivered_at" timestamp,
	"clicked_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mood_alerts" boolean DEFAULT true NOT NULL,
	"coach_nudges" boolean DEFAULT true NOT NULL,
	"score_drops" boolean DEFAULT true NOT NULL,
	"milestones" boolean DEFAULT true NOT NULL,
	"goal_updates" boolean DEFAULT true NOT NULL,
	"weekly_digest" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"quiet_start" varchar(5),
	"quiet_end" varchar(5),
	"timezone" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"status" varchar(50) DEFAULT 'inactive' NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_type" varchar(20);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "chat_exports" ADD CONSTRAINT "chat_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_exports" ADD CONSTRAINT "chat_exports_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_memory" ADD CONSTRAINT "coach_memory_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_memory" ADD CONSTRAINT "coach_memory_source_thread_id_coach_threads_id_fk" FOREIGN KEY ("source_thread_id") REFERENCES "public"."coach_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_thread_id_coach_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."coach_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_nudges" ADD CONSTRAINT "coach_nudges_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_threads" ADD CONSTRAINT "coach_threads_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_threads" ADD CONSTRAINT "coach_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_entities" ADD CONSTRAINT "couple_entities_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_streaks" ADD CONSTRAINT "engagement_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_score_history" ADD CONSTRAINT "health_score_history_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_media" ADD CONSTRAINT "message_media_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_exports_user_idx" ON "chat_exports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_memory_couple_idx" ON "coach_memory" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "coach_messages_thread_idx" ON "coach_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "coach_nudges_couple_idx" ON "coach_nudges" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "coach_threads_couple_idx" ON "coach_threads" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "coach_threads_user_idx" ON "coach_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_checkins_couple_idx" ON "daily_checkins" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "daily_checkins_date_idx" ON "daily_checkins" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_checkins_user_date_unique" ON "daily_checkins" USING btree ("couple_id","user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "engagement_streaks_user_unique" ON "engagement_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feature_usage_lookup" ON "feature_usage" USING btree ("user_id","feature","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "message_media_wa_id_unique" ON "message_media" USING btree ("couple_id","wa_message_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_idx" ON "notification_deliveries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_type_idx" ON "notification_deliveries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_deliveries_created_idx" ON "notification_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");