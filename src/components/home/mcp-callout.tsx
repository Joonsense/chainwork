import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Home callout — surfaces the MCP server above-the-fold so visitors
 * arriving from Hacker News / AI Twitter immediately see the wedge
 * (agent-native search). Compact, one-line on desktop; stacks on mobile.
 */
export function McpCallout() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-6 pt-1 md:px-6">
      <Link
        href="/mcp"
        className="group flex flex-col gap-3 rounded-2xl border border-accent-blue/30 bg-accent-blue/5 px-4 py-4 transition-colors hover:border-accent-blue/60 hover:bg-accent-blue/10 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
      >
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/20 text-accent-blue">
            <Sparkles size={15} />
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent-blue">
            MCP server
          </span>
        </div>

        <div className="flex-1 text-[13.5px] leading-snug text-text-secondary sm:text-[14px]">
          <span className="text-text-primary">
            Searching from Claude, Cursor, or Windsurf?
          </span>{" "}
          Connect your agent directly — two tools, no scraping.
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-accent-blue/40 bg-bg-base px-3 py-1.5 font-mono text-[11.5px] text-accent-blue transition-colors group-hover:border-accent-blue group-hover:bg-accent-blue group-hover:text-bg-base sm:self-auto">
          Setup
          <ArrowRight size={11} />
        </span>
      </Link>
    </section>
  );
}
