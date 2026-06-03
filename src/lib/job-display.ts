import type { JobWithCompany } from "@/db/queries";

/**
 * Display-layer arrangement for job lists. PURE — no DB, no I/O — so the
 * underlying data (and the /api/jobs, MCP, llms.txt surfaces that read it)
 * is never mutated. This only decides how rows are GROUPED and ORDERED on
 * screen:
 *
 *  1. Near-duplicate merge — same company + same normalized title (e.g. a
 *     BitGo role posted for SF and Palo Alto) collapses to one card that
 *     lists every location and the widest salary range. Each original role
 *     keeps its own slug / apply URL via `variants`.
 *  2. Per-company cap + round-robin interleave — at most `COMPANY_CAP` cards
 *     per company in a default list, spread out so one company can't carpet
 *     the feed. The overflow is surfaced as a "view all" link, never deleted.
 *  3. Cross-section dedup — a role already shown in featured/trending can be
 *     excluded from the latest feed by passing its key in `excludeKeys`.
 *
 * Graceful degrade: the cap only engages when there's real company diversity
 * (>= CAP_MIN_DISTINCT_COMPANIES); with one or two companies the page fills
 * naturally instead of collapsing to a near-empty list.
 */

/** Max cards per company in a capped (default) list. Tunable. */
export const COMPANY_CAP = 3;

/** Below this many distinct companies, capping is skipped (page would thin). */
const CAP_MIN_DISTINCT_COMPANIES = 3;

/** Normalize a title for dup-matching: lowercase, strip punctuation, collapse. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable identity for a role across locations: company + normalized title. */
export function cardKey(job: JobWithCompany): string {
  return `${job.companyId}|${normalizeTitle(job.title)}`;
}

export interface JobCard {
  /** First-seen role; drives the title, company, link, blurb. */
  primary: JobWithCompany;
  /** Every merged role (incl. primary), original order — slugs/apply preserved. */
  variants: JobWithCompany[];
  /** Distinct, non-empty locations across the variants. */
  locations: string[];
  /** Widest disclosed salary across variants (0 = undisclosed). */
  salaryMin: number;
  salaryMax: number;
  key: string;
}

export interface DisplayCard extends JobCard {
  /** Set on a company's last visible card when more were capped away. */
  overflow?: { companyName: string; companySlug: string; hidden: number };
}

/** Collapse same-company same-title roles into one card. Order preserved. */
export function mergeNearDuplicates(jobs: JobWithCompany[]): JobCard[] {
  const groups = new Map<string, JobWithCompany[]>();
  const order: string[] = [];
  for (const job of jobs) {
    const key = cardKey(job);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(job);
  }
  return order.map((key) => {
    const variants = groups.get(key)!;
    const locations = Array.from(
      new Set(variants.map((v) => v.location).filter((l): l is string => Boolean(l))),
    );
    const mins = variants.map((v) => v.salaryMin).filter((n) => n > 0);
    const maxs = variants.map((v) => v.salaryMax).filter((n) => n > 0);
    return {
      primary: variants[0],
      variants,
      locations,
      salaryMin: mins.length ? Math.min(...mins) : 0,
      salaryMax: maxs.length ? Math.max(...maxs) : 0,
      key,
    };
  });
}

/** Emit cards company-by-company in rounds, at most `cap` per company. */
function roundRobin(
  byCompany: Map<string, JobCard[]>,
  order: string[],
  cap: number,
): JobCard[] {
  const out: JobCard[] = [];
  const maxLen = Math.max(0, ...Array.from(byCompany.values(), (l) => l.length));
  const rounds = Math.min(cap, maxLen);
  for (let round = 0; round < rounds; round++) {
    for (const id of order) {
      const list = byCompany.get(id)!;
      if (round < list.length) out.push(list[round]);
    }
  }
  return out;
}

/**
 * Arrange a flat job list into display cards.
 * @param opts.cap         max cards per company (default COMPANY_CAP)
 * @param opts.releaseCap  show every card (single-company view / fit sort)
 * @param opts.excludeKeys card keys already shown elsewhere on the page
 */
export function arrangeJobs(
  jobs: JobWithCompany[],
  opts: { cap?: number; releaseCap?: boolean; excludeKeys?: Set<string> } = {},
): { cards: DisplayCard[]; totalCards: number } {
  const cap = opts.cap ?? COMPANY_CAP;
  let cards = mergeNearDuplicates(jobs);
  if (opts.excludeKeys?.size) {
    cards = cards.filter((c) => !opts.excludeKeys!.has(c.key));
  }
  const totalCards = cards.length;

  const byCompany = new Map<string, JobCard[]>();
  const order: string[] = [];
  for (const c of cards) {
    const id = c.primary.companyId;
    if (!byCompany.has(id)) {
      byCompany.set(id, []);
      order.push(id);
    }
    byCompany.get(id)!.push(c);
  }

  const applyCap =
    !opts.releaseCap && order.length >= CAP_MIN_DISTINCT_COMPANIES;

  if (!applyCap) {
    // No cap — keep original order (releaseCap) so fit/company views are exact.
    return { cards: cards.map((c) => ({ ...c })), totalCards };
  }

  const shown: DisplayCard[] = roundRobin(byCompany, order, cap).map((c) => ({
    ...c,
  }));

  // Attach the overflow link to each capped company's last visible card.
  for (const id of order) {
    const all = byCompany.get(id)!;
    if (all.length <= cap) continue;
    let lastIdx = -1;
    for (let i = 0; i < shown.length; i++) {
      if (shown[i].primary.companyId === id) lastIdx = i;
    }
    if (lastIdx >= 0) {
      shown[lastIdx] = {
        ...shown[lastIdx],
        overflow: {
          companyName: all[0].primary.company.name,
          companySlug: all[0].primary.company.slug,
          hidden: all.length - cap,
        },
      };
    }
  }

  return { cards: shown, totalCards };
}
