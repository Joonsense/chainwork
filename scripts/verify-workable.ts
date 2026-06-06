/**
 * One-off verification: run the Workable ingest path only, against the real DB.
 * Usage: node --env-file=.env --import tsx scripts/verify-workable.ts
 */
import { db } from "@/db";
import { companies, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { COMPANY_REGISTRY } from "@/lib/ats/companies";
import { fetchWorkableJobs } from "@/lib/ats/workable";
import { mapWorkableJob, mapCompany } from "@/lib/ats/mapper";

async function main() {
  const workable = COMPANY_REGISTRY.filter((c) => c.atsType === "workable");
  console.log(`Workable companies in registry: ${workable.length}`);
  let totalNew = 0;
  let totalSkip = 0;
  let totalReject = 0;

  for (const company of workable) {
    const raw = await fetchWorkableJobs(company.atsSlug);
    console.log(`  ${company.name} (${company.atsSlug}): ${raw?.length ?? 0} raw jobs`);
    if (!raw || raw.length === 0) continue;

    const companyData = mapCompany(company);
    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, company.slug))
      .limit(1);
    let companyId: string;
    if (existing) {
      companyId = existing.id;
    } else {
      const [ins] = await db
        .insert(companies)
        .values(companyData)
        .returning({ id: companies.id });
      companyId = ins.id;
    }

    for (const j of raw) {
      const externalId = String(j.shortcode);
      const [dupe] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.source, "workable"), eq(jobs.externalId, externalId)))
        .limit(1);
      if (dupe) {
        totalSkip++;
        continue;
      }
      const mapped = mapWorkableJob(j, company, companyId);
      if (!mapped) {
        totalReject++;
        continue;
      }
      await db.insert(jobs).values(mapped);
      totalNew++;
      console.log(`    + ${mapped.title} [${mapped.roleCategory}] ${mapped.location}`);
    }
  }
  console.log(`\nDone. new=${totalNew} skipped=${totalSkip} rejected(non-eng)=${totalReject}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
