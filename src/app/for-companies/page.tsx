import type { Metadata } from "next";
import Link from "next/link";
import { GlassNav } from "@/components/layout/glass-nav";
import { getHomeStats } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

/* Live so the stat card never claims a stale company/role count. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Companies",
  description:
    "Reach AI × crypto engineers, the ones using AI agents to find work. JSON-LD, llms.txt, MCP-native, salary-transparent. From $150 a week, paid in crypto.",
  alternates: { canonical: `${SITE_URL}/for-companies` },
};

const VALUES: Array<{ title: string; body: string }> = [
  {
    title: "Reached by AI agents",
    body: "We’re the only job board with a native MCP server. Engineers running Claude Desktop, Cursor, or Windsurf find your role through their agent, not through Google.",
  },
  {
    title: "Engineering-only filter",
    body: "Sales, Marketing, PM, Design, Ops, HR are blocked at ingest. Every applicant signal you get is from someone who saw an engineering role, not a generic job feed.",
  },
  {
    title: "Salary transparency = pre-qualified",
    body: "Min / max in USD on every post. Candidates who apply have already accepted the range. Zero “what’s the salary?” first-mail back-and-forth.",
  },
  {
    title: "AI-matched candidates",
    body: "Candidates upload GitHub or CV; we extract their actual skill graph. Your post surfaces to people whose code matches your stack, not just keyword hits.",
  },
  {
    title: "Machine-readable everywhere",
    body: "Every job ships with schema.org JSON-LD and a /llms/<slug>.md mirror. Google JobSearch, Perplexity, ChatGPT, and any downstream parser get a canonical structured view.",
  },
  {
    title: "Crypto-native payment",
    body: "Pay in BTC, ETH, USDC, SOL, USDT, or 200+ tokens via NowPayments. No card-on-file, no fiat conversion, no Stripe.",
  },
];

export default async function ForCompaniesPage() {
  const stats = await getHomeStats();
  const STATS = [
    { value: stats.jobs.toLocaleString(), label: "engineering roles live" },
    { value: stats.companies.toLocaleString(), label: "companies indexed" },
    { value: "Daily", label: "ATS refresh" },
    { value: "MCP", label: "agent-native search" },
  ];
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[860px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              For companies
            </span>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.025em] text-text-primary md:text-[44px] md:leading-[1.05]">
              Hire engineers who are using AI to find their next role.
            </h1>
            <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
              chainwork is where the AI × crypto engineering talent pool meets
              the AI agents searching on their behalf. Post in 3 steps, pay in
              crypto, get applicants who&apos;ve already accepted your salary
              range.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/post"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-blue px-5 text-[14px] font-medium text-[var(--cw-base)] transition-opacity hover:opacity-90"
              >
                Post a job, $150 / week
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-subtle bg-transparent px-5 text-[14px] font-medium text-text-primary transition-colors hover:bg-elevated"
              >
                See pricing
              </Link>
            </div>
          </header>

          <section className="mb-12 grid grid-cols-2 gap-4 rounded-xl border border-subtle bg-elevated p-5 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary md:text-[28px]">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                  {s.label}
                </div>
              </div>
            ))}
          </section>

          <section className="mb-12">
            <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Why chainwork
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-subtle bg-elevated p-5"
                >
                  <h3 className="mb-2 text-[14px] font-semibold text-text-primary">
                    {v.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Already on Greenhouse, Lever, or Ashby?
            </h2>
            <div className="rounded-xl border border-subtle bg-elevated p-6">
              <p className="mb-3 text-[14px] leading-relaxed text-text-secondary">
                You don&apos;t need to post. We auto-ingest your roles daily, 
                engineering only, JSON-LD added, surfaced in the catalog and
                MCP for free.
              </p>
              <p className="text-[14px] leading-relaxed text-text-secondary">
                Email{" "}
                <a
                  href="mailto:hello@chainwork.dev"
                  className="cw-focus text-accent-blue hover:underline"
                >
                  hello@chainwork.dev
                </a>{" "}
                with your company name and ATS slug (e.g.{" "}
                <code className="font-mono text-[12px] text-text-primary">
                  greenhouse:foo
                </code>{" "}
                or{" "}
                <code className="font-mono text-[12px] text-text-primary">
                  lever:bar
                </code>
                ) and we&apos;ll add you to the next cron run — or{" "}
                <Link
                  href="/submit"
                  className="cw-focus text-accent-blue hover:underline"
                >
                  add a single role with the free form
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-accent-blue/40 bg-accent-blue/5 p-6 text-center">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-text-primary">
              Start with one post.
            </h2>
            <p className="mx-auto mt-2 max-w-[480px] text-[14px] leading-relaxed text-text-secondary">
              $150 a week, in crypto. No account. Featured to the top and
              indexed in MCP, llms.txt, REST API, and the catalog within
              minutes.
            </p>
            <Link
              href="/post"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-accent-blue px-6 text-[14px] font-medium text-[var(--cw-base)] transition-opacity hover:opacity-90"
            >
              Post a job
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
