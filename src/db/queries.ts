import { cache } from "react";
import { desc, eq, count } from "drizzle-orm";
import { db } from "./index";
import { jobs, companies, type Job, type Company } from "./schema";

export type JobWithCompany = Job & { company: Company };

/**
 * Single job by slug, with its company. Wrapped in React `cache` so
 * generateMetadata and the page component share one query per request.
 */
export const getJobBySlug = cache(
  async (slug: string): Promise<JobWithCompany | null> => {
    const rows = await db
      .select()
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.slug, slug))
      .limit(1);
    if (rows.length === 0) return null;
    return { ...rows[0].jobs, company: rows[0].companies };
  },
);

/** Featured roles, newest first — the home "High-signal roles" slots. */
export async function getFeaturedJobs(limit = 3): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.isFeatured, true))
    .orderBy(desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Newest roles — the home "Latest roles" feed. */
export async function getLatestJobs(limit = 12): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .orderBy(desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Live counts + freshest index time for the hero counter. */
export async function getHomeStats(): Promise<{
  jobs: number;
  companies: number;
  lastIndexedAt: Date | null;
}> {
  const [[jobAgg], [companyAgg], [recent]] = await Promise.all([
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(companies),
    db
      .select({ indexedAt: jobs.indexedAt })
      .from(jobs)
      .orderBy(desc(jobs.indexedAt))
      .limit(1),
  ]);
  return {
    jobs: jobAgg?.value ?? 0,
    companies: companyAgg?.value ?? 0,
    lastIndexedAt: recent?.indexedAt ?? null,
  };
}
