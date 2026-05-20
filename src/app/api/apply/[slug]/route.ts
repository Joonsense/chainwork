import { eq, sql } from "drizzle-orm";
import { db, jobs } from "@/db";

/**
 * Quick-apply intent counter. The command palette opens the external
 * apply URL itself (new tab); this just records the click.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const updated = await db
    .update(jobs)
    .set({ applyCount: sql`${jobs.applyCount} + 1` })
    .where(eq(jobs.slug, slug))
    .returning({ slug: jobs.slug });

  if (updated.length === 0) {
    return new Response("Job not found", { status: 404 });
  }
  return Response.json({ ok: true });
}
