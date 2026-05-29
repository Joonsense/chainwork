import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, companies, jobs } from "./index";
import { buildJobPostingJsonLd } from "../lib/job-json-ld";

/**
 * One-off, idempotent backfill: recompute jobs.json_ld for every existing
 * row using the corrected, unified builder (omit baseSalary when undisclosed,
 * correct remote vs on-site jobLocation, stamp validThrough).
 *
 * Run: `pnpm tsx src/db/backfill-jsonld.ts`
 */
async function main() {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id));

  console.log(`Recomputing JSON-LD for ${rows.length} rows…`);
  let updated = 0;

  for (const { jobs: job, companies: company } of rows) {
    const jsonLd = buildJobPostingJsonLd({
      title: job.title,
      description: job.descriptionMd.slice(0, 1500),
      slug: job.slug,
      postedAt: job.postedAt,
      employmentType: job.employmentType,
      remoteScope: job.remoteScope,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      company: { name: company.name, website: company.website },
    });

    await db.update(jobs).set({ jsonLd }).where(eq(jobs.id, job.id));
    updated += 1;
    if (updated % 50 === 0) console.log(`  …${updated}/${rows.length}`);
  }

  console.log(`Done. Updated ${updated} rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
