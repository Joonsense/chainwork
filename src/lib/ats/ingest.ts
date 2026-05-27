/**
 * ATS ingest orchestrator.
 *
 * For each company in the registry:
 *  1. Fetch jobs from Greenhouse or Lever
 *  2. Upsert the company row (by slug)
 *  3. For each job: insert if new (source + external_id), skip if exists
 *
 * Runs inside the /api/cron/ingest-jobs endpoint (Vercel Cron).
 * Also callable manually via that endpoint with the CRON_SECRET.
 */

import { db } from "@/db";
import { companies, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { COMPANY_REGISTRY } from "./companies";
import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchLeverJobs } from "./lever";
import { mapGreenhouseJob, mapLeverJob, mapCompany } from "./mapper";

export interface IngestResult {
  companiesProcessed: number;
  companiesSkipped: number; // 404 / no jobs
  jobsNew: number;
  jobsSkipped: number; // already exists
  errors: number;
  durationMs: number;
}

export async function runATSIngest(): Promise<IngestResult> {
  const start = Date.now();
  let companiesProcessed = 0;
  let companiesSkipped = 0;
  let jobsNew = 0;
  let jobsSkipped = 0;
  let errors = 0;

  for (const company of COMPANY_REGISTRY) {
    try {
      /* 1. Fetch raw jobs from ATS ── */
      type RawJob = { id: string | number; [k: string]: unknown };
      let rawJobs: RawJob[] | null = null;

      if (company.atsType === "greenhouse") {
        const res = await fetchGreenhouseJobs(company.atsSlug);
        rawJobs = res as RawJob[] | null;
      } else if (company.atsType === "lever") {
        const res = await fetchLeverJobs(company.atsSlug);
        rawJobs = res as RawJob[] | null;
      }

      if (!rawJobs || rawJobs.length === 0) {
        companiesSkipped++;
        continue;
      }

      companiesProcessed++;

      /* 2. Upsert company row ── */
      const companyData = mapCompany(company);

      const [existingCompany] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, company.slug))
        .limit(1);

      let companyId: string;

      if (existingCompany) {
        companyId = existingCompany.id;
        // Update focus / ecosystems in case they changed
        await db
          .update(companies)
          .set({
            focus: companyData.focus,
            ecosystems: companyData.ecosystems,
            website: companyData.website,
          })
          .where(eq(companies.id, companyId));
      } else {
        const [inserted] = await db
          .insert(companies)
          .values(companyData)
          .returning({ id: companies.id });
        companyId = inserted.id;
      }

      /* 3. Process each job ── */
      for (const raw of rawJobs) {
        try {
          const externalId = String(raw.id);

          // Check dedup
          const [existing] = await db
            .select({ id: jobs.id })
            .from(jobs)
            .where(
              and(
                eq(jobs.source, company.atsType),
                eq(jobs.externalId, externalId),
              ),
            )
            .limit(1);

          if (existing) {
            jobsSkipped++;
            continue;
          }

          // Map and insert
          const jobData =
            company.atsType === "greenhouse"
              ? mapGreenhouseJob(
                  raw as unknown as Parameters<typeof mapGreenhouseJob>[0],
                  company,
                  companyId,
                )
              : mapLeverJob(
                  raw as unknown as Parameters<typeof mapLeverJob>[0],
                  company,
                  companyId,
                );

          await db.insert(jobs).values(jobData);
          jobsNew++;
        } catch (jobErr) {
          console.error(
            `[ingest] job error for ${company.slug}/${raw.id}:`,
            jobErr,
          );
          errors++;
        }
      }
    } catch (companyErr) {
      console.error(`[ingest] company error for ${company.slug}:`, companyErr);
      errors++;
    }
  }

  return {
    companiesProcessed,
    companiesSkipped,
    jobsNew,
    jobsSkipped,
    errors,
    durationMs: Date.now() - start,
  };
}
