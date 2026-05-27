import { type NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { isNonEngineeringRole } from "@/lib/ats/mapper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-shot cleanup of historical non-engineering rows that landed before
 * P12c's ingest filter. Idempotent — safe to call multiple times. Uses
 * the same `isNonEngineeringRole` matcher as the ingest path so the
 * "what counts as non-engineering" definition is single-sourced.
 *
 * GET /api/cron/cleanup-non-engineering?key=<CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 547 rows is small enough to evaluate in-memory; the alternative
  // (Postgres regex array) wouldn't share its definition with the
  // TypeScript matcher and would drift over time.
  const all = await db.select({ id: jobs.id, title: jobs.title }).from(jobs);

  const toDelete = all.filter((j) => isNonEngineeringRole(j.title));

  if (toDelete.length === 0) {
    return Response.json({
      ok: true,
      scanned: all.length,
      deleted: 0,
    });
  }

  await db.delete(jobs).where(
    inArray(
      jobs.id,
      toDelete.map((j) => j.id),
    ),
  );

  return Response.json({
    ok: true,
    scanned: all.length,
    deleted: toDelete.length,
    samples: toDelete.slice(0, 10).map((j) => j.title),
  });
}
