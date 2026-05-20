"use server";

import { searchJobs, type JobWithCompany } from "@/db/queries";
import type { JobFilters } from "@/lib/jobs-search-params";

/** Next page of results for the "Load more" button. */
export async function loadMoreJobs(
  filters: JobFilters,
  offset: number,
): Promise<JobWithCompany[]> {
  const { jobs } = await searchJobs(filters, { limit: 20, offset });
  return jobs;
}
