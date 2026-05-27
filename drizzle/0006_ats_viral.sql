-- P11: ATS ingest columns + viral mechanics
-- source tracks origin of each job row; external_id deduplicates ATS imports;
-- view_count powers the Trending section and Pulse dashboard.

ALTER TABLE "jobs" ADD COLUMN "source" text NOT NULL DEFAULT 'manual';
ALTER TABLE "jobs" ADD COLUMN "external_id" text;
ALTER TABLE "jobs" ADD COLUMN "view_count" integer NOT NULL DEFAULT 0;

-- Partial unique index: prevents duplicate ATS imports per (source, external_id)
-- NULL external_id rows (manual/seed) are intentionally excluded from this constraint.
CREATE UNIQUE INDEX "jobs_source_external_id_idx"
  ON "jobs" ("source", "external_id")
  WHERE "external_id" IS NOT NULL;

-- Index for trending queries (top by view_count)
CREATE INDEX "jobs_view_count_idx" ON "jobs" ("view_count" DESC);
