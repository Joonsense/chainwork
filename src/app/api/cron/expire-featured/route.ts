import { type NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db, jobs } from "@/db";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Daily cron — un-features any job whose paid slot has lapsed.
 *
 * Only paid slots carry a `featured_until`; seeded/editorial featured
 * rows have it null and are left untouched.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expired = await db
    .update(jobs)
    .set({ isFeatured: false })
    .where(and(eq(jobs.isFeatured, true), lt(jobs.featuredUntil, new Date())))
    .returning({ id: jobs.id });

  console.log(`expire-featured: cleared ${expired.length} lapsed slot(s)`);
  return Response.json({ ok: true, expired: expired.length });
}
