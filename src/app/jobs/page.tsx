import type { Metadata } from "next";
import { Sparkles, SearchX } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { SidePanels } from "@/components/home/side-panels";
import {
  JobsFilterSidebar,
  FilterGroups,
} from "@/components/filters/jobs-filter-sidebar";
import { MobileFilterSheet } from "@/components/filters/mobile-filter-sheet";
import { ActiveFilters } from "@/components/filters/active-filters";
import { SortControl } from "@/components/filters/filter-controls";
import { JobFeed } from "@/components/jobs/job-feed";
import { searchJobs, getFacetCounts } from "@/db/queries";
import { loadJobsSearchParams, type JobFilters } from "@/lib/jobs-search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All roles · chainwork",
  description:
    "Filter salary-transparent web3 and AI roles by ecosystem, role, seniority, and compensation.",
};

function EmptyState() {
  return (
    <div className="cw-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-glass">
        <SearchX size={20} className="text-text-tertiary" />
      </span>
      <h2 className="mt-4 text-[16px] font-semibold text-text-primary">
        No roles match these filters
      </h2>
      <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-text-secondary">
        Nothing here yet — try broadening your filters or clearing the search.
      </p>
      <a href="/jobs" className="cw-apply mt-5 h-9 px-4 text-[13px]">
        Clear all filters
      </a>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await loadJobsSearchParams(searchParams)) as JobFilters;
  const [result, facets] = await Promise.all([
    searchJobs(sp, { limit: 20, offset: 0 }),
    getFacetCounts(sp),
  ]);
  const filterKey = JSON.stringify(sp);

  return (
    <div className="min-h-dvh pb-16">
      <GlassNav />

      <section className="mx-auto max-w-[1240px] px-5 py-6 md:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[232px_1fr_300px]">
          <JobsFilterSidebar facets={facets} className="hidden lg:block" />

          <div className="min-w-0">
            {/* header */}
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
                  Latest · all roles · {result.total}{" "}
                  {result.total === 1 ? "match" : "matches"}
                </div>
                <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-text-primary md:text-[26px]">
                  All roles
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <MobileFilterSheet>
                  <FilterGroups facets={facets} />
                </MobileFilterSheet>
                <button
                  type="button"
                  className="hidden h-9 items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 text-[12px] text-text-bright transition-colors hover:border-line sm:flex"
                >
                  <Sparkles size={11} className="text-accent-purple" />
                  Match for me
                </button>
                <SortControl />
              </div>
            </div>

            <ActiveFilters />

            {result.total === 0 ? (
              <EmptyState />
            ) : (
              <JobFeed
                key={filterKey}
                initialJobs={result.jobs}
                total={result.total}
                filters={sp}
              />
            )}
          </div>

          <SidePanels className="hidden md:flex" />
        </div>
      </section>
    </div>
  );
}
