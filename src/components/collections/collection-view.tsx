import Link from "next/link";
import { ChevronRight, SearchX, ArrowRight, Bell } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { ListRow } from "@/components/jobs/list-row";
import type { JobWithCompany } from "@/db/queries";
import type { FaqItem } from "@/lib/collection-faq";

export type CrumbLink = { label: string; href?: string };

export type RelatedLink = { label: string; href: string; count?: number };

export type RelatedGroup = { heading: string; links: RelatedLink[] };

/**
 * Shared chrome for every programmatic collection page (role / ecosystem /
 * combo). Renders an answer-style intro, the live listing set, and internal
 * cross-links — the link graph that lets crawlers and agents walk the whole
 * surface. The ItemList JSON-LD is injected by the caller (it owns the path).
 */
export function CollectionView({
  breadcrumb,
  kicker,
  h1,
  intro,
  jobs,
  related,
  faq,
}: {
  breadcrumb: CrumbLink[];
  kicker: string;
  h1: string;
  intro: string;
  jobs: JobWithCompany[];
  related: RelatedGroup[];
  faq?: FaqItem[];
}) {
  return (
    <div className="min-h-dvh">
      <GlassNav />

      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />

        <div className="relative mx-auto max-w-[920px] px-5 pb-16 pt-4 md:pt-6">
          {/* breadcrumb */}
          <nav className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[11px] text-text-tertiary">
            {breadcrumb.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight size={11} className="shrink-0 text-text-muted" />
                )}
                {c.href ? (
                  <Link
                    href={c.href}
                    prefetch={false}
                    className="text-text-tertiary transition-colors hover:text-text-secondary"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-text-secondary">{c.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* header */}
          <div className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
            {kicker}
          </div>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.12] tracking-[-0.025em] text-text-primary md:text-[34px]">
            {h1}
          </h1>
          <p className="mt-3 max-w-[680px] text-[14.5px] leading-[1.6] text-text-secondary">
            {intro}
          </p>

          {/* listings */}
          {jobs.length === 0 ? (
            <div className="cw-card mt-8 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-glass">
                <SearchX size={20} className="text-text-tertiary" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-text-primary">
                No open roles here right now
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-text-secondary">
                New roles are ingested daily from real ATS feeds. Set an alert
                and we&apos;ll email you the moment one opens.
              </p>
              <Link
                href="/alerts"
                className="cw-apply mt-5 h-9 px-4 text-[13px]"
              >
                <Bell size={13} />
                Set an alert
              </Link>
            </div>
          ) : (
            <div className="cw-card mt-8 divide-y divide-subtle overflow-hidden rounded-2xl">
              {jobs.map((job) => (
                <ListRow key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* data-driven FAQ, visible Q&A backed by FAQPage JSON-LD (AEO) */}
          {faq && faq.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                Questions &amp; answers
              </h2>
              <dl className="cw-card divide-y divide-subtle overflow-hidden rounded-2xl">
                {faq.map((item, i) => (
                  <div key={i} className="px-5 py-4">
                    <dt className="text-[14px] font-semibold text-text-primary">
                      {item.q}
                    </dt>
                    <dd className="mt-1.5 text-[13.5px] leading-[1.6] text-text-secondary">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* internal cross-links, the surface's link graph */}
          {related.length > 0 && (
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {related.map((group) => (
                <section key={group.heading}>
                  <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                    {group.heading}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12.5px] text-text-secondary transition-colors hover:border-line hover:text-text-primary"
                        >
                          {link.label}
                          {typeof link.count === "number" && (
                            <span className="font-mono text-[10.5px] text-text-tertiary">
                              {link.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {/* agent-native footnote */}
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-subtle pt-6 text-[12px] text-text-tertiary">
            <span>Machine-readable:</span>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-text-secondary transition-colors hover:text-text-primary"
            >
              /llms.txt
              <ArrowRight size={11} />
            </a>
            <span className="text-text-muted">·</span>
            <a
              href="/api/jobs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-text-secondary transition-colors hover:text-text-primary"
            >
              JSON API
              <ArrowRight size={11} />
            </a>
            <span className="text-text-muted">·</span>
            <Link
              href="/mcp"
              prefetch={false}
              className="inline-flex items-center gap-1 font-mono text-text-secondary transition-colors hover:text-text-primary"
            >
              MCP
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
