ALTER TABLE "job_alerts" ALTER COLUMN "frequency" SET DEFAULT 'daily';--> statement-breakpoint
ALTER TABLE "job_alerts" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD COLUMN "last_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "featured_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_token_unique" UNIQUE("token");