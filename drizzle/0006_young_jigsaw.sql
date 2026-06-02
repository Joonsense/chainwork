CREATE TABLE "job_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitter_email" text NOT NULL,
	"data" jsonb NOT NULL,
	"note" text,
	"published_job_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "job_submissions" ADD CONSTRAINT "job_submissions_published_job_id_jobs_id_fk" FOREIGN KEY ("published_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_submissions_status_idx" ON "job_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_submissions_created_at_idx" ON "job_submissions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "jobs_view_count_idx" ON "jobs" USING btree ("view_count");