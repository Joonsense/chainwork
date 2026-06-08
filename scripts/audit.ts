/**
 * Data-quality / trust audit of the live jobs catalog.
 * Usage: node --env-file=.env --import tsx scripts/audit.ts
 */
import { db } from "@/db";
import { jobs, companies } from "@/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const total = (await db.select({ n: sql<number>`count(*)::int` }).from(jobs))[0].n;
  console.log(`TOTAL JOBS: ${total}\n`);

  const bySource = await db
    .select({ k: jobs.source, n: sql<number>`count(*)::int` })
    .from(jobs)
    .groupBy(jobs.source)
    .orderBy(sql`count(*) desc`);
  console.log("BY SOURCE:");
  bySource.forEach((r) => console.log(`  ${r.k}: ${r.n}`));

  const verified = await db
    .select({ k: jobs.isVerified, n: sql<number>`count(*)::int` })
    .from(jobs)
    .groupBy(jobs.isVerified);
  console.log("\nisVerified:");
  verified.forEach((r) => console.log(`  ${r.k}: ${r.n}`));

  // applyUrl health
  const noUrl = (
    await db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(sql`${jobs.applyUrl} is null or ${jobs.applyUrl} = ''`)
  )[0].n;
  console.log(`\napplyUrl missing/empty: ${noUrl}`);

  const domains = await db
    .select({
      d: sql<string>`split_part(split_part(${jobs.applyUrl}, '/', 3), '?', 1)`,
      n: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .groupBy(sql`1`)
    .orderBy(sql`count(*) desc`);
  console.log("\napplyUrl DOMAINS:");
  domains.forEach((r) => console.log(`  ${r.d || "(none)"}: ${r.n}`));

  // freshness
  const fresh = await db
    .select({
      bucket: sql<string>`case
        when ${jobs.postedAt} > now() - interval '30 days' then '0-30d'
        when ${jobs.postedAt} > now() - interval '90 days' then '30-90d'
        when ${jobs.postedAt} > now() - interval '180 days' then '90-180d'
        when ${jobs.postedAt} > now() - interval '365 days' then '180-365d'
        else '>1y' end`,
      n: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  console.log("\nPOSTED-AT AGE:");
  fresh.forEach((r) => console.log(`  ${r.bucket}: ${r.n}`));

  // duplicates by title+company
  const dupes = await db
    .select({
      title: jobs.title,
      cid: jobs.companyId,
      n: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .groupBy(jobs.title, jobs.companyId)
    .having(sql`count(*) > 1`)
    .orderBy(sql`count(*) desc`)
    .limit(15);
  console.log(`\nDUPLICATE (same title+company) groups: ${dupes.length} (top shown)`);
  dupes.forEach((r) => console.log(`  ${r.n}× ${r.title}`));

  // company count
  const coCount = (await db.select({ n: sql<number>`count(*)::int` }).from(companies))[0].n;
  console.log(`\nCOMPANIES: ${coCount}`);

  // sample applyUrls per source for live-check
  const samples = await db
    .select({ src: jobs.source, url: jobs.applyUrl, title: jobs.title })
    .from(jobs)
    .orderBy(sql`random()`)
    .limit(20);
  console.log("\nSAMPLE applyUrls (for live check):");
  samples.forEach((r) => console.log(`  [${r.src}] ${r.url}`));

  process.exit(0);
}
main();
