import { getServerSession } from "@/lib/auth";
import { getMatchProfile } from "@/lib/profile-index";
import { getAllJobs } from "@/db/queries";
import { rankMatches } from "@/lib/matching";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * AI matches for the signed-in user (P10). Indexes the GitHub profile
 * inline when stale, then ranks every job by fit. Slow on the first call
 * of the day, cached (lastIndexedAt) for 24h after.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ status: "anon" });

  const result = await getMatchProfile(session.user);
  if (result.status === "no-source") {
    return Response.json({ status: "no-source" });
  }

  const { profile } = result;
  const ranked = rankMatches(await getAllJobs(), profile).slice(0, 10);

  return Response.json({
    status: "ready",
    username: profile.username,
    source: profile.source,
    skills: profile.skills.slice(0, 6),
    ecosystems: profile.ecosystems,
    matches: ranked.map(({ job, fit }) => ({
      slug: job.slug,
      title: job.title,
      fit,
      companyName: job.company.name,
      logoText: job.company.logoText,
      logoBg: job.company.logoBg,
      logoFg: job.company.logoFg,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    })),
  });
}
