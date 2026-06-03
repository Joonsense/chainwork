import { Search } from "lucide-react";

const TRY_CHIPS = [
  "AI agents",
  "ZK research",
  "AI x DeFi",
  "Founding engineer",
  "Rust senior",
  "Smart contract auditor",
];

/**
 * Home hero — live counter, headline, command-style search box, try chips.
 * Search input is a visual placeholder; real search lands in P5.
 */
export function Hero({
  jobCount,
  companyCount,
  indexedLabel,
}: {
  jobCount: number;
  companyCount: number;
  indexedLabel: string;
}) {
  return (
    <section className="relative px-5 pb-10 pt-6 md:px-6 md:pb-12 md:pt-8">
      <div className="cw-ambient" />
      <div className="relative mx-auto max-w-[1240px] text-center">
        {/* live counter */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-glass px-2.5 py-1 text-[11.5px] text-text-secondary">
          <span className="cw-dot" />
          <span>
            <span className="text-text-primary">
              {jobCount.toLocaleString()} live roles
            </span>{" "}
            at{" "}
            <span className="text-text-primary">
              {companyCount.toLocaleString()} companies
            </span>
          </span>
          <span className="text-text-muted">·</span>
          <span className="font-mono text-[10.5px]">
            indexed {indexedLabel} ago
          </span>
        </div>

        {/* headline */}
        <h1 className="mx-auto max-w-[820px] text-[33px] font-semibold leading-[1.07] tracking-[-0.03em] text-text-primary md:text-[60px] md:leading-[1.04] md:tracking-[-0.035em]">
          The registry for{" "}
          <span
            style={{
              backgroundImage:
                "linear-gradient(90deg, oklch(0.85 0.13 250), oklch(0.75 0.2 295), oklch(0.85 0.13 200))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AI × crypto
          </span>{" "}
          engineering roles.
        </h1>

        <p className="mx-auto mt-4 max-w-[620px] text-[14px] leading-[1.55] text-text-secondary md:text-[16px]">
          Salary-transparent and open-source. Built for humans and AI agents
          alike, searchable over MCP. Indexed daily from real ATS feeds.
        </p>

        {/* search box — a real inline search that lands on /jobs?q=.
            Cmd+K still opens the command palette globally (mounted in layout). */}
        <div className="mx-auto mt-7 max-w-[680px]">
          <form
            action="/jobs"
            role="search"
            className="cw-glass cw-bordered flex items-center gap-2 rounded-2xl p-2 md:gap-3 md:p-3"
          >
            <Search
              size={18}
              className="ml-1.5 shrink-0 text-text-tertiary"
            />
            <input
              name="q"
              type="search"
              enterKeyHint="search"
              placeholder="senior rust · zk · solana…"
              aria-label="Search roles, skills, and companies"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <kbd className="hidden h-[24px] min-w-[24px] items-center justify-center rounded-md border border-line bg-glass-hi px-1.5 font-mono text-[11px] text-text-secondary md:inline-flex">
              ⌘K
            </kbd>
            <button
              type="submit"
              className="cw-apply h-9 shrink-0 px-4 text-[13px]"
            >
              Search
            </button>
          </form>

          {/* try chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[11px] text-text-tertiary">Try:</span>
            {TRY_CHIPS.map((chip) => (
              <a
                key={chip}
                href={`/jobs?q=${encodeURIComponent(chip)}`}
                className="rounded-[5px] border border-line bg-glass-hi px-2 py-[3px] font-mono text-[11px] text-text-bright transition-colors hover:border-strong hover:text-text-primary"
              >
                {chip}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
