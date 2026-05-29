import type { Metadata } from "next";
import Link from "next/link";
import { GlassNav } from "@/components/layout/glass-nav";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "ChainWork is the registry of AI × crypto engineering roles — built by an AEO operator who needed it to exist. Machine-readable, agent-native, salary-transparent.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[680px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              About
            </span>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.025em] text-text-primary md:text-[40px]">
              Built for the AI agent doing the searching.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
              ChainWork is the registry of AI × crypto engineering roles. Every
              job is structured, salary-transparent, and machine-readable —
              because the next decade of hiring runs through agents, not
              keyword search.
            </p>
          </header>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              The wedge
            </h2>
            <p className="mb-4 text-[14px] leading-relaxed text-text-secondary">
              Every other web3 job board is a list of links. The same Greenhouse
              and Lever feeds, re-skinned. We started there too — but the
              opening isn&apos;t another aggregator. It&apos;s being the source
              an AI agent <em>chooses</em> when someone asks it{" "}
              <span className="text-text-primary">
                &quot;what AI × crypto founding engineer roles exist this week?&quot;
              </span>
            </p>
            <p className="text-[14px] leading-relaxed text-text-secondary">
              That means we are not optimizing for SEO traffic against
              Web3.career. We are optimizing for being the cleanest, deepest,
              most-citeable index at the intersection of AI and crypto
              engineering. A different game.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              What that looks like
            </h2>
            <ul className="space-y-3 text-[14px] leading-relaxed text-text-secondary">
              <li className="rounded-lg border border-subtle bg-elevated p-4">
                <span className="font-semibold text-text-primary">
                  MCP server (built-in).
                </span>{" "}
                Connect Claude, Cursor, or any MCP-compatible agent to{" "}
                <Link href="/mcp" className="text-accent-blue hover:underline">
                  /mcp
                </Link>{" "}
                — your agent searches our database with two tools, no scraping.
              </li>
              <li className="rounded-lg border border-subtle bg-elevated p-4">
                <span className="font-semibold text-text-primary">
                  llms.txt + per-role markdown.
                </span>{" "}
                Every job is fetchable as plain markdown at{" "}
                <code className="font-mono text-[12px] text-text-primary">
                  /llms/&lt;slug&gt;.md
                </code>
                . No HTML parsing.
              </li>
              <li className="rounded-lg border border-subtle bg-elevated p-4">
                <span className="font-semibold text-text-primary">
                  JSON-LD on every job.
                </span>{" "}
                schema.org JobPosting, pre-computed. Google JobSearch and any
                downstream parser get the same canonical view as your eyes do.
              </li>
              <li className="rounded-lg border border-subtle bg-elevated p-4">
                <span className="font-semibold text-text-primary">
                  AI matching by GitHub or CV.
                </span>{" "}
                Drop a GitHub profile or resume — we extract your skill graph
                and rank roles by actual fit.
              </li>
              <li className="rounded-lg border border-subtle bg-elevated p-4">
                <span className="font-semibold text-text-primary">
                  Salary-transparent, no exceptions.
                </span>{" "}
                Min and max in USD. &quot;Competitive&quot; is a refusal to
                quote, not a number.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Who&apos;s building this
            </h2>
            <p className="mb-3 text-[14px] leading-relaxed text-text-secondary">
              A solo founder who also runs an AEO (Answer Engine Optimization)
              SaaS. ChainWork is partly the personal dogfood for that work —
              every architectural choice (MCP, llms.txt, JSON-LD, structured
              everything) is a live experiment in how to be cited by ChatGPT,
              Claude, Perplexity, and Gemini.
            </p>
            <p className="text-[14px] leading-relaxed text-text-secondary">
              That&apos;s the operator&apos;s edge here: the person designing
              the agent-native surface ships AI-search optimization as a day
              job.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Today&apos;s scope
            </h2>
            <p className="mb-3 text-[14px] leading-relaxed text-text-secondary">
              We ingest from Greenhouse, Lever, and Ashby across dozens of crypto
              and AI-adjacent companies, growing daily. Engineering only — Sales / Marketing /
              Ops / Design / PM are filtered out at ingest. The AI × crypto
              wedge sharpens over time; broader web3 engineering is welcome
              today.
            </p>
            <p className="text-[14px] leading-relaxed text-text-secondary">
              Hiring at one of these companies and not seeing your roles?{" "}
              <Link href="/post" className="text-accent-blue hover:underline">
                Post one
              </Link>{" "}
              or email us to add your ATS slug.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Get in
            </h2>
            <ul className="space-y-2 text-[14px] text-text-secondary">
              <li>
                <Link href="/jobs" className="text-accent-blue hover:underline">
                  Browse the catalog
                </Link>
              </li>
              <li>
                <Link href="/mcp" className="text-accent-blue hover:underline">
                  Connect via MCP
                </Link>
              </li>
              <li>
                <Link
                  href="/alerts"
                  className="text-accent-blue hover:underline"
                >
                  Email alerts on new roles
                </Link>
              </li>
              <li>
                <Link
                  href="/pulse"
                  className="text-accent-blue hover:underline"
                >
                  Hiring Pulse — live trends
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
