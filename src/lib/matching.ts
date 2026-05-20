import type { JobWithCompany } from "@/db/queries";

/**
 * Job ↔ candidate fit scoring (P10).
 *
 * fit = skill-overlap · 0.6 + ecosystem-overlap · 0.3 + salary · 0.1
 *
 * No explicit salary preference is captured from a GitHub/CV profile, so
 * the salary term is a flat baseline — it lifts every score by 10 rather
 * than discriminating between roles.
 */

export type MatchProfile = { skills: string[]; ecosystems: string[] };
export type ScoredJob = { job: JobWithCompany; fit: number };

/** Loose token match — handles "next.js" vs "nextjs", substrings, etc. */
function skillsOverlap(jobSkills: string[], userSkills: string[]): number {
  if (jobSkills.length === 0) return 0;
  const user = userSkills.map((s) => s.toLowerCase());
  const hits = jobSkills.filter((raw) => {
    const s = raw.toLowerCase();
    return user.some((u) => u === s || u.includes(s) || s.includes(u));
  }).length;
  return hits / jobSkills.length;
}

/** 0–100 fit score for one job against a candidate profile. */
export function scoreJob(job: JobWithCompany, profile: MatchProfile): number {
  const skill = skillsOverlap(job.skills, profile.skills);

  const eco =
    job.ecosystems.length === 0
      ? 0.5 // no ecosystem requirement — neutral
      : job.ecosystems.filter((e) => profile.ecosystems.includes(e)).length /
        job.ecosystems.length;

  const salary = 1; // no captured salary preference — flat baseline

  return Math.round((skill * 0.6 + eco * 0.3 + salary * 0.1) * 100);
}

/** All jobs scored and ranked by fit, highest first. */
export function rankMatches(
  jobs: JobWithCompany[],
  profile: MatchProfile,
): ScoredJob[] {
  return jobs
    .map((job) => ({ job, fit: scoreJob(job, profile) }))
    .sort((a, b) => b.fit - a.fit || b.job.postedAt.getTime() - a.job.postedAt.getTime());
}
