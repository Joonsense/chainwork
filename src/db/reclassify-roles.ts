import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, jobs } from "./index";
import { inferRoleCategory, isNonEngineeringRole } from "../lib/ats/mapper";

/**
 * One-shot backfill - rebalance the over-stuffed "Protocol" bucket.
 *
 * The ATS ingest dedups by (source, external_id) and SKIPS existing rows, so
 * jobs ingested in P11 (when "Protocol" was the catch-all) were never
 * reclassified after P12c.2 narrowed Protocol + added a Backend catch-all.
 * Result: Protocol holds ~60% of all roles, which makes the P16 collection
 * pages lopsided and miscategorises generic engineering roles.
 *
 * Conservative scope - we ONLY touch rows currently tagged "Protocol", and
 * only move one when re-running the (now-narrowed) title classifier yields a
 * DIFFERENT, more-specific category. Rows already in a specific category are
 * never touched, so there is no regression risk for correctly-tagged jobs.
 *
 *   pnpm tsx src/db/reclassify-roles.ts            (dry run, default)
 *   pnpm tsx src/db/reclassify-roles.ts --apply    (write changes)
 */
async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await db
    .select({ id: jobs.id, title: jobs.title, category: jobs.roleCategory })
    .from(jobs);

  const total = rows.length;
  const before: Record<string, number> = {};
  for (const r of rows) before[r.category] = (before[r.category] ?? 0) + 1;

  // (A) Non-engineering rows that slipped past the ingest filter → DELETE.
  const nonEng = rows.filter((r) => isNonEngineeringRole(r.title));
  const nonEngIds = new Set(nonEng.map((r) => r.id));

  // (B) Surviving Protocol rows that reclassify to something more specific.
  const survivors = rows.filter((r) => !nonEngIds.has(r.id));
  const changes = survivors
    .filter((r) => r.category === "Protocol")
    .map((r) => ({ id: r.id, title: r.title, next: inferRoleCategory(r.title) }))
    .filter((r) => r.next !== "Protocol");

  // Projected distribution: drop non-eng, then apply reclassification.
  const after: Record<string, number> = {};
  for (const r of survivors) after[r.category] = (after[r.category] ?? 0) + 1;
  for (const c of changes) {
    after["Protocol"] -= 1;
    after[c.next] = (after[c.next] ?? 0) + 1;
  }

  const fmt = (d: Record<string, number>) =>
    Object.entries(d)
      .sort((a, b) => b[1] - a[1])
      .map((e) => "  " + String(e[1]).padStart(4) + "  " + e[0])
      .join("\n");

  console.log("Total jobs: " + total);
  console.log(
    "Non-engineering to DELETE: " + nonEng.length + "  |  Protocol to reclassify: " + changes.length + "\n",
  );
  console.log("BEFORE:\n" + fmt(before));
  console.log("\nAFTER (projected, " + (total - nonEng.length) + " jobs):\n" + fmt(after));

  console.log("\nAll non-engineering rows to DELETE (" + nonEng.length + "):");
  for (const r of nonEng) console.log("  DELETE [" + r.category + "] " + r.title);

  console.log("\nAll reclassifications (" + changes.length + "):");
  for (const c of changes) {
    console.log("  Protocol -> " + c.next.padEnd(18) + " | " + c.title);
  }

  if (!apply) {
    console.log(
      "\n[DRY RUN] No changes written. Re-run with --apply to DELETE " +
        nonEng.length +
        " rows and reclassify " +
        changes.length +
        " rows.",
    );
    return;
  }

  let deleted = 0;
  for (const r of nonEng) {
    await db.delete(jobs).where(eq(jobs.id, r.id));
    deleted++;
  }
  let written = 0;
  for (const c of changes) {
    await db.update(jobs).set({ roleCategory: c.next }).where(eq(jobs.id, c.id));
    written++;
  }
  console.log("\n[APPLIED] Deleted " + deleted + " non-eng rows, reclassified " + written + " rows.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
