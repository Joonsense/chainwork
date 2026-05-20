import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, jobs, savedJobs } from "@/db";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Toggles whether the signed-in user has saved a role. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: "Sign in to save roles." }, { status: 401 });
  }

  const { slug } = await params;
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const [existing] = await db
    .select({ id: savedJobs.id })
    .from(savedJobs)
    .where(and(eq(savedJobs.jobId, job.id), eq(savedJobs.userId, userId)))
    .limit(1);

  if (existing) {
    await db.delete(savedJobs).where(eq(savedJobs.id, existing.id));
    return Response.json({ saved: false });
  }

  await db.insert(savedJobs).values({ jobId: job.id, userId });
  return Response.json({ saved: true });
}
