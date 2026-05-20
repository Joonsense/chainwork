ALTER TABLE "jobs" ADD COLUMN "nice_to_have" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "one_liner" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "apply_email" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "apply_count" integer DEFAULT 0 NOT NULL;