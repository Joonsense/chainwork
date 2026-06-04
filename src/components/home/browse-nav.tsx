import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EcoBadge } from "@/components/ui/eco-badge";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import {
  ROLE_OPTIONS,
  ECOSYSTEM_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/jobs-search-params";
import type { FacetCounts } from "@/db/queries";

/**
 * Home browse sidebar — replaces the old fake-data filter panel. Shows REAL
 * facet counts (computed from the live catalogue) as links into the filtered
 * /jobs view, so it's both honest and functional. The interactive filters
 * proper live on /jobs, where the URL state actually drives results.
 */

type Item = { href: string; label: string; count: number; eco?: string };

function Group({ title, items }: { title: string; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-t border-subtle py-3.5">
      <div className="mb-1.5 text-[12px] font-semibold text-text-primary">
        {title}
      </div>
      <div className="flex flex-col">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="cw-focus -mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-[5px] text-[12.5px] text-text-secondary transition-colors hover:bg-glass-hi hover:text-text-primary"
          >
            <span className="flex min-w-0 items-center gap-2">
              {it.eco && <EcoBadge ecosystem={it.eco} />}
              <span className="truncate">{it.label}</span>
            </span>
            <span className="font-mono text-[10.5px] text-text-tertiary">
              {it.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function rank(items: Item[], n: number): Item[] {
  return items
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function BrowseNav({
  facets,
  className = "",
}: {
  facets: FacetCounts;
  className?: string;
}) {
  const roles = rank(
    ROLE_OPTIONS.map((o) => ({
      href: `/jobs?role=${o.value}`,
      label: o.label,
      count: facets.role[o.value] ?? 0,
    })),
    7,
  );
  const ecos = rank(
    ECOSYSTEM_OPTIONS.map((e) => ({
      href: `/jobs?eco=${e}`,
      label: ECOSYSTEMS[e]?.label ?? e,
      count: facets.eco[e] ?? 0,
      eco: e,
    })),
    6,
  );
  const locs = rank(
    LOCATION_OPTIONS.map((o) => ({
      href: `/jobs?loc=${o.value}`,
      label: o.label,
      count: facets.loc[o.value] ?? 0,
    })),
    4,
  );

  return (
    <aside className={`self-start lg:sticky lg:top-20 ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-primary">
          Browse
        </span>
        <Link
          href="/jobs"
          className="cw-focus flex items-center gap-1 font-mono text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
        >
          Filters
          <ArrowRight size={10} />
        </Link>
      </div>

      <Group title="Role" items={roles} />
      <Group title="Ecosystem" items={ecos} />
      <Group title="Location" items={locs} />
    </aside>
  );
}
