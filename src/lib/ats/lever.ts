/**
 * Lever public postings API fetcher.
 * No auth required — same data as lever.co/company/jobs.
 * Docs: https://hire.lever.co/developer/postings
 */

export interface LeverJob {
  id: string; // UUID
  text: string; // Job title
  state: string; // "published" | "closed" | "draft"
  categories: {
    commitment?: string; // "Full-time" | "Part-time" | "Contract" etc.
    department?: string;
    level?: string; // seniority
    location?: string;
    team?: string;
  };
  description: string; // HTML
  descriptionPlain: string; // plain text
  lists: Array<{
    text: string; // e.g. "Responsibilities", "Requirements"
    content: string; // HTML list items
  }>;
  additional: string; // HTML — nice to have / benefits / etc.
  hostedUrl: string; // canonical job page
  applyUrl: string;
  createdAt: number; // Unix ms timestamp
}

/**
 * Fetch all published postings from a Lever board.
 * Returns null on 404 or network failure.
 */
export async function fetchLeverJobs(
  slug: string,
): Promise<LeverJob[] | null> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json&state=published`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { "User-Agent": "chainwork-ingest/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[lever] ${slug} → HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    // Lever returns an array directly
    return Array.isArray(data) ? (data as LeverJob[]) : [];
  } catch (err) {
    console.warn(`[lever] ${slug} fetch failed:`, err);
    return null;
  }
}
