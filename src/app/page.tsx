import { ArrowRight, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Hero } from "@/components/home/hero";
import { McpCallout } from "@/components/home/mcp-callout";
import { FilterSidebar } from "@/components/home/filter-sidebar";
import { SidePanels } from "@/components/home/side-panels";
import { FeaturedCard } from "@/components/jobs/featured-card";
import { ListRow } from "@/components/jobs/list-row";
import { BrandLogo } from "@/components/ui/brand-logo";
import { EcoBadge } from "@/components/ui/eco-badge";
import { getFeaturedJobs, getLatestJobs, getHomeStats, getTrendingJobs } from "@/db/queries";
import { formatSalary, relativeTime } from "@/lib/format";

/* Data-backed page — prerendered + ISR, revalidated hourly (catalogue updates
   daily). force-static caches the Neon reads; force-dynamic previously made
   every crawler hit a full uncached DB render. */
export const dynamic = "force-static";
export const revalidate = 3600;

export default async function HomePage() {
  const [featured, latest, stats, trending] = await Promise.all([
    getFeaturedJobs(3),
    getLatestJobs(12),
    getHomeStats(),
    getTrendingJobs(4),
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

        <McpCallout />

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

        {/* ── Pulse / Trending banner ── */}
        {trending.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-5 pb-7 md:px-6">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-accent-orange" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
                  Trending · most viewed
                </span>
                <span className="rounded-full bg-accent-orange/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-accent-orange">
                  Hot
                </span>
              </div>
              <a
                href="/pulse"
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12px] text-text-bright transition-colors hover:border-line sm:flex"
              >
                Hiring Pulse
                <ArrowRight size={11} />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {trending.map((job) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 transition-colors hover:border-line hover:bg-glass"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
                    style={{ background: job.company.logoBg, color: job.company.logoFg }}
                  >
                    {job.company.logoText}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-text-primary">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {job.company.name} · {formatSalary(job.salaryMin, job.salaryMax)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {job.ecosystems.slice(0, 1).map((e) => (
                      <EcoBadge key={e} ecosystem={e} />
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Body: filters · latest feed · side panels ── */}
        <section className="mx-auto max-w-[1240px] px-5 pb-16 md:px-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[232px_1fr_300px]">
            <FilterSidebar className="hidden lg:block" />

            <div className="min-w-0">
              <div className="mb-3.5 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
                    Salary-transparent first · {stats.jobs} roles
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

      <MobileTabBar />
    </div>
  );
}
