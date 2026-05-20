ALTER TABLE "companies" ADD COLUMN "hq" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "ecosystems" jsonb DEFAULT '[]'::jsonb NOT NULL;