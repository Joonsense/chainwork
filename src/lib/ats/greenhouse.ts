/**
 * Greenhouse public job board API fetcher.
 * No auth required — this is the same data powering company career pages.
 * Docs: https://developers.greenhouse.io/job-board.html
 */

export interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string; // ISO 8601
  location: { name: string };
  content: string; // HTML (when content=true)
  departments: Array<{ id: number; name: string }>;
  offices: Array<{ id: number; name: string }>;
  absolute_url: string; // Apply / job detail URL
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

/**
 * Fetch all published jobs from a Greenhouse board.
 * Returns null if the board doesn't exist (404) or on network error.
 */
export async function fetchGreenhouseJobs(
  slug: string,
): Promise<GreenhouseJob[] | null> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 }, // always fresh in server contexts
      headers: { "User-Agent": "chainwork-ingest/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return null; // board not found — skip
    if (!res.ok) {
      console.warn(`[greenhouse] ${slug} → HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as GreenhouseResponse;
    return data.jobs ?? [];
  } catch (err) {
    console.warn(`[greenhouse] ${slug} fetch failed:`, err);
    return null;
  }
}
