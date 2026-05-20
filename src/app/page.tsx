import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Hero } from "@/components/home/hero";
import { FilterSidebar } from "@/components/home/filter-sidebar";
import { SidePanels } from "@/components/home/side-panels";
import { FeaturedCard } from "@/components/jobs/featured-card";
import { ListRow } from "@/components/jobs/list-row";
import { BrandLogo } from "@/components/ui/brand-logo";
import { getFeaturedJobs, getLatestJobs, getHomeStats } from "@/db/queries";
import { relativeTime } from "@/lib/format";

/* Data-backed page — read fresh from Neon on every request. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, stats] = await Promise.all([
    getFeaturedJobs(3),
    getLatestJobs(12),
    getHomeStats(),
  ]);
  const indexedLabel = stats.lastIndexedAt
    ? relativeTime(stats.lastIndexedAt)
    : "just now";

  return (
    <div className="min-h-dvh pb-[76px] md:pb-0">
      <GlassNav />

      <main>
        <Hero
          jobCount={stats.jobs}
          companyCount={stats.companies}
          indexedLabel={indexedLabel}
        />

        {/* ── Featured ── */}
        <section className="mx-auto max-w-[1240px] px-5 pb-7 pt-1 md:px-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
                Featured · vetted · this week
              </div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-text-primary md:text-[26px]">
                High-signal roles
              </h2>
            </div>
            <a
              href="/jobs?featured=1"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12px] text-text-bright transition-colors hover:border-line sm:flex"
            >
              View all featured
              <ArrowRight size={11} />
            </a>
          </div>

          <div className="cw-no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3.5 md:overflow-visible md:px-0 md:pb-0">
            {featured.map((job, i) => (
              <div
                key={job.id}
                className="min-w-[82%] sm:min-w-[55%] md:min-w-0"
              >
                <FeaturedCard job={job} accent={i === 0} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Body: filters · latest feed · side panels ── */}
        <section className="mx-auto max-w-[1240px] px-5 pb-16 md:px-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[232px_1fr_300px]">
            <FilterSidebar className="hidden lg:block" />

            <div className="min-w-0">
              <div className="mb-3.5 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
                    Latest · {stats.jobs} roles
                  </div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-text-primary md:text-[26px]">
                    Latest roles
                  </h2>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12px] text-text-bright transition-colors hover:border-line"
                  >
                    <Sparkles size={11} className="text-accent-purple" />
                    Sort by fit
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12px] text-text-bright transition-colors hover:border-line"
                  >
                    Newest
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>

              <div className="cw-card overflow-hidden rounded-2xl">
                {latest.map((job, i) => (
                  <div
                    key={job.id}
                    className={i > 0 ? "border-t border-subtle" : ""}
                  >
                    <ListRow job={job} showBlurb={i < 2} />
                  </div>
                ))}
              </div>
            </div>

            <SidePanels />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-subtle px-5 py-8 md:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo size={14} />
          <p className="font-mono text-[10.5px] text-text-muted">
            © 2026 Chainwork Labs · {stats.jobs} active roles · indexed{" "}
            {indexedLabel} ago
          </p>
        </div>
      </footer>

      <MobileTabBar />
    </div>
  );
}
