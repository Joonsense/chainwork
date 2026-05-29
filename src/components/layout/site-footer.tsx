import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

/**
 * Sitewide footer — mounted in the root layout, so every page gets it.
 * Leads with the agent-native differentiator (llms.txt + MCP), then four
 * grouped link columns. Mobile collapses to a single column.
 */

type Group = {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
};

const GROUPS: Group[] = [
  {
    heading: "Product",
    links: [
      { label: "Browse roles", href: "/" },
      { label: "All jobs", href: "/jobs" },
      { label: "Hiring Pulse", href: "/pulse" },
      { label: "Job alerts", href: "/alerts" },
    ],
  },
  {
    heading: "For Companies",
    links: [
      { label: "Why chainwork", href: "/for-companies" },
      { label: "Pricing", href: "/pricing" },
      { label: "Post a job", href: "/post" },
    ],
  },
  {
    heading: "For Agents",
    links: [
      { label: "MCP server", href: "/mcp" },
      { label: "llms.txt", href: "/llms.txt", external: true },
      { label: "JSON API", href: "/api/jobs", external: true },
      { label: "Sitemap", href: "/sitemap.xml", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

/* The two machine-readable entry points, surfaced as copy-friendly chips. */
const AGENT_ENDPOINTS = [
  { method: "GET", path: "/llms.txt", href: "/llms.txt" },
  { method: "MCP", path: "/api/mcp/mcp", href: "/mcp" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-subtle bg-base">
      {/* gradient hairline echoing the brand mark */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.68 0.2 295 / 0.5), oklch(0.72 0.16 250 / 0.5), transparent)",
        }}
      />

      <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-6 md:py-16">
        {/* ── agent-native banner ── */}
        <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="max-w-[440px]">
            <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-accent-cyan">
              Agent-native
            </div>
            <p className="text-[14px] leading-snug text-text-secondary">
              Point your AI agent straight at the catalog — no scraping, no
              HTML parsing. Structured, salary-transparent, indexed daily.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {AGENT_ENDPOINTS.map((e) => (
              <Link
                key={e.path}
                href={e.href}
                prefetch={false}
                className="group inline-flex items-center gap-2 rounded-lg border border-line bg-glass px-3 py-2 font-mono text-[11.5px] text-text-bright transition-colors hover:border-strong hover:bg-glass-hi"
              >
                <span className="text-accent-blue">{e.method}</span>
                <span className="text-text-secondary">{e.path}</span>
                <ArrowUpRight
                  size={12}
                  className="text-text-tertiary transition-colors group-hover:text-text-primary"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ── link columns ── */}
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-8">
          <div>
            <BrandLogo size={16} />
            <p className="mt-3 max-w-[280px] text-[12.5px] leading-relaxed text-text-tertiary">
              The registry for AI × crypto engineering roles.
              Salary-transparent. Agent-native. Indexed daily.
            </p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                {group.heading}
              </h3>
              <ul className="space-y-2.5 text-[13px]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        prefetch={false}
                        className="text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-subtle pt-6 text-[11px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© {new Date().getFullYear()} Chainwork Labs</p>
          <p className="font-mono">
            built for the agents searching · transparent for the engineers
            reading
          </p>
        </div>
      </div>
    </footer>
  );
}
