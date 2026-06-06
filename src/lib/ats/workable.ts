/**
 * Workable public job board API fetcher.
 * No auth required — this is the same widget API powering Workable-hosted
 * career pages (the private /spi/v3/jobs endpoint needs a token; this does not).
 * Endpoint: https://apply.workable.com/api/v1/widget/accounts/{slug}?details=true
 */

export interface WorkableJob {
  shortcode: string; // stable unique id within the account
  title: string;
  department: string | null;
  employment_type: string | null; // "Full-time", "Part-time", ...
  telecommuting: boolean; // remote flag
  city: string | null;
  country: string | null;
  state: string | null;
  locations?: Array<{
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
  }>;
  published_on: string; // YYYY-MM-DD
  created_at?: string;
  url: string; // public job detail URL
  application_url: string; // direct apply URL
  description?: string; // HTML (only when details=true)
}

interface WorkableResponse {
  name: string;
  description: string;
  jobs: WorkableJob[];
}

/**
 * Fetch all published jobs from a Workable account.
 * Returns null if the account doesn't exist (404) or on network error.
 */
export async function fetchWorkableJobs(
  slug: string,
): Promise<WorkableJob[] | null> {
  const url = `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 }, // always fresh in server contexts
      headers: { "User-Agent": "chainwork-ingest/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return null; // account not found — skip
    if (!res.ok) {
      console.warn(`[workable] ${slug} → HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as WorkableResponse;
    return data.jobs ?? [];
  } catch (err) {
    console.warn(`[workable] ${slug} fetch failed:`, err);
    return null;
  }
}
