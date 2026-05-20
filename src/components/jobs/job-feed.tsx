"use client";

import { useState, useTransition } from "react";
import { ListRow } from "@/components/jobs/list-row";
import { loadMoreJobs } from "@/app/jobs/actions";
import type { JobWithCompany } from "@/db/queries";
import type { JobFilters } from "@/lib/jobs-search-params";

/**
 * Job results list with a "Load more" pager. Mount this with a key derived
 * from the filters so a filter change remounts it with fresh initial data.
 */
export function JobFeed({
  initialJobs,
  total,
  filters,
}: {
  initialJobs: JobWithCompany[];
  total: number;
  filters: JobFilters;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [pending, startTransition] = useTransition();
  const remaining = total - jobs.length;

  function loadMore() {
    startTransition(async () => {
      const more = await loadMoreJobs(filters, jobs.length);
      setJobs((prev) => [...prev, ...more]);
    });
  }

  return (
    <>
      <div className="cw-card overflow-hidden rounded-2xl">
        {jobs.map((job, i) => (
          <div key={job.id} className={i > 0 ? "border-t border-subtle" : ""}>
            <ListRow job={job} showBlurb={i < 2} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="flex h-10 items-center rounded-lg border border-line bg-glass px-5 text-[13px] font-medium text-text-bright transition-colors hover:border-strong disabled:opacity-50"
          >
            {pending ? "Loading…" : `Load more · ${remaining} left`}
          </button>
        ) : (
          <span className="text-[11px] text-text-tertiary">
            End of results
          </span>
        )}
        <span className="font-mono text-[10.5px] text-text-muted">
          {jobs.length} of {total} shown
        </span>
      </div>
    </>
  );
}
