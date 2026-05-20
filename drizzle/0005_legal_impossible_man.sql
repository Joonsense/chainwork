ALTER TABLE "candidate_profiles" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "extracted_skills" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "preferred_ecosystems" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "index_source" text;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "last_indexed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;