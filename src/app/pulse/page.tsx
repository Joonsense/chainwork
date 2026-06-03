import type { Metadata } from "next";
import { TrendingUp, Zap, Users, Briefcase, Share2, ArrowRight, BarChart3 } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { EcoBadge } from "@/components/ui/eco-badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CompanyLogo } from "@/components/ui/company-logo";
import { getPulseStats, getTrendingJobs } from "@/db/queries";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { formatSalary, relativeTime } from "@/lib/format";

export const dynamic = "force-static";
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Crypto Hiring Pulse",
  description:
    "Real-time snapshot of who's hiring in crypto and Web3. Ecosystem breakdown, top companies, trending roles — updated daily.",
  openGraph: {
    title: "Crypto Hiring Pulse",
    description:
      "Who's hiring in crypto right now? Live data across crypto and Web3 companies — ecosystem breakdown, top roles, salary signals.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ── helpers ─────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? "border-brand/30 bg-brand/5"
          : "border-subtle bg-surface"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon
          size={15}
          className={accent ? "text-brand" : "text-text-tertiary"}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.07em] text-text-tertiary">
          {label}
        </span>
      </div>
      <div className="text-[32px] font-semibold tracking-[-0.03em] text-text-primary">
        {value}
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-[140px] shrink-0 truncate text-right font-mono text-[11px] text-text-secondary sm:w-[180px]">
        {label}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-full bg-subtle" style={{ height: 6 }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: color ?? "oklch(0.65 0.18 250)",
          }}
        />
      </div>
      <div className="w-8 shrink-0 text-right font-mono text-[12px] font-semibold text-text-primary">
        {count}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default async function PulsePage() {
  const [stats, trending] = await Promise.all([
    getPulseStats(),
    getTrendingJobs(5),
  ]);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chainwork-tau.vercel.app";

  const topEco = stats.ecosystemBreakdown[0]?.eco ?? "evm";
  const topEcoLabel =
    ECOSYSTEMS[topEco]?.label ?? topEco.toUpperCase();

  const tweetText = encodeURIComponent(
    `🔥 Crypto Hiring Pulse — ${stats.totalJobs} open roles across ${stats.totalCompanies} Web3 companies\n\n` +
      `• ${stats.jobsThisWeek} new this week\n` +
      `• Top ecosystem: ${topEcoLabel}\n\n` +
      `Full breakdown 👇\n${siteUrl}/pulse\n\n#crypto #web3 #hiring`,
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const maxEco = stats.ecosystemBreakdown[0]?.count ?? 1;
  const maxRole = stats.roleBreakdown[0]?.count ?? 1;

  return (
    <div className="min-h-dvh pb-[76px] md:pb-0">
      <GlassNav />

      <main className="mx-auto max-w-[960px] px-5 py-8 md:px-6">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent-green" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent-green">
                Live · updated daily
              </span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[36px]">
              Crypto Hiring Pulse
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Real-time snapshot of who&apos;s hiring across {stats.totalCompanies.toLocaleString()} crypto &amp; Web3 companies.
            </p>
          </div>

          {/* Share CTA */}
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-glass px-4 py-2.5 text-[13px] font-medium text-text-bright transition-colors hover:bg-surface"
          >
            <Share2 size={13} />
            Share on X
          </a>
        </div>

        {/* ── Stats grid ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Briefcase}
            value={stats.totalJobs.toLocaleString()}
            label="Open roles"
            accent
          />
          <StatCard
            icon={Users}
            value={stats.totalCompanies.toLocaleString()}
            label="Companies hiring"
          />
          <StatCard
            icon={Zap}
            value={stats.jobsThisWeek.toLocaleString()}
            label="Added this week"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.jobsToday.toLocaleString()}
            label="Added today"
          />
        </div>

        {/* ── Two-column: ecosystem + role breakdown ── */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Ecosystem breakdown */}
          <div className="rounded-xl border border-subtle bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-text-tertiary" />
              <h2 className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-text-tertiary">
                Jobs by Ecosystem
              </h2>
            </div>
            <div className="space-y-3">
              {stats.ecosystemBreakdown.slice(0, 10).map(({ eco, count }) => {
                const meta = ECOSYSTEMS[eco];
                return (
                  <BarRow
                    key={eco}
                    label={meta?.label ?? eco.toUpperCase()}
                    count={count}
                    max={maxEco}
                    color={
                      typeof meta?.bg === "string" && !meta.bg.startsWith("linear")
                        ? meta.bg
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* Role breakdown */}
          <div className="rounded-xl border border-subtle bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-text-tertiary" />
              <h2 className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-text-tertiary">
                Jobs by Role
              </h2>
            </div>
            <div className="space-y-3">
              {stats.roleBreakdown.slice(0, 9).map(({ role, count }) => (
                <BarRow
                  key={role}
                  label={role}
                  count={count}
                  max={maxRole}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Top hiring companies ── */}
        <div className="mb-8 rounded-xl border border-subtle bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-text-tertiary" />
              <h2 className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-text-tertiary">
                Top Hiring Companies
              </h2>
            </div>
            <a
              href="/jobs"
              className="flex items-center gap-1 text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Browse all <ArrowRight size={11} />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {stats.topCompanies.map((c, rank) => (
              <a
                key={c.slug}
                href={`/jobs?q=${encodeURIComponent(c.name)}`}
                className="flex items-center gap-3 rounded-lg border border-subtle p-3 transition-colors hover:border-line hover:bg-glass"
              >
                <span className="font-mono text-[11px] text-text-muted">
                  {String(rank + 1).padStart(2, "0")}
                </span>
                <CompanyLogo
                  name={c.name}
                  website={c.website}
                  logoText={c.logoText}
                  logoBg={c.logoBg}
                  logoFg={c.logoFg}
                  className="h-8 w-8 rounded-lg text-[12px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-text-primary">
                    {c.name}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[12px] font-semibold text-text-tertiary">
                  {c.count} role{c.count !== 1 ? "s" : ""}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Trending jobs ── */}
        {trending.length > 0 && (
          <div className="rounded-xl border border-subtle bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-text-tertiary" />
              <h2 className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-text-tertiary">
                Trending Roles
              </h2>
              <span className="ml-1 rounded-full bg-accent-orange/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-accent-orange">
                Hot
              </span>
            </div>
            <div className="space-y-2">
              {trending.map((job) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-subtle p-3 transition-colors hover:border-line hover:bg-glass"
                >
                  <CompanyLogo
                    name={job.company.name}
                    website={job.company.website}
                    logoText={job.company.logoText}
                    logoBg={job.company.logoBg}
                    logoFg={job.company.logoFg}
                    className="h-8 w-8 rounded-lg text-[12px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text-primary">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {job.company.name} · {formatSalary(job.salaryMin, job.salaryMax)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {job.ecosystems.slice(0, 2).map((e) => (
                      <EcoBadge key={e} ecosystem={e} />
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Share footer ── */}
        <div className="mt-8 rounded-xl border border-brand/20 bg-brand/5 p-6 text-center">
          <div className="mb-1 text-[16px] font-semibold text-text-primary">
            Found this useful?
          </div>
          <p className="mb-4 text-[13px] text-text-secondary">
            Share the Pulse with your network — it helps the whole Web3 community.
          </p>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1d9bf0] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Share2 size={13} />
            Post on X (Twitter)
          </a>
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}
