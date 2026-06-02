import { getAllJobs } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/**
 * Public, CC0 dataset of every live ChainWork role. The crypto boards keep
 * their data closed; we hand it out as clean JSON so researchers, agents,
 * and other tools can cite and reuse it — which earns links and LLM
 * citations back. No auth, cached hourly.
 */
export async function GET() {
  const jobs = await getAllJobs();
  const records = jobs.map((j) => ({
    slug: j.slug,
    title: j.title,
    company: j.company.name,
    company_website: j.company.website,
    role_category: j.roleCategory,
    seniority: j.seniority,
    employment_type: j.employmentType,
    location: j.location,
    remote_scope: j.remoteScope,
    salary_min_usd: j.salaryMin || null,
    salary_max_usd: j.salaryMax || null,
    has_token_or_equity: j.hasTokenEquity,
    ecosystems: j.ecosystems,
    skills: j.skills,
    posted_at: j.postedAt.toISOString(),
    url: `${SITE_URL}/jobs/${j.slug}`,
    apply_url: j.applyUrl ?? `${SITE_URL}/jobs/${j.slug}`,
  }));

  return Response.json(
    {
      dataset: "chainwork-jobs",
      description:
        "Live AI x crypto / web3 engineering roles indexed daily from real ATS feeds.",
      license: "CC0-1.0",
      source: SITE_URL,
      generated_at: new Date().toISOString(),
      count: records.length,
      jobs: records,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
