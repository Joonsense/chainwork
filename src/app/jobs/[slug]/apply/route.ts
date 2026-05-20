import { eq, sql } from "drizzle-orm";
import { db, jobs } from "@/db";

/**
 * Apply click handler. Records intent (apply_count += 1) BEFORE the
 * redirect, so a role still counts even if the applicant bounces off the
 * destination. Redirects 308 to the careers page, or a mailto fallback.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [job] = await db
    .select({ applyUrl: jobs.applyUrl, applyEmail: jobs.applyEmail })
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);

  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  // Increment before redirecting — intent is recorded either way.
  await db
    .update(jobs)
    .set({ applyCount: sql`${jobs.applyCount} + 1` })
    .where(eq(jobs.slug, slug));

  const target =
    job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}` : null);

  if (!target) {
    return new Response("No application link for this role", { status: 404 });
  }

  return new Response(null, { status: 308, headers: { Location: target } });
}
