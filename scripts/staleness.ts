/**
 * Staleness audit: how many DB jobs are NO LONGER in their company's live ATS
 * feed (i.e. closed reqs we still show). Read-only.
 * Usage: node --env-file=.env --import tsx scripts/staleness.ts
 */
import { db } from "@/db";
import { jobs, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { COMPANY_REGISTRY } from "@/lib/ats/companies";
import { fetchGreenhouseJobs } from "@/lib/ats/greenhouse";
import { fetchLeverJobs } from "@/lib/ats/lever";
import { fetchAshbyJobs } from "@/lib/ats/ashby";
import { fetchWorkableJobs } from "@/lib/ats/workable";

async function liveIds(c: (typeof COMPANY_REGISTRY)[number]): Promise<Set<string> | null> {
  let raw: Array<Record<string, unknown>> | null = null;
  if (c.atsType === "greenhouse") raw = (await fetchGreenhouseJobs(c.atsSlug)) as unknown as Array<Record<string, unknown>>;
  else if (c.atsType === "lever") raw = (await fetchLeverJobs(c.atsSlug)) as unknown as Array<Record<string, unknown>>;
  else if (c.atsType === "ashby") raw = (await fetchAshbyJobs(c.atsSlug)) as unknown as Array<Record<string, unknown>>;
  else if (c.atsType === "workable") raw = (await fetchWorkableJobs(c.atsSlug)) as unknown as Array<Record<string, unknown>>;
  if (!raw) return null;
  return new Set(
    raw.map((j) => String(c.atsType === "workable" ? j.shortcode : j.id)),
  );
}

async function main() {
  let totalDb = 0;
  let totalStale = 0;
  let feedFailures = 0;
  const offenders: string[] = [];

  for (const c of COMPANY_REGISTRY) {
    const [co] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, c.slug))
      .limit(1);
    if (!co) continue;

    const dbRows = await db
      .select({ ext: jobs.externalId })
      .from(jobs)
      .where(and(eq(jobs.companyId, co.id), eq(jobs.source, c.atsType)));
    if (dbRows.length === 0) continue;
    totalDb += dbRows.length;

    const live = await liveIds(c);
    if (live === null) {
      // feed 404/empty/error → can't confirm; flag whole company as suspect
      feedFailures += dbRows.length;
      offenders.push(`${c.name}: feed unreachable, ${dbRows.length} db jobs UNCONFIRMED`);
      continue;
    }
    const stale = dbRows.filter((r) => r.ext && !live.has(r.ext)).length;
    if (stale > 0) {
      totalStale += stale;
      offenders.push(`${c.name}: ${stale}/${dbRows.length} stale (gone from feed)`);
    }
  }

  console.log("=== STALENESS AUDIT ===");
  console.log(`DB jobs checked: ${totalDb}`);
  console.log(`STALE (closed but still shown): ${totalStale}`);
  console.log(`UNCONFIRMED (feed unreachable): ${feedFailures}`);
  console.log("\nOffenders:");
  offenders.forEach((o) => console.log(`  ${o}`));
  process.exit(0);
}
main();
