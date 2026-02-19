CREATE TYPE "public"."batch_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."risk_flag" AS ENUM('SAFE', 'RISK');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pending', 'processing', 'processed', 'flagged_for_review', 'safe', 'risk');--> statement-breakpoint
CREATE TYPE "public"."supervisor_action" AS ENUM('validated', 'rejected', 'overridden_safe', 'overridden_risk', 'pending_review');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"action" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"status" "batch_status" DEFAULT 'queued' NOT NULL,
	"total_sessions" integer NOT NULL,
	"processed_sessions" integer DEFAULT 0 NOT NULL,
	"failed_sessions" integer DEFAULT 0 NOT NULL,
	"session_ids" jsonb NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_log" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fellows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"age" integer,
	"supervisor_id" uuid NOT NULL,
	"group_ids" jsonb DEFAULT '[]'::jsonb,
	"cohort" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fellows_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fellow_id" uuid NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"group_id" text NOT NULL,
	"session_date" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"assigned_concept" text NOT NULL,
	"transcript" text NOT NULL,
	"transcript_word_count" integer DEFAULT 0 NOT NULL,
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"ai_analysis" jsonb DEFAULT 'null'::jsonb,
	"ai_confidence_score" real,
	"ai_processed_at" timestamp,
	"supervisor_action" "supervisor_action",
	"supervisor_note" text,
	"supervisor_reviewed_at" timestamp,
	"supervisor_reviewed_by" uuid,
	"batch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervisors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"tier" integer DEFAULT 2 NOT NULL,
	"organization" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supervisors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_supervisor_id_supervisors_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_supervisor_id_supervisors_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fellows" ADD CONSTRAINT "fellows_supervisor_id_supervisors_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_fellow_id_fellows_id_fk" FOREIGN KEY ("fellow_id") REFERENCES "public"."fellows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_supervisor_id_supervisors_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_supervisor_reviewed_by_supervisors_id_fk" FOREIGN KEY ("supervisor_reviewed_by") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_jobs_supervisor_idx" ON "batch_jobs" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "batch_jobs_status_idx" ON "batch_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fellows_supervisor_idx" ON "fellows" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "sessions_fellow_idx" ON "sessions" USING btree ("fellow_id");--> statement-breakpoint
CREATE INDEX "sessions_supervisor_idx" ON "sessions" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_date_idx" ON "sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "sessions_batch_idx" ON "sessions" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "supervisors_email_idx" ON "supervisors" USING btree ("email");