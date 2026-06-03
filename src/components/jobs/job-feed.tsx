"use client";

import { useState } from "react";
import { ListRow, CompanyOverflowRow } from "@/components/jobs/list-row";
import type { DisplayCard } from "@/lib/job-display";

const PAGE = 20;

/**
 * Job results list with a "Load more" pager. The cards are already arranged
 * (near-duplicates merged, per-company cap + interleave applied) on the
 * server; here we just page through them client-side, so the cap stays
 * globally correct instead of fighting server pagination. Mount with a key
 * derived from the filters so a filter change remounts with fresh cards.
 */
export function JobFeed({
  cards,
  totalMatches,
}: {
  cards: DisplayCard[];
  totalMatches: number;
}) {
  const [shown, setShown] = useState(PAGE);
  const visible = cards.slice(0, shown);
  const remaining = cards.length - visible.length;

  return (
    <>
      <div className="cw-card overflow-hidden rounded-2xl">
        {visible.map((card, i) => (
          <div key={card.primary.id} className={i > 0 ? "border-t border-subtle" : ""}>
            <ListRow
              job={card.primary}
              showBlurb={i < 2}
              locations={card.locations}
              variants={
                card.variants.length > 1
                  ? card.variants.map((v) => ({ slug: v.slug, location: v.location }))
                  : undefined
              }
              salaryRange={{ min: card.salaryMin, max: card.salaryMax }}
            />
            {card.overflow && (
              <div className="border-t border-subtle">
                <CompanyOverflowRow {...card.overflow} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="flex h-10 items-center rounded-lg border border-line bg-glass px-5 text-[13px] font-medium text-text-bright transition-colors hover:border-strong"
          >
            Load more · {remaining} left
          </button>
        ) : (
          <span className="text-[11px] text-text-tertiary">End of results</span>
        )}
        <span className="font-mono text-[10.5px] text-text-muted">
          {visible.length} of {cards.length} shown
          {totalMatches !== cards.length ? ` · ${totalMatches} roles` : ""}
        </span>
      </div>
    </>
  );
}
