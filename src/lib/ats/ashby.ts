/**
 * Ashby public job board API fetcher.
 * No auth required — same data as jobs.ashbyhq.com/company
 * Docs: https://developers.ashbyhq.com/reference/apiposting-job-board-list
 */

export interface AshbyJob {
  id: string; // UUID
  title: string;
  department: string;
  team: string;
  employmentType: string; // "FullTime" | "PartTime" | "Contract" | "Internship"
  location: string;
  secondaryLocations: string[];
  publishedAt: string; // ISO 8601
  isListed: boolean;
  isRemote: boolean;
  workplaceType: string; // "Remote" | "Hybrid" | "OnSite"
  address?: {
    postalAddress?: {
      addressRegion?: string;
      addressCountry?: string;
      addressLocality?: string;
    };
  };
  jobUrl: string;
  applyUrl: string;
  descriptionHtml: string;
  jobType?: string; // sometimes present
  compensationTierSummary?: string; // salary range string if disclosed
}

interface AshbyResponse {
  jobs: AshbyJob[];
  apiVersion?: string;
}

/**
 * Fetch all listed jobs from an Ashby job board.
 * Returns null on 404 or network failure.
 */
export async function fetchAshbyJobs(
  slug: string,
): Promise<AshbyJob[] | null> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { "User-Agent": "chainwork-ingest/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[ashby] ${slug} → HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as AshbyResponse;
    // Filter to only listed jobs
    return (data.jobs ?? []).filter((j) => j.isListed !== false);
  } catch (err) {
    console.warn(`[ashby] ${slug} fetch failed:`, err);
    return null;
  }
}
