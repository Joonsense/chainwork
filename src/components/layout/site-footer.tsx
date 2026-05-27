import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

/**
 * Sitewide footer — mounted in the root layout, so every page gets it.
 * Four grouped columns + brand row. Mobile collapses to a single column.
 */

type Group = {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
};

const GROUPS: Group[] = [
  {
    heading: "Product",
    links: [
      { label: "Jobs", href: "/" },
      { label: "Pulse", href: "/pulse" },
      { label: "Job alerts", href: "/alerts" },
      { label: "Salaries", href: "/salaries" },
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
      { label: "llms.txt", href: "/llms.txt" },
      { label: "JSON API", href: "/api/jobs" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Who we are", href: "/about" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-subtle bg-bg-base">
      <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-6 md:py-16">
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
              <ul className="space-y-2 text-[13px]">
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

        <div className="mt-10 flex flex-col gap-2 border-t border-subtle pt-6 text-[11px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            © {new Date().getFullYear()} Chainwork Labs
          </p>
          <p className="font-mono">
            built for the agents searching · transparent for the engineers
            reading
          </p>
        </div>
      </div>
    </footer>
  );
}
